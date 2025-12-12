import React, { useState, useRef, useEffect } from 'react';
import { Unlock, Upload, FileCode, Terminal, AlertTriangle, Trash2, Timer, Music, ImageIcon, FileAudio } from 'lucide-react';
import { decryptMessage, revealDataFromImage, revealDataFromAudio } from '../utils/cryptoUtils';
import { MediaType } from '../types';

const Decoder: React.FC = () => {
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);
  
  const [password, setPassword] = useState<string>('');
  const [revealedMessage, setRevealedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(["> SYSTEM_READY", "> AWAITING_INPUT_STREAM..."]);
  const [autoDestruct, setAutoDestruct] = useState(false);
  const [destructTimer, setDestructTimer] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Self Destruct Logic
  useEffect(() => {
    let interval: any;
    if (destructTimer !== null && destructTimer > 0) {
        interval = setInterval(() => {
            setDestructTimer(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
    } else if (destructTimer === 0) {
        handleSelfDestruct(true);
    }
    return () => clearInterval(interval);
  }, [destructTimer]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      
      if (mediaType === 'IMAGE') {
          reader.onload = (event) => {
            setFileSrc(event.target?.result as string);
            setRevealedMessage(null);
            setError(null);
            addLog(`IMAGE_LOADED: ${file.name}`);
            addLog("ANALYZING BITMAP STRUCTURE...");
          };
          reader.readAsDataURL(file);
      } else {
          reader.onload = (event) => {
            setAudioBuffer(event.target?.result as ArrayBuffer);
            setRevealedMessage(null);
            setError(null);
            addLog(`AUDIO_LOADED: ${file.name}`);
            addLog("ANALYZING PCM STREAM...");
          };
          reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleDecode = async () => {
    if ((!fileSrc && !audioBuffer) || !password) return;
    setError(null);
    setRevealedMessage(null);
    addLog("INITIATING DECRYPTION PROTOCOL...");
    addLog("EXTRACTING LSB DATA STREAM...");

    // Simulated delay for effect
    setTimeout(async () => {
        try {
            let encryptedData = "";
            
            if (mediaType === 'IMAGE' && fileSrc) {
                const img = new Image();
                img.src = fileSrc;
                await new Promise(resolve => { img.onload = resolve; });
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas error");
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                encryptedData = revealDataFromImage(imageData);
            } else if (mediaType === 'AUDIO' && audioBuffer) {
                encryptedData = revealDataFromAudio(audioBuffer);
            }

            addLog("DATA_STREAM FOUND. ATTEMPTING DECRYPTION...");
            const plaintext = await decryptMessage(encryptedData, password);
            setRevealedMessage(plaintext);
            addLog("SUCCESS: PAYLOAD DECRYPTED.");
            
            if (autoDestruct) {
                addLog("AUTO-PURGE SEQUENCE INITIATED: 10 SECONDS.");
                setDestructTimer(10);
            }
        } catch (err) {
            const errorMsg = (err as Error).message;
            setError(errorMsg);
            addLog(`ERROR: ${errorMsg}`);
            addLog("ACCESS_DENIED. TERMINATING PROCESS.");
        }
    }, 1000);
  };

  const handleSelfDestruct = (auto = false) => {
      if(!auto && !window.confirm("CONFIRM: WIPE DECRYPTED INTELLIGENCE?")) return;
      setRevealedMessage(null);
      setFileSrc(null);
      setAudioBuffer(null);
      setPassword('');
      setError(null);
      setDestructTimer(null);
      setLogs(["> SYSTEM_RESET", "> MEMORY_WIPED", "> EVIDENCE DESTROYED."]);
  };

  return (
    <div className="max-w-6xl mx-auto clip-corners p-0.5 bg-blue-500/20 backdrop-blur-md animate-fade-in">
       <div className="p-8 bg-black clip-corners border border-blue-500/20">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8 border-b border-blue-900/50 pb-6">
            <div className="w-12 h-12 bg-blue-900/20 flex items-center justify-center border border-blue-500 text-blue-500 clip-corners">
                <Unlock className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-widest">DECRYPTION_CONSOLE</h2>
                <p className="text-[10px] text-blue-500 tracking-[0.2em]">INTEL_RECOVERY_MODE</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col: Inputs */}
            <div className="space-y-6">
                
                {/* Media Type Selection */}
                <div className="flex space-x-4 mb-2">
                    <button 
                        onClick={() => { setMediaType('IMAGE'); setFileSrc(null); setAudioBuffer(null); setRevealedMessage(null); }}
                        className={`flex-1 py-2 clip-corners flex items-center justify-center space-x-2 transition-all ${mediaType === 'IMAGE' ? 'bg-blue-600 text-black font-bold' : 'border border-blue-900 text-blue-500 hover:border-blue-500'}`}
                    >
                        <ImageIcon className="w-3 h-3" />
                        <span className="tracking-widest text-[10px]">IMG_SOURCE</span>
                    </button>
                    <button 
                        onClick={() => { setMediaType('AUDIO'); setFileSrc(null); setAudioBuffer(null); setRevealedMessage(null); }}
                        className={`flex-1 py-2 clip-corners flex items-center justify-center space-x-2 transition-all ${mediaType === 'AUDIO' ? 'bg-blue-600 text-black font-bold' : 'border border-blue-900 text-blue-500 hover:border-blue-500'}`}
                    >
                        <Music className="w-3 h-3" />
                        <span className="tracking-widest text-[10px]">AUDIO_SOURCE</span>
                    </button>
                </div>

                <div 
                    className={`relative border-2 border-dashed h-48 flex flex-col items-center justify-center cursor-pointer transition-all bg-black/40 group ${fileSrc || audioBuffer ? 'border-blue-500' : 'border-blue-900 hover:border-blue-500'}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={mediaType === 'IMAGE' ? "image/*" : "audio/wav, audio/mp3, audio/mpeg"}
                    className="hidden"
                    />
                    {fileSrc || audioBuffer ? (
                        mediaType === 'IMAGE' ? (
                            <img src={fileSrc!} alt="Suspect" className="h-full object-contain opacity-70" />
                        ) : (
                            <div className="text-center">
                                <FileAudio className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                                <p className="text-blue-500 text-xs">AUDIO FILE LOADED</p>
                            </div>
                        )
                    ) : (
                    <div className="text-center">
                        <FileCode className="w-12 h-12 text-blue-900 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                        <p className="text-xs font-mono text-blue-500 uppercase tracking-widest">UPLOAD SUSPECT {mediaType}</p>
                    </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-blue-600 uppercase tracking-wider font-bold">>> DECRYPTION_KEY</label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER KEY"
                    className="w-full bg-black border border-blue-900 p-3 text-blue-400 font-mono text-sm focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center space-x-3 py-2 px-3 border border-blue-900/50 bg-blue-900/10 clip-corners">
                    <div className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${autoDestruct ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-blue-900'}`} onClick={() => setAutoDestruct(!autoDestruct)}></div>
                    <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase flex-grow cursor-pointer" onClick={() => setAutoDestruct(!autoDestruct)}>
                        ENABLE AUTO-PURGE (10s)
                    </span>
                    {autoDestruct && <Timer className="w-4 h-4 text-red-500 animate-pulse" />}
                </div>

                <button
                    onClick={handleDecode}
                    disabled={(!fileSrc && !audioBuffer) || !password}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-black font-bold tracking-[0.2em] text-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none uppercase clip-corners"
                >
                    INITIATE DECRYPTION
                </button>
            </div>

            {/* Right Col: Terminal Output */}
            <div className="relative bg-black border border-blue-900/50 h-[400px] font-mono text-xs flex flex-col clip-corners shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                {/* Terminal Header */}
                <div className="bg-blue-900/10 border-b border-blue-900/30 px-3 py-1 flex justify-between items-center text-[10px] text-blue-600">
                    <span>TERMINAL_OUTPUT</span>
                    {destructTimer !== null ? (
                        <span className="text-red-500 font-bold animate-pulse">PURGE IN {destructTimer}s</span>
                    ) : (
                        <span className="animate-pulse">ONLINE</span>
                    )}
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-1 scrollbar-hide">
                    {logs.map((log, i) => (
                        <div key={i} className="text-blue-400/80">{log}</div>
                    ))}
                    
                    {revealedMessage && (
                        <div className="mt-4 p-4 border border-green-500/30 bg-green-900/10 animate-fade-in relative overflow-hidden">
                            {destructTimer !== null && (
                                <div className="absolute top-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${(destructTimer / 10) * 100}%` }}></div>
                            )}
                            <div className="text-green-500 font-bold mb-2">>> DECRYPTED PAYLOAD:</div>
                            <div className="text-green-300 whitespace-pre-wrap leading-relaxed">{revealedMessage}</div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 border border-red-500/30 bg-red-900/10 animate-fade-in">
                             <div className="flex items-center space-x-2 text-red-500 font-bold mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span>CRITICAL FAILURE</span>
                             </div>
                             <div className="text-red-400">{error}</div>
                        </div>
                    )}
                    <div ref={logsEndRef} />
                </div>
                
                {/* Footer Actions */}
                {revealedMessage && (
                    <div className="p-4 border-t border-blue-900/30 bg-blue-900/5">
                         <button 
                            onClick={() => handleSelfDestruct(false)}
                            className="w-full border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black py-2 flex items-center justify-center space-x-2 transition-all uppercase tracking-widest text-[10px] clip-corners"
                        >
                            <Trash2 className="w-3 h-3" />
                            <span>EXECUTE SELF-DESTRUCT</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Decoder;