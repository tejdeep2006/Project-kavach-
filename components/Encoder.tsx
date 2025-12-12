import React, { useState, useRef, useEffect } from 'react';
import { Lock, Image as ImageIcon, Download, Cpu, Eye, EyeOff, RefreshCw, ChevronLeft, CheckCircle, Scan, ArrowRightLeft, FileWarning, Music, Mic, FileAudio } from 'lucide-react';
import { encryptMessage, hideDataInImage, hideDataInAudio, audioBufferToWav } from '../utils/cryptoUtils';
import { generateBattlePlan, analyzeCoverImage, analyzeCoverAudio } from '../services/geminiService';
import { MediaType } from '../types';

// Hacker scrolling text component
const DataStream: React.FC = () => {
    const [stream, setStream] = useState("");
    useEffect(() => {
        const interval = setInterval(() => {
            let str = "";
            for(let i=0; i<64; i++) {
                str += Math.floor(Math.random()*2);
                if(i%8===0) str += " ";
            }
            setStream(str);
        }, 50);
        return () => clearInterval(interval);
    }, []);
    return <div className="font-mono text-[10px] text-green-500/40 break-all overflow-hidden h-8">{stream}</div>
}

// Simple Audio Waveform Animation
const AudioVisualizer: React.FC = () => {
    return (
        <div className="flex items-center justify-center space-x-1 h-12">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="w-1 bg-green-500 animate-[pulse_1s_ease-in-out_infinite]" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
            ))}
        </div>
    );
};

const Encoder: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  
  const [fileSrc, setFileSrc] = useState<string | null>(null); // Base64 for Image or Audio Preview
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null); // Buffer for Audio Processing (WAV)
  
  const [finalResult, setFinalResult] = useState<string | null>(null); // Base64 output
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingText, setLoadingText] = useState("INITIALIZING AI CORE...");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(isProcessing) {
        const texts = ["ESTABLISHING SECURE UPLINK...", "REQUESTING GEMINI TACTICAL ANALYSIS...", "ENCRYPTING PAYLOAD [AES-256]...", "EMBEDDING HIDDEN DATA STREAM..."];
        let i = 0;
        const interval = setInterval(() => {
            setLoadingText(texts[i % texts.length]);
            i++;
        }, 800);
        return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (mediaType === 'IMAGE') {
          const reader = new FileReader();
          reader.onload = (event) => {
            setFileSrc(event.target?.result as string);
            setAiAnalysis(''); 
            setFinalResult(null);
          };
          reader.readAsDataURL(file);
      } else {
          try {
              setIsProcessing(true);
              setLoadingText("DECODING AUDIO STREAM...");
              
              // 1. Read file as ArrayBuffer
              const arrayBuffer = await file.arrayBuffer();
              
              // 2. Decode Audio (MP3/WAV/etc -> AudioBuffer)
              // Fix: Cast window to any to access webkitAudioContext if AudioContext is missing (Safari fallback)
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
              
              // 3. Convert to WAV ArrayBuffer (Standardized for LSB)
              const wavBuffer = audioBufferToWav(decodedBuffer);
              setAudioBuffer(wavBuffer);
              
              // 4. Create Base64 for Preview/AI Analysis
              const reader = new FileReader();
              reader.onload = (e) => {
                  setFileSrc(e.target?.result as string);
                  setIsProcessing(false);
              };
              reader.readAsDataURL(file); // Keep original for preview
              
              setAiAnalysis('');
              setFinalResult(null);
          } catch (err) {
              console.error(err);
              alert("Error processing audio file. Please try a valid WAV or MP3.");
              setIsProcessing(false);
          }
      }
    }
  };

  const handleGeneratePlan = async () => {
    setIsProcessing(true);
    const plan = await generateBattlePlan();
    setMessage(plan);
    setIsProcessing(false);
  };

  const handleAnalyzeMedia = async () => {
    if (!fileSrc) return;
    setIsProcessing(true);
    let analysis = "";
    if (mediaType === 'IMAGE') {
        analysis = await analyzeCoverImage(fileSrc);
    } else {
        analysis = await analyzeCoverAudio(fileSrc);
    }
    setAiAnalysis(analysis);
    setIsProcessing(false);
  };

  const handleEncode = async () => {
    if (!message || !password) return;
    setIsProcessing(true);

    setTimeout(async () => {
        try {
            const encrypted = await encryptMessage(message, password);
            
            if (mediaType === 'IMAGE' && fileSrc) {
                const img = new Image();
                img.src = fileSrc;
                await new Promise(resolve => { img.onload = resolve; });
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas context failed");
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const newImageData = hideDataInImage(imageData, encrypted);
                ctx.putImageData(newImageData, 0, 0);
                setFinalResult(canvas.toDataURL('image/png'));
            } else if (mediaType === 'AUDIO' && audioBuffer) {
                // Clone buffer
                const bufferCopy = audioBuffer.slice(0);
                const resultBlob = hideDataInAudio(bufferCopy, encrypted);
                const reader = new FileReader();
                reader.onload = (e) => setFinalResult(e.target?.result as string);
                reader.readAsDataURL(resultBlob);
            }
            
            setStep(3);
          } catch (err) {
            alert("Encoding failed: " + (err as Error).message);
          } finally {
            setIsProcessing(false);
          }
    }, 2000); 
  };

  return (
    <div className="max-w-4xl mx-auto clip-corners p-0.5 bg-green-500/20 backdrop-blur-md animate-fade-in">
      <div className="p-8 bg-black clip-corners border border-green-500/20">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-green-900/50">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-900/20 flex items-center justify-center border border-green-500 text-green-500 clip-corners">
                    <Lock className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-widest">ENCRYPTION_MODULE</h2>
                    <p className="text-[10px] text-green-500 tracking-[0.2em]">{isProcessing ? "STATUS: BUSY" : "STATUS: READY"}</p>
                </div>
            </div>
            {/* Steps Visualizer */}
            <div className="flex items-center space-x-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 w-12 skew-x-[-20deg] transition-all ${step >= i ? 'bg-green-500 shadow-[0_0_10px_#10b981]' : 'bg-green-900/30'}`}></div>
                ))}
            </div>
          </div>

          {isProcessing && <DataStream />}

          {step === 1 && (
            <div className="space-y-8 animate-fade-in mt-4">
                {/* Media Type Selection */}
                <div className="flex space-x-4 mb-4">
                    <button 
                        onClick={() => { setMediaType('IMAGE'); setFileSrc(null); setFinalResult(null); }}
                        className={`flex-1 py-3 clip-corners flex items-center justify-center space-x-2 transition-all ${mediaType === 'IMAGE' ? 'bg-green-500 text-black font-bold' : 'border border-green-900 text-green-700 hover:border-green-500'}`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span className="tracking-widest text-xs">IMG_STATION</span>
                    </button>
                    <button 
                        onClick={() => { setMediaType('AUDIO'); setFileSrc(null); setFinalResult(null); }}
                        className={`flex-1 py-3 clip-corners flex items-center justify-center space-x-2 transition-all ${mediaType === 'AUDIO' ? 'bg-green-500 text-black font-bold' : 'border border-green-900 text-green-700 hover:border-green-500'}`}
                    >
                        <Music className="w-4 h-4" />
                        <span className="tracking-widest text-xs">AUDIO_OPS</span>
                    </button>
                </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <label className="text-xs text-green-600 uppercase tracking-wider font-bold">>> INPUT_PAYLOAD (MESSAGE)</label>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={isProcessing}
                        className="flex items-center space-x-2 text-[10px] bg-green-900/20 hover:bg-green-500 hover:text-black border border-green-500/50 text-green-400 px-3 py-1 transition-all uppercase tracking-wider clip-corners"
                    >
                        {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
                        <span>AI_AUTO_GEN</span>
                    </button>
                </div>
                
                <div className="relative group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ENTER CLASSIFIED INTELLIGENCE..."
                    className="w-full h-32 bg-black border border-green-900 p-4 text-green-500 font-mono text-sm focus:border-green-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] outline-none placeholder-green-900 resize-none transition-all"
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] text-green-800">{message.length} CHARS</div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-green-600 uppercase tracking-wider font-bold">>> ENCRYPTION_KEY (PASSWORD)</label>
                <div className="relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER SECURE KEY"
                    className="w-full bg-black border border-green-900 p-4 text-green-500 font-mono text-sm focus:border-green-400 outline-none transition-all pr-12"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-green-700 hover:text-green-400 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!message || !password}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-neutral-900 disabled:text-neutral-700 disabled:border-neutral-800 text-black font-bold tracking-[0.2em] text-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:shadow-none uppercase clip-corners border border-green-500"
              >
                PROCEED >>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in mt-4">
              <div 
                   className={`relative border-2 border-dashed h-64 flex flex-col items-center justify-center cursor-pointer transition-all bg-black/40 overflow-hidden group ${fileSrc || audioBuffer ? 'border-green-500' : 'border-green-900 hover:border-green-600'}`}
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept={mediaType === 'IMAGE' ? "image/*" : "audio/wav, audio/mp3, audio/mpeg"}
                  className="hidden"
                />
                
                {fileSrc || audioBuffer ? (
                  <>
                    {mediaType === 'IMAGE' ? (
                        <img src={fileSrc!} alt="Preview" className="h-full w-full object-contain opacity-50 grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                            <FileAudio className="w-16 h-16 text-green-500 mb-4 animate-pulse" />
                            <AudioVisualizer />
                            {fileSrc && <audio src={fileSrc} controls className="mt-4 w-3/4 opacity-70" />}
                        </div>
                    )}
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 bg-green-500/10 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_#10b981] animate-[scanner_2s_ease-in-out_infinite]"></div>
                    <div className="absolute top-2 left-2 text-[10px] bg-black border border-green-500 text-green-500 px-2 py-1">
                        SCANNING_{mediaType}...
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-green-800 group-hover:text-green-500 transition-colors">
                    {mediaType === 'IMAGE' ? <Scan className="w-12 h-12 mb-4 opacity-70" /> : <Mic className="w-12 h-12 mb-4 opacity-70" />}
                    <p className="text-xl font-bold tracking-widest">UPLOAD {mediaType === 'IMAGE' ? 'CARRIER IMAGE' : 'WAV/MP3 AUDIO'}</p>
                    <p className="text-xs mt-2 opacity-60">{mediaType === 'IMAGE' ? 'PNG / JPG' : 'WAV OR MP3'} SUPPORTED</p>
                  </div>
                )}
              </div>

              {(fileSrc || audioBuffer) && (
                <div className="bg-green-900/10 border border-green-500/30 p-4 flex items-start space-x-4 clip-corners">
                     <FileWarning className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                     <div className="flex-grow font-mono text-xs">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-green-400 tracking-wider">GEMINI_AI_ANALYSIS</h4>
                            {!aiAnalysis && (
                                <button onClick={handleAnalyzeMedia} disabled={isProcessing} className="text-[10px] border border-green-500 px-2 py-0.5 text-green-500 hover:bg-green-500 hover:text-black transition-colors">
                                    EXEC_SCAN
                                </button>
                            )}
                        </div>
                        <p className="text-green-200/70 leading-relaxed">
                            {isProcessing && !aiAnalysis ? <span className="animate-pulse">{loadingText}</span> : aiAnalysis || "WAITING FOR SCAN COMMAND..."}
                        </p>
                     </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-green-900 hover:border-green-500 text-green-600 hover:text-green-500 font-mono text-sm tracking-wider clip-corners"
                >
                    &lt; ABORT
                </button>
                <button
                    onClick={handleEncode}
                    disabled={(!fileSrc && !audioBuffer) || isProcessing}
                    className="flex-grow py-3 bg-green-600 hover:bg-green-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-black font-bold tracking-widest text-lg uppercase shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none flex items-center justify-center space-x-2 clip-corners"
                >
                    {isProcessing ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>PROCESSING...</span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5" />
                            <span>EXECUTE ENCRYPTION</span>
                        </>
                    )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && finalResult && (
            <div className="text-center space-y-8 animate-fade-in py-8">
              <div className="inline-block p-4 border-2 border-green-500 rounded-full mb-2 bg-green-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              <div>
                  <h3 className="text-2xl font-bold text-white tracking-[0.2em] mb-2">MISSION ACCOMPLISHED</h3>
                  <p className="text-green-600/60 font-mono text-xs">PAYLOAD SECURELY EMBEDDED IN CARRIER SIGNAL.</p>
              </div>
              
              {/* Eye Test Section */}
              <div className="bg-black border border-green-900 p-4 clip-corners">
                  <div className="flex items-center justify-between space-x-2 mb-4 text-xs text-green-500 border-b border-green-900 pb-2">
                      <span className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> {mediaType === 'IMAGE' ? 'VISUAL' : 'AUDIO'}_INTEGRITY_CHECK</span>
                      <span className="animate-pulse text-green-400">MATCH: 99.9%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <span className="text-[10px] text-green-700 bg-green-900/10 px-1">ORIGINAL_ASSET</span>
                          {mediaType === 'IMAGE' ? (
                            <img src={fileSrc!} alt="Original" className="w-full h-32 object-cover border border-green-900 grayscale opacity-70" />
                          ) : (
                             <div className="w-full h-32 border border-green-900 flex items-center justify-center bg-green-900/5">
                                <FileAudio className="w-8 h-8 text-green-800" />
                             </div>
                          )}
                      </div>
                      <div className="space-y-2">
                          <span className="text-[10px] text-green-400 bg-green-500/10 px-1">ENCRYPTED_ASSET</span>
                          {mediaType === 'IMAGE' ? (
                             <img src={finalResult} alt="Stego" className="w-full h-32 object-cover border border-green-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                          ) : (
                             <div className="w-full h-32 border border-green-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center justify-center bg-green-500/5">
                                <AudioVisualizer />
                             </div>
                          )}
                      </div>
                  </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                  <a
                    href={finalResult}
                    download={mediaType === 'IMAGE' ? "classified_asset_secured.png" : "classified_audio_secured.wav"}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold tracking-[0.2em] text-lg uppercase flex items-center justify-center space-x-2 transition-colors clip-corners"
                  >
                    <Download className="w-5 h-5" />
                    <span>DOWNLOAD SECURED ASSET</span>
                  </a>
                  
                  <button
                    onClick={() => {
                        setStep(1);
                        setMessage('');
                        setFileSrc(null);
                        setFinalResult(null);
                        setAudioBuffer(null);
                        setPassword('');
                    }}
                    className="text-green-800 hover:text-green-500 text-xs font-mono tracking-widest pt-4"
                  >
                    [ RESET_SYSTEM ]
                  </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Encoder;