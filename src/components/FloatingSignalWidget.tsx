import React, { useState, useRef, useEffect } from 'react';
import { VipSignal, Language } from '../types/trading';
import {
  TrendingUp,
  TrendingDown,
  PauseCircle,
  X,
  Minimize2,
  Maximize2,
  GripHorizontal,
  Zap,
  Play,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface FloatingSignalWidgetProps {
  signal: VipSignal | null;
  onQuickTrade: (signal: VipSignal) => void;
  language: Language;
  onClose: () => void;
}

export const FloatingSignalWidget: React.FC<FloatingSignalWidgetProps> = ({
  signal,
  onQuickTrade,
  language,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return {
      x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 340) : 800,
      y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 380) : 400,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.min(Math.max(10, e.clientX - dragOffset.current.x), window.innerWidth - 80);
      const newY = Math.min(Math.max(50, e.clientY - dragOffset.current.y), window.innerHeight - 80);
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const newX = Math.min(Math.max(10, e.touches[0].clientX - dragOffset.current.x), window.innerWidth - 80);
      const newY = Math.min(Math.max(50, e.touches[0].clientY - dragOffset.current.y), window.innerHeight - 80);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  if (!signal) return null;

  const isCall = signal.decision === 'CALL';
  const isPut = signal.decision === 'PUT';
  const isWait = signal.decision === 'WAIT';

  const handleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.speakSignalResult(signal, language);
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 select-none shadow-2xl transition-shadow"
    >
      {isCollapsed ? (
        /* Collapsed Floating Bubble */
        <div
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer border shadow-2xl backdrop-blur-md animate-pulse ${
            isCall
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
              : isPut
              ? 'bg-rose-950/90 border-rose-500 text-rose-300'
              : 'bg-amber-950/90 border-amber-500 text-amber-300'
          }`}
          title="Click to expand VIP Signal Overlay"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full animate-ping ${
              isCall ? 'bg-emerald-400' : isPut ? 'bg-rose-400' : 'bg-amber-400'
            }`}
          />
          <span className="font-mono font-bold text-xs">
            {signal.decision} {signal.confidence}%
          </span>
          <Maximize2 className="w-3.5 h-3.5 ml-1 opacity-70" />
        </div>
      ) : (
        /* Expanded Floating HUD Card */
        <div
          className={`w-[310px] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col ${
            isCall
              ? 'bg-[#0B0F19]/95 border-emerald-500/60 shadow-emerald-950/40'
              : isPut
              ? 'bg-[#0B0F19]/95 border-rose-500/60 shadow-rose-950/40'
              : 'bg-[#0B0F19]/95 border-amber-500/60 shadow-amber-950/40'
          }`}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 cursor-move"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[120px]">{signal.assetName}</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                {signal.marketType}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={handleVoice}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Speak Signal (বাংলা)"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Minimize Overlay"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Close Floating Widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-3.5 space-y-3 text-xs">
            {/* Direction Hero */}
            <div
              className={`p-3 rounded-xl flex items-center justify-between border ${
                isCall
                  ? 'bg-emerald-950/50 border-emerald-800/80'
                  : isPut
                  ? 'bg-rose-950/50 border-rose-800/80'
                  : 'bg-amber-950/50 border-amber-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                    isCall
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isPut
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {isCall ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : isPut ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <PauseCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span
                    className={`font-black font-mono text-lg block ${
                      isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {signal.decision}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {language === 'bn' ? 'মেয়াদ:' : 'Expiry:'} {signal.timeframe}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span
                  className={`text-sm font-black px-2 py-0.5 rounded border block ${
                    isCall
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : isPut
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}
                >
                  {signal.confidence}% {isWait ? 'UNVERIFIED' : 'CONF'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {signal.entryPrice}
                </span>
              </div>
            </div>

            {/* Quick Reason & Martingale */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{signal.martingaleStep}</span>
            </div>

            {/* Action CTA */}
            {isWait ? (
              <div className="w-full py-2 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 text-center">
                <span>{language === 'bn' ? 'ট্রেড না নিয়ে অপেক্ষা করুন' : 'Hold Position - No Trade'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onQuickTrade(signal)}
                className={`w-full py-2 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
                  isCall
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>
                  {language === 'bn' ? `${signal.decision} ট্রেড নিন` : `Take ${signal.decision} Now`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
