import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, Radio, Terminal, ShieldAlert } from 'lucide-react';
import Encoder from './components/Encoder';
import Decoder from './components/Decoder';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white selection:bg-green-500 selection:text-black overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-grid-pattern pointer-events-none h-full w-full"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setMode(AppMode.HOME)}
          >
            <div className="relative">
              <ShieldCheck className="w-8 h-8 text-green-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-green-500 blur-lg opacity-20 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-white group-hover:text-green-400 transition-colors">PROJECT KAVACH</h1>
              <p className="text-[10px] text-neutral-500 font-mono tracking-widest">DRDO // SECURE COMMS LINK</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 text-xs font-mono text-neutral-500">
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-neutral-600">ENCRYPTION</span>
               <span className="text-green-500">AES-256-GCM</span>
            </div>
            <div className="h-6 w-px bg-neutral-800"></div>
            <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="tracking-widest">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 flex-grow">
        {mode === AppMode.HOME && (
          <div className="flex flex-col items-center justify-center space-y-16 py-12 animate-fade-in">
            <div className="text-center max-w-3xl space-y-6">
              <div className="inline-block mb-4 px-4 py-1 bg-green-900/20 border border-green-500/30 rounded-full text-green-400 text-xs font-mono tracking-[0.2em]">
                CLASSIFIED OPERATIONS DASHBOARD
              </div>
              <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent pb-4 tracking-tight">
                Steganographic Defense
              </h2>
              <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Deploy military-grade encryption to hide tactical intelligence within innocuous digital imagery.
                <span className="block mt-2 text-neutral-500 text-sm font-mono">Layer 1: AES-256 // Layer 2: LSB Manipulation</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
              <button
                onClick={() => setMode(AppMode.ENCODE)}
                className="group relative overflow-hidden bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-green-500/50 rounded-2xl p-8 transition-all duration-300 text-left hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Lock className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-14 h-14 bg-green-950/50 border border-green-900 rounded-xl flex items-center justify-center mb-6 group-hover:border-green-500 group-hover:bg-green-500/10 transition-colors">
                      <Radio className="w-7 h-7 text-green-600 group-hover:text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Encode</h3>
                    <p className="text-neutral-500 group-hover:text-neutral-400 transition-colors">Encrypt battle plans & embed into cover images.</p>
                  </div>
                  <div className="mt-8 flex items-center text-green-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    INITIATE PROTOCOL &rarr;
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode(AppMode.DECODE)}
                className="group relative overflow-hidden bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 text-left hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Unlock className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-14 h-14 bg-blue-950/50 border border-blue-900 rounded-xl flex items-center justify-center mb-6 group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-colors">
                      <Terminal className="w-7 h-7 text-blue-600 group-hover:text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Decode</h3>
                    <p className="text-neutral-500 group-hover:text-neutral-400 transition-colors">Recover intelligence from intercepted transmissions.</p>
                  </div>
                  <div className="mt-8 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    RUN DECRYPTION &rarr;
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === AppMode.ENCODE && <Encoder />}
        {mode === AppMode.DECODE && <Decoder />}
      </main>

      <footer className="relative z-10 w-full bg-neutral-950/80 backdrop-blur border-t border-neutral-900 py-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-neutral-600 text-[10px] font-mono tracking-widest uppercase">
          <ShieldAlert className="w-3 h-3" />
          <p>Restricted Access // Authorized Personnel Only</p>
        </div>
      </footer>
    </div>
  );
};

export default App;