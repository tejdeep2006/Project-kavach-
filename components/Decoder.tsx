import React, { useState, useRef } from 'react';
import { Unlock, Upload, FileCode } from 'lucide-react';
import { decryptMessage, revealDataFromImage } from '../utils/cryptoUtils';

const Decoder: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [revealedMessage, setRevealedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setRevealedMessage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDecode = async () => {
    if (!imageSrc || !password) return;
    setError(null);
    setRevealedMessage(null);

    try {
        // 1. Load Image to Canvas
        const img = new Image();
        img.src = imageSrc;
        await new Promise(resolve => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) throw new Error("Canvas error");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 2. Extract Hidden Encrypted String
        const encryptedData = revealDataFromImage(imageData);
        
        // 3. Decrypt with Password
        const plaintext = await decryptMessage(encryptedData, password);
        
        setRevealedMessage(plaintext);
    } catch (err) {
        setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl">
      <div className="flex items-center space-x-2 mb-8 border-b border-neutral-700 pb-4">
        <Unlock className="text-blue-500 w-6 h-6" />
        <h2 className="text-2xl font-bold text-white">Decode Sequence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-neutral-800/50 h-64 flex flex-col justify-center items-center ${imageSrc ? 'border-blue-500' : 'border-neutral-600 hover:border-blue-400'}`}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                />
                {imageSrc ? (
                <img src={imageSrc} alt="Suspect" className="max-h-56 rounded shadow-lg" />
                ) : (
                <>
                    <FileCode className="w-12 h-12 text-neutral-400 mb-2" />
                    <p className="text-neutral-300">Upload Suspicious Image</p>
                </>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Decryption Key</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <button
                onClick={handleDecode}
                disabled={!imageSrc || !password}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-bold rounded-lg transition-all"
            >
                Extract & Decrypt
            </button>
        </div>

        <div className="bg-neutral-950 rounded-xl p-6 border border-neutral-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500"></div>
            <h3 className="text-neutral-400 font-mono text-sm mb-4">DECRYPTED_OUTPUT_STREAM</h3>
            
            {revealedMessage ? (
                <div className="animate-fade-in">
                    <p className="text-green-400 font-mono text-lg break-words leading-relaxed border-l-2 border-green-500 pl-4">
                        {revealedMessage}
                    </p>
                    <div className="mt-4 text-xs text-neutral-600">
                        // END OF TRANSMISSION
                    </div>
                </div>
            ) : error ? (
                <div className="text-red-400 font-mono p-4 border border-red-900/50 bg-red-900/10 rounded">
                    ERROR: {error}
                </div>
            ) : (
                <div className="text-neutral-600 font-mono text-sm flex flex-col items-center justify-center h-48">
                    <div className="animate-pulse">WAITING FOR INPUT...</div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Decoder;
