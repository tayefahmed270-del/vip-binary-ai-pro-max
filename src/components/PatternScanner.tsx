import React from 'react';
import { Candle, AssetPair, Language } from '../types/trading';
import { detectCandlePattern, calculateRSI } from '../utils/indicators';
import { Activity, Gauge, Zap } from 'lucide-react';

interface PatternScannerProps {
  candles: Candle[];
  asset: AssetPair;
  language: Language;
  onQuickSignalRequest: () => void;
}

export const PatternScanner: React.FC<PatternScannerProps> = ({
  candles,
  asset,
  language,
  onQuickSignalRequest,
}) => {
  const patternInfo = detectCandlePattern(candles);
  const rsiValues = calculateRSI(candles, 14);
  const lastRsi = rsiValues[rsiValues.length - 1] ?? 50;

  const isBullish = patternInfo.sentiment === 'BULLISH';
  const isBearish = patternInfo.sentiment === 'BEARISH';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 text-xs">
      {/* Candlestick Pattern Card */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isBullish
              ? 'bg-emerald-500/20 text-emerald-400'
              : isBearish
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'সনাক্তকৃত ক্যান্ডেল প্যাটার্ন' : 'Detected Pattern'}
          </span>
          <span className="font-bold text-slate-200 block truncate">{patternInfo.pattern}</span>
          <span className="text-[10px] text-slate-500 block truncate">{patternInfo.description}</span>
        </div>
      </div>

      {/* Market Volatility & Momentum Card */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <Gauge className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'মার্কেট আরএসআই ও লিকুইডিটি' : 'RSI Momentum'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`font-mono font-bold text-sm ${
                lastRsi > 70 ? 'text-rose-400' : lastRsi < 30 ? 'text-emerald-400' : 'text-purple-300'
              }`}
            >
              {lastRsi.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">
              ({lastRsi > 68 ? 'Overbought' : lastRsi < 32 ? 'Oversold' : 'Neutral Zone'})
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {language === 'bn' ? `ফিড: ${asset.marketType} · ${asset.provider}` : `Feed: ${asset.marketType} · ${asset.provider}`}
          </span>
        </div>
      </div>

      {/* Instant Signal Trigger Button */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-900/60">
        <div className="min-w-0">
          <span className="text-[10px] text-blue-300 font-bold block flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-300" />
            {language === 'bn' ? '৫-সেকেন্ড কোয়ান্ট স্ক্যানার' : '5-Second Quant SLA'}
          </span>
          <span className="text-[11px] text-slate-300 block truncate">
            {isBullish
              ? language === 'bn'
                ? 'বুলিশ ব্রেকআউট অনুকূল (CALL)'
                : 'Bullish Reversal Favored'
              : isBearish
              ? language === 'bn'
                ? 'বেয়ারিশ প্রেসার বৃদ্ধি (PUT)'
                : 'Bearish Correction Favored'
              : language === 'bn'
              ? 'মার্কেট ব্যালেন্সড (WAIT)'
              : 'Market Equilibrium (WAIT)'}
          </span>
        </div>

        <button
          type="button"
          onClick={onQuickSignalRequest}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-950"
        >
          {language === 'bn' ? 'স্ক্যান করুন' : 'Scan (5s)'}
        </button>
      </div>
    </div>
  );
};
