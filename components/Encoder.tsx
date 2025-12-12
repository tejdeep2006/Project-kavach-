import React, { useState, useRef } from 'react';
import { Lock, Image as ImageIcon, Download, Upload, Cpu, Eye, EyeOff, RefreshCw, ChevronLeft } from 'lucide-react';
import { encryptMessage, hideDataInImage } from '../utils/cryptoUtils';
import { generateBattlePlan, analyzeCoverImage } from '../services/geminiService';

const Encoder: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageSrc(result);
        setAiAnalysis(''); 
        setFinalImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePlan = async () => {
    setIsProcessing(true);
    const plan = await generateBattlePlan();
    setMessage(plan);
    setIsProcessing(false);
  };

  const handleAnalyzeImage = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    const analysis = await analyzeCoverImage(imageSrc);
    setAiAnalysis(analysis);
    setIsProcessing(false);
  };

  const handleEncode = async () => {
    if (!message || !password || !imageSrc) return;
    setIsProcessing(true);

    // Small delay to allow UI to render 'Processing' state if operations are synchronous-heavy
    setTimeout(async () => {
        try {
            // 1. Encrypt Message
            const encrypted = await encryptMessage(message, password);
      
            // 2. Prepare Canvas for Steganography
            const img = new Image();
            img.src = imageSrc;
            await new Promise(resolve => { img.onload = resolve; });
      
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) throw new Error("Canvas context failed");
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
            // 3. Hide Data
            const newImageData = hideDataInImage(imageData, encrypted);
            ctx.putImageData(newImageData, 0, 0);
      
            setFinalImage(canvas.toDataURL('image/png'));
            setStep(3);
          } catch (err) {
            alert("Encoding failed: " + (err as Error).message);
          } finally {
            setIsProcessing(false);
          }
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-900/20 rounded-lg">
                <Lock className="text-green-500 w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Encode Sequence</h2>
                <p className="text-xs text-neutral-500 font-mono">STEP {step} OF 3</p>
            </div>
        </div>
        {/* Progress Dots */}
        <div className="flex space-x-2">
            {[1, 2, 3].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step >= i ? 'bg-green-500' : 'bg-neutral-700'}`}></div>
            ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-neutral-400">1. Operation Directive (Message)</label>
                <button
                    onClick={handleGeneratePlan}
                    disabled={isProcessing}
                    className="flex items-center space-x-1 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-green-400 px-3 py-1.5 rounded transition-colors"
                >
                    {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                    <span>GENERATE VIA GEMINI</span>
                </button>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter classified intelligence here..."
                className="relative w-full h-32 bg-black/40 border border-neutral-700 rounded-lg p-4 text-green-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none font-mono placeholder-neutral-700 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">2. Encryption Key</label>
            <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full bg-black/40 border border-neutral-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-neutral-500 hover:text-white"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!message || !password}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:shadow-none"
          >
            PROCEED TO TARGET SELECTION
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer bg-black/20 ${imageSrc ? 'border-green-500/50 bg-green-500/5' : 'border-neutral-700 hover:border-green-500 hover:bg-neutral-800/50'}`}
               onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {imageSrc ? (
              <div className="relative inline-block">
                <img src={imageSrc} alt="Preview" className="max-h-64 rounded-lg shadow-2xl" />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">CHANGE IMAGE</div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-neutral-400">
                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium text-neutral-300">Upload Cover Image</p>
                <p className="text-sm text-neutral-500 mt-2">Recommended: PNG or High-Quality JPEG</p>
              </div>
            )}
          </div>

          {imageSrc && (
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-xl p-4 flex items-start space-x-3">
                 <Cpu className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                 <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-neutral-300">Gemini Analysis</h4>
                        {!aiAnalysis && (
                            <button onClick={handleAnalyzeImage} disabled={isProcessing} className="text-xs text-green-400 hover:underline">
                                Run Analysis
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isProcessing && !aiAnalysis ? "Scanning pixels..." : aiAnalysis || "Check if this image is a suitable carrier for hidden intel."}
                    </p>
                 </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex items-center space-x-2"
            >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
            </button>
            <button
                onClick={handleEncode}
                disabled={!imageSrc || isProcessing}
                className="flex-grow py-3 bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex justify-center items-center space-x-2"
            >
                {isProcessing ? (
                    <span className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ENCRYPTING & EMBEDDING...</span>
                    </span>
                ) : (
                    <>
                        <Lock className="w-4 h-4" />
                        <span>INITIATE ENCRYPTION</span>
                    </>
                )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && finalImage && (
        <div className="text-center space-y-8 animate-fade-in">
          <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500 mb-4">
                <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">Payload Secured</h3>
            <p className="text-neutral-400 text-sm">The intelligence has been successfully encrypted and woven into the image carrier.</p>
          </div>
          
          <div className="relative inline-block group">
            <img src={finalImage} alt="Stego Result" className="max-h-64 rounded-lg shadow-2xl border border-neutral-700" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <p className="text-white font-mono text-xs">READY FOR DOWNLOAD</p>
            </div>
          </div>
          
          <a
            href={finalImage}
            download="project_kavach_secured.png"
            className="block w-full py-4 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-all shadow-lg flex justify-center items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>DOWNLOAD CARRIER IMAGE</span>
          </a>
          
          <button
            onClick={() => {
                setStep(1);
                setMessage('');
                setImageSrc(null);
                setFinalImage(null);
                setPassword('');
            }}
            className="text-neutral-500 hover:text-white text-sm font-mono tracking-wide"
          >
            [ START NEW OPERATION ]
          </button>
        </div>
      )}
    </div>
  );
};

export default Encoder;