import React, { useState, useEffect } from 'react';
import { Wind, Eye, Compass, X, Sparkles, Volume2 } from 'lucide-react';

interface GroundingToolProps {
  onClose: () => void;
  initialMode?: 'box_breathing' | 'sensory_54321';
}

export const GroundingTool: React.FC<GroundingToolProps> = ({
  onClose,
  initialMode = 'box_breathing',
}) => {
  const [mode, setMode] = useState<'box_breathing' | 'sensory_54321'>(initialMode);

  // Box Breathing State
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [counter, setCounter] = useState(4);
  const [cycle, setCycle] = useState(1);

  // Sensory Grounding State
  const [sensoryStep, setSensoryStep] = useState(0);

  const sensorySteps = [
    {
      num: 5,
      sense: 'SEE',
      icon: Eye,
      prompt: 'Acknowledge 5 things you see around you right now.',
      detail: 'A pen on the desk, light coming through the window, a pattern on the floor, your hands, a book.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      num: 4,
      sense: 'FEEL',
      icon: Compass,
      prompt: 'Acknowledge 4 things you can physically feel.',
      detail: 'The texture of your shirt, the firmness of the chair against your back, your feet on the ground, the cool air.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      num: 3,
      sense: 'HEAR',
      icon: Volume2,
      prompt: 'Acknowledge 3 things you hear in this room or outside.',
      detail: 'A distant hum of traffic, clock ticking, computer fan, birds outside, or your own breath.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      num: 2,
      sense: 'SMELL',
      icon: Sparkles,
      prompt: 'Acknowledge 2 things you can smell.',
      detail: 'Coffee, fresh paper, laundry detergent, soap, or the natural air around you.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      num: 1,
      sense: 'TASTE',
      icon: Wind,
      prompt: 'Acknowledge 1 thing you can taste.',
      detail: 'A sip of cool water, lingering mint, or simply the neutral taste of the present moment.',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  // Box breathing timer loop (4s each phase)
  useEffect(() => {
    if (mode !== 'box_breathing') return;

    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          setPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            if (currentPhase === 'Exhale') return 'Rest';
            setCycle((c) => c + 1);
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wind className="w-5 h-5 text-teal-400" />
              Somatic Grounding & Calming
            </h3>
            <p className="text-xs text-slate-400">
              CBT and neuro-somatic regulation to bring your nervous system back to safety.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-lg bg-slate-800/80 p-1 my-4 border border-slate-700">
          <button
            onClick={() => setMode('box_breathing')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'box_breathing'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Box Breathing (4-4-4-4)
          </button>
          <button
            onClick={() => setMode('sensory_54321')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'sensory_54321'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5-4-3-2-1 Sensory Grounding
          </button>
        </div>

        {/* Box Breathing Content */}
        {mode === 'box_breathing' && (
          <div className="flex flex-col items-center py-6 text-center">
            {/* Visualizer Circle */}
            <div className="relative w-48 h-48 flex items-center justify-center my-4">
              {/* Outer pulsing ring */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  phase === 'Inhale'
                    ? 'scale-110 bg-teal-500/20 border-2 border-teal-400 shadow-lg shadow-teal-500/30'
                    : phase === 'Hold'
                    ? 'scale-110 bg-indigo-500/20 border-2 border-indigo-400 shadow-lg shadow-indigo-500/30'
                    : phase === 'Exhale'
                    ? 'scale-90 bg-emerald-500/20 border-2 border-emerald-400'
                    : 'scale-90 bg-slate-700/30 border border-slate-600'
                }`}
              />

              {/* Center content */}
              <div className="z-10 flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white tracking-wider">
                  {counter}
                </span>
                <span className="text-sm font-semibold uppercase tracking-widest text-teal-300 mt-1">
                  {phase}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Cycle #{cycle}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-sm mt-2">
              {phase === 'Inhale' && 'Slowly breathe in through your nose, filling your lungs with calm.'}
              {phase === 'Hold' && 'Gently hold your breath without straining. Stay relaxed.'}
              {phase === 'Exhale' && 'Smoothly exhale through your mouth, releasing all tension.'}
              {phase === 'Rest' && 'Pause and rest before your next breath. You are safe.'}
            </p>

            <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Navy SEALs Technique</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Vagus Nerve Reset</span>
            </div>
          </div>
        )}

        {/* 5-4-3-2-1 Sensory Grounding Content */}
        {mode === 'sensory_54321' && (
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-slate-400">
                Step {sensoryStep + 1} of 5
              </span>
              <div className="flex gap-1">
                {sensorySteps.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setSensoryStep(i)}
                    className={`w-6 h-1.5 rounded-full cursor-pointer transition-all ${
                      i === sensoryStep
                        ? 'bg-teal-400 w-8'
                        : i < sensoryStep
                        ? 'bg-teal-700'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current Step Card */}
            {(() => {
              const cur = sensorySteps[sensoryStep];
              const Icon = cur.icon;
              return (
                <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cur.color} flex items-center justify-center font-bold text-white shadow-md`}>
                      {cur.num}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        Sense: {cur.sense}
                      </span>
                      <h4 className="text-sm font-semibold text-white">
                        {cur.prompt}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">Examples to look for: </span>
                    {cur.detail}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      disabled={sensoryStep === 0}
                      onClick={() => setSensoryStep((s) => Math.max(0, s - 1))}
                      className="text-xs px-3 py-1.5 rounded bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600 transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (sensoryStep < sensorySteps.length - 1) {
                          setSensoryStep((s) => s + 1);
                        } else {
                          onClose();
                        }
                      }}
                      className="text-xs px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 font-semibold text-white transition shadow-sm"
                    >
                      {sensoryStep < sensorySteps.length - 1 ? 'Next Sense' : 'Done & Return'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer Close */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Close Grounding Tool
          </button>
        </div>
      </div>
    </div>
  );
};
