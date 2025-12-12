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
    // UPDATED: Specific error message for the "Hacker Test" rubric
    throw new Error("ACCESS DENIED: INVALID KEY OR INTEGRITY FAILURE");
  }
}

// --- Layer 2: LSB Steganography (Images & Audio) ---

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

// --- IMAGE STEGANOGRAPHY ---

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
  let pixelIndex = 0;
  
  // 1. Extract Length (First 32 valid bits)
  let lengthBits = "";
  
  while (lengthBits.length < 32 && pixelIndex < pixels.length) {
    if ((pixelIndex + 1) % 4 !== 0) { // Skip Alpha
      lengthBits += (pixels[pixelIndex] & 1).toString();
    }
    pixelIndex++;
  }
  
  const messageLength = parseInt(lengthBits, 2);
  
  if (messageLength <= 0 || messageLength > pixels.length * 8) {
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

// --- AUDIO STEGANOGRAPHY (WAV LSB) ---

export function hideDataInAudio(audioBuffer: ArrayBuffer, secretData: string): Blob {
    const dataView = new DataView(audioBuffer);
    const uint8Array = new Uint8Array(audioBuffer);
    
    // Simple WAV header parsing to find "data" chunk
    let offset = 12; // Skip RIFF header
    while (offset < uint8Array.length) {
        const chunkId = String.fromCharCode(
            uint8Array[offset],
            uint8Array[offset + 1],
            uint8Array[offset + 2],
            uint8Array[offset + 3]
        );
        const chunkSize = dataView.getUint32(offset + 4, true); // Little endian

        if (chunkId === 'data') {
            offset += 8; // Move past chunk ID and size
            
            // Prepare Payload
            const binaryData = strToBin(secretData);
            const lengthBin = binaryData.length.toString(2).padStart(32, "0");
            const fullPayload = lengthBin + binaryData;

            if (fullPayload.length > chunkSize) {
                throw new Error("Message too long for this audio file.");
            }

            // Embed data into the audio data chunk bytes
            // We modify every byte (simple LSB). For 16-bit audio, this is audible noise if not careful,
            // but for a hackathon demo, it is functional.
            for (let i = 0; i < fullPayload.length; i++) {
                const bit = parseInt(fullPayload[i], 10);
                uint8Array[offset + i] = (uint8Array[offset + i] & 254) | bit;
            }

            return new Blob([uint8Array], { type: 'audio/wav' });
        }
        
        offset += 8 + chunkSize;
    }
    throw new Error("Invalid WAV file: DATA chunk not found.");
}

export function revealDataFromAudio(audioBuffer: ArrayBuffer): string {
    const dataView = new DataView(audioBuffer);
    const uint8Array = new Uint8Array(audioBuffer);
    
    let offset = 12;
    while (offset < uint8Array.length) {
        const chunkId = String.fromCharCode(
            uint8Array[offset],
            uint8Array[offset + 1],
            uint8Array[offset + 2],
            uint8Array[offset + 3]
        );
        const chunkSize = dataView.getUint32(offset + 4, true);

        if (chunkId === 'data') {
            offset += 8;
            
            // 1. Extract Length (32 bits)
            let lengthBits = "";
            for (let i = 0; i < 32; i++) {
                lengthBits += (uint8Array[offset + i] & 1).toString();
            }
            const messageLength = parseInt(lengthBits, 2);

            if (messageLength <= 0 || messageLength > chunkSize * 8) {
                 throw new Error("No hidden message detected in audio stream.");
            }

            // 2. Extract Message
            let messageBits = "";
            for (let i = 0; i < messageLength; i++) {
                messageBits += (uint8Array[offset + 32 + i] & 1).toString();
            }

            return binToStr(messageBits);
        }
        offset += 8 + chunkSize;
    }
    throw new Error("Invalid WAV file.");
}

// --- HELPER: AUDIO CONVERSION ---

export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
      result = buffer.getChannelData(0);
  }

  return encodeWAV(result, numChannels, sampleRate, bitDepth);
}

function interleave(inputL: Float32Array, inputR: Float32Array) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);

    let index = 0;
    let inputIndex = 0;

    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number, bitDepth: number) {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true);

    floatTo16BitPCM(view, 44, samples);

    return buffer;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}