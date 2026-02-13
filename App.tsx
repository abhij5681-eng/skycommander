import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      {!isPlaying ? (
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center animate-fade-in-up relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
            SKY<span className="text-blue-500">COMMAND</span>
          </h1>
          <h2 className="text-lg text-slate-400 mb-8 font-medium tracking-widest border-b border-slate-700 pb-4 inline-block px-4">ZERO G WARFARE</h2>
          
          <div className="space-y-4 text-left bg-slate-900/50 p-6 rounded-xl mb-8 border border-slate-700/50">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
               <h3 className="text-slate-200 font-bold">INITIAL CONTROLS</h3>
            </div>

            {/* Mode Selection Tabs */}
            <div className="flex p-1 bg-slate-800 rounded-lg mb-4">
              <button 
                onClick={() => setIsMobile(false)}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isMobile ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                PC
              </button>
              <button 
                onClick={() => setIsMobile(true)}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isMobile ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                MOBILE
              </button>
            </div>
            
            {!isMobile ? (
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-400">
                <div className="flex items-center gap-2"><span className="px-2 py-1 bg-slate-800 rounded text-blue-400 font-mono font-bold border border-slate-700">W</span> <span>Jump / Jet</span></div>
                <div className="flex items-center gap-2"><span className="px-2 py-1 bg-slate-800 rounded text-blue-400 font-mono font-bold border border-slate-700">A/D</span> <span>Move</span></div>
                <div className="flex items-center gap-2"><span className="px-2 py-1 bg-slate-800 rounded text-blue-400 font-mono font-bold border border-slate-700">MOUSE</span> <span>Aim</span></div>
                <div className="flex items-center gap-2"><span className="px-2 py-1 bg-slate-800 rounded text-blue-400 font-mono font-bold border border-slate-700">CLICK</span> <span>Fire</span></div>
              </div>
            ) : (
               <div className="text-sm text-slate-400 space-y-2">
                 <p className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-slate-500 block"></span> <span>Left Stick: Move</span></p>
                 <p className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-slate-500 block"></span> <span>Right Stick: Aim</span></p>
               </div>
            )}
          </div>

          <button
            onClick={() => setIsPlaying(true)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg shadow-blue-900/20 transform transition active:scale-95 text-xl tracking-wider border border-blue-400/20"
          >
            INITIATE LAUNCH
          </button>
        </div>
      ) : (
        <GameCanvas 
          onExit={() => setIsPlaying(false)} 
          isMobile={isMobile} 
          setIsMobile={setIsMobile}
        />
      )}
    </div>
  );
};

export default App;
