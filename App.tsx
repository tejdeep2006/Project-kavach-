import React, { useState, useEffect, useRef } from 'react';
import { Radio, Terminal, Activity, Crosshair, MapPin } from 'lucide-react';
import Encoder from './components/Encoder';
import Decoder from './components/Decoder';
import { AppMode } from './types';

// Matrix Rain Component
const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const binary = '01';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0'; // Matrix Green
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = binary.charAt(Math.floor(Math.random() * binary.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-20 pointer-events-none" />;
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [coords, setCoords] = useState("34.0522° N, 118.2437° W");

  // Random Coordinates ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (Math.random() * 180 - 90).toFixed(4);
      const lng = (Math.random() * 360 - 180).toFixed(4);
      setCoords(`${lat}° N, ${lng}° W`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-green-500 selection:text-black overflow-hidden flex flex-col font-['Share_Tech_Mono']">
      <MatrixBackground />
      
      {/* Header */}
      <header className="relative z-20 border-b border-green-900/50 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setMode(AppMode.HOME)}
          >
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-white glitch" data-text="PROJECT KAVACH">PROJECT KAVACH</h1>
              <p className="text-[10px] text-green-600 tracking-[0.3em]">DEFENCE PROTOCOL v3.1</p>
            </div>
          </div>
          
          {/* Tactical Stats */}
          <div className="hidden md:flex items-center space-x-6 text-xs text-green-500/80">
             <div className="flex items-center space-x-2 border-r border-green-900 pr-6">
                <MapPin className="w-3 h-3" />
                <span className="font-mono">{coords}</span>
             </div>
             <div className="flex items-center space-x-2 border-r border-green-900 pr-6">
                <Activity className="w-3 h-3" />
                <span>SYS_INTEGRITY: 100%</span>
             </div>
             <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                <span className="tracking-widest">UPLINK_ACTIVE</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 flex-grow w-full flex flex-col">
        {mode === AppMode.HOME && (
          <div className="flex-grow flex flex-col items-center justify-center space-y-12 animate-fade-in my-auto">
            
            <div className="text-center max-w-4xl space-y-6 relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-green-500/50"></div>
              
              <div className="inline-flex items-center space-x-2 px-4 py-1 bg-green-500/10 border border-green-500/50 clip-corners text-green-400 text-xs tracking-[0.2em] mb-4">
                <Crosshair className="w-3 h-3 animate-spin-slow" />
                <span>TARGET SECURE</span>
              </div>
              
              <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter uppercase leading-none">
                SHOUR<span className="text-green-500">YANGA</span>
                <br />
                <span className="text-4xl md:text-5xl text-neutral-500 tracking-widest">OPS CENTER</span>
              </h2>
              
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-8">
              {/* Encode Card */}
              <button
                onClick={() => setMode(AppMode.ENCODE)}
                className="group relative h-48 bg-black/60 border border-green-900/50 hover:border-green-500 hover:bg-green-900/10 transition-all duration-300 text-left hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] clip-corners"
              >
                <div className="absolute top-2 right-2 text-xs text-green-800 group-hover:text-green-400 font-mono">CMD_01</div>
                <div className="flex flex-col h-full justify-between p-6">
                  <div className="p-3 w-fit bg-green-900/20 border border-green-500/30 group-hover:border-green-400 group-hover:bg-green-500 group-hover:text-black transition-colors clip-corners">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-green-400 tracking-wider">ENCODE_DATA</h3>
                    <p className="text-xs text-green-600/70 font-mono group-hover:text-green-500">Img/Audio Steganography >></p>
                  </div>
                </div>
              </button>

              {/* Decode Card */}
              <button
                onClick={() => setMode(AppMode.DECODE)}
                className="group relative h-48 bg-black/60 border border-green-900/50 hover:border-blue-500 hover:bg-blue-900/10 transition-all duration-300 text-left hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] clip-corners"
              >
                <div className="absolute top-2 right-2 text-xs text-blue-800 group-hover:text-blue-400 font-mono">CMD_02</div>
                <div className="flex flex-col h-full justify-between p-6">
                  <div className="p-3 w-fit bg-blue-900/20 border border-blue-500/30 group-hover:border-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors clip-corners">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 tracking-wider">DECODE_DATA</h3>
                    <p className="text-xs text-blue-600/70 font-mono group-hover:text-blue-500">Decrypt & Auto-Purge >></p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === AppMode.ENCODE && <Encoder />}
        {mode === AppMode.DECODE && <Decoder />}
      </main>

      <footer className="relative z-10 w-full border-t border-green-900/30 bg-black/90 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between text-[10px] text-green-700/50 uppercase tracking-widest">
            <span>SECURE CONNECTION ESTABLISHED</span>
            <span>UNAUTHORIZED ACCESS IS A FELONY</span>
        </div>
      </footer>
    </div>
  );
};

export default App;