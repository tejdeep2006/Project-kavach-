// --- Layer 1: AES-256 Encryption (Web Crypto API) ---

const ENC_ALGO = 'AES-GCM';

// Generate a key from the password
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ENC_ALGO, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  
  const encodedMessage = enc.encode(message);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: ENC_ALGO, iv: iv },
    key,
    encodedMessage
  );

  // Pack everything into a single buffer: [Salt(16)] [IV(12)] [Content]
  const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
  buffer.set(salt, 0);
  buffer.set(iv, salt.byteLength);
  buffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

  // Return base64 string to be embedding-friendly
  return btoa(String.fromCharCode(...buffer));
}

export async function decryptMessage(encryptedBase64: string, password: string): Promise<string> {
  try {
    const binaryStr = atob(encryptedBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Unpack: [Salt(16)] [IV(12)] [Content]
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const data = bytes.slice(28);

    const key = await getKey(password, salt);
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: ENC_ALGO, iv: iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (e) {
    throw new Error("Decryption failed. Wrong password or corrupted data.");
  }
}

// --- Layer 2: LSB Steganography ---

// Helper to convert string to binary string
function strToBin(str: string): string {
  let bin = "";
  for (let i = 0; i < str.length; i++) {
    bin += str.charCodeAt(i).toString(2).padStart(8, "0");
  }
  return bin;
}

// Helper to convert binary string to text
function binToStr(bin: string): string {
  let str = "";
  for (let i = 0; i < bin.length; i += 8) {
    str += String.fromCharCode(parseInt(bin.slice(i, i + 8), 2));
  }
  return str;
}

export function hideDataInImage(imageData: ImageData, secretData: string): ImageData {
  const binaryData = strToBin(secretData);
  const dataLength = binaryData.length;
  
  // We need to store the length first so we know how much to read back.
  // Store length as 32-bit binary
  const lengthBin = dataLength.toString(2).padStart(32, "0");
  
  const fullPayload = lengthBin + binaryData;
  const pixels = imageData.data;

  if (fullPayload.length > pixels.length * 0.75) {
    throw new Error("Message too long for this cover image.");
  }

  let dataIndex = 0;
  // Iterate pixels. 
  // We use R, G, B channels. Skip Alpha (every 4th byte) to avoid visual artifacts in transparency.
  for (let i = 0; i < pixels.length && dataIndex < fullPayload.length; i++) {
    if ((i + 1) % 4 === 0) continue; // Skip Alpha channel

    // Get the bit we want to hide
    const bit = parseInt(fullPayload[dataIndex], 10);
    
    // Clear the LSB of the pixel byte and set it to our bit
    pixels[i] = (pixels[i] & 254) | bit;
    
    dataIndex++;
  }

  return imageData;
}

export function revealDataFromImage(imageData: ImageData): string {
  const pixels = imageData.data;
  let accumulatedBits = "";
  let dataIndex = 0;
  
  // 1. Extract Length (First 32 valid bits)
  let lengthBits = "";
  let pixelIndex = 0;
  
  while (lengthBits.length < 32 && pixelIndex < pixels.length) {
    if ((pixelIndex + 1) % 4 !== 0) { // Skip Alpha
      lengthBits += (pixels[pixelIndex] & 1).toString();
    }
    pixelIndex++;
  }
  
  const messageLength = parseInt(lengthBits, 2);
  
  if (messageLength <= 0 || messageLength > pixels.length * 8) {
     // This happens if we try to decode a random noise image that isn't ours
     throw new Error("No hidden message detected or file corrupted.");
  }

  // 2. Extract Message
  let messageBits = "";
  while (messageBits.length < messageLength && pixelIndex < pixels.length) {
     if ((pixelIndex + 1) % 4 !== 0) {
       messageBits += (pixels[pixelIndex] & 1).toString();
     }
     pixelIndex++;
  }

  return binToStr(messageBits);
}
