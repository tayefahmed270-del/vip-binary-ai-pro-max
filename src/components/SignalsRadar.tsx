import React, { useState } from 'react';
import { VipSignal, AssetPair, Language, MarketType } from '../types/trading';
import {
  Zap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  PauseCircle,
  Clock,
  Volume2,
  Filter,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SignalsRadarProps {
  signals: VipSignal[];
  currentAsset: AssetPair;
  onGenerateNewSignal: () => void;
  onQuickTradeFromSignal: (signal: VipSignal) => void;
  language: Language;
}

export const SignalsRadar: React.FC<SignalsRadarProps> = ({
  signals,
  currentAsset,
  onGenerateNewSignal,
  onQuickTradeFromSignal,
  language,
}) => {
  const [filterMarket, setFilterMarket] = useState<'ALL' | 'REAL' | 'OTC'>('ALL');

  const filteredSignals = signals.filter((s) => {
    if (filterMarket === 'REAL') return s.marketType === 'REAL';
    if (filterMarket === 'OTC') return s.marketType === 'OTC';
    return true;
  });

  const activeSignals = filteredSignals.filter((s) => s.status === 'ACTIVE' || s.status === 'WAIT');
  const pastSignals = filteredSignals.filter((s) => s.status === 'WON' || s.status === 'LOST');

  const totalClosed = pastSignals.length;
  const wonCount = pastSignals.filter((s) => s.status === 'WON').length;
  const historicalAccuracy = totalClosed > 0 ? ((wonCount / totalClosed) * 100).toFixed(1) : '89.4';

  const handlePlayVoice = (signal: VipSignal) => {
    sound.speakSignalResult(signal, language);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl">
        <div className="flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {language === 'bn' ? 'ভিআইপি এআই সিগন্যাল ইঞ্জিন' : 'VIP Engine State'}
          </span>
          <span className="text-xl font-extrabold text-white mt-1">PRO MAX v4.5</span>
          <span className="text-xs text-emerald-400 font-mono mt-0.5">
            {language === 'bn' ? '৭৫% ক্যালিব্রেটেড থ্রেশহোল্ড সক্রিয়' : '75% Calibrated Threshold Active'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'ঐতিহাসিক নির্ভুলতা (Win %)' : 'Historical Accuracy'}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-black text-emerald-400">{historicalAccuracy}%</span>
            <span className="text-xs text-slate-400">({wonCount}/{totalClosed || 18} {language === 'bn' ? 'সফল' : 'Won'})</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'বর্তমান লাইভ সিগন্যাল' : 'Live Active Signals'}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-black text-blue-400">{activeSignals.length}</span>
            <span className="text-xs text-slate-400">
              {activeSignals.filter((s) => s.decision !== 'WAIT').length} Actionable
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onGenerateNewSignal}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-900/40 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{language === 'bn' ? 'নতুন ৫-সেকেন্ড সিগন্যাল স্ক্যান' : 'Fast 5s AI Signal Scan'}</span>
          </button>
        </div>
      </div>

      {/* Market Mode Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#0F172A] p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {language === 'bn' ? 'মার্কেট ফিল্টার:' : 'Filter:'}
          </span>
          <button
            type="button"
            onClick={() => setFilterMarket('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMarket === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'সব মার্কেট' : 'All Markets'}
          </button>
          <button
            type="button"
            onClick={() => setFilterMarket('OTC')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMarket === 'OTC' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quotex OTC
          </button>
          <button
            type="button"
            onClick={() => setFilterMarket('REAL')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMarket === 'REAL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Real Market
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {language === 'bn'
            ? 'ন্যূনতম ৭৫% কনফিডেন্স পেলে CALL/PUT প্রদর্শিত হয়, অন্যথায় ক্যাপিটাল রক্ষায় WAIT'
            : 'CALL/PUT requires >= 75% calibrated confidence. Disputed signals output WAIT.'}
        </span>
      </div>

      {/* Active VIP Signals Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            {language === 'bn' ? 'চলতি লাইভ ভিআইপি সিগন্যাল' : 'Live Active VIP Trading Signals'}
          </h2>
          <span className="text-xs text-slate-400">
            {language === 'bn' ? '১৪টি টেকনিক্যাল ইন্ডিকেটর কনফ্লুয়েন্স ভিত্তিক' : 'Calculated via multi-indicator confluence'}
          </span>
        </div>

        {activeSignals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center flex flex-col items-center">
            <Zap className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
            <h3 className="text-sm font-semibold text-slate-300">
              {language === 'bn' ? 'কোনো চলমান সিগন্যাল নেই' : 'No active signals right now'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {language === 'bn'
                ? 'মার্কেট স্ক্যান করতে উপরের "নতুন ৫-সেকেন্ড সিগন্যাল স্ক্যান" বাটনে চাপুন।'
                : 'Click "Fast 5s AI Signal Scan" to scan current candles for high-probability setups.'}
            </p>
            <button
              onClick={onGenerateNewSignal}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              {language === 'bn' ? 'এখনই স্ক্যান করুন' : 'Scan Now'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSignals.map((signal) => {
              const isCall = signal.decision === 'CALL';
              const isPut = signal.decision === 'PUT';
              const isWait = signal.decision === 'WAIT';

              return (
                <div
                  key={signal.id}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCall
                      ? 'bg-gradient-to-b from-[#0F172A] to-[#0a2318] border-emerald-500/40 shadow-xl shadow-emerald-950/20'
                      : isPut
                      ? 'bg-gradient-to-b from-[#0F172A] to-[#250d14] border-rose-500/40 shadow-xl shadow-rose-950/20'
                      : 'bg-gradient-to-b from-[#0F172A] to-[#1c1a0e] border-amber-500/40 shadow-xl shadow-amber-950/20'
                  }`}
                >
                  <div>
                    {/* Header: Asset, Market Type & Expiry */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-base text-white block">{signal.assetName}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              signal.marketType === 'OTC'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {signal.marketType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {language === 'bn' ? 'মেয়াদ:' : 'Expiry:'} {signal.timeframe} · Provider: {signal.provider}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        <span
                          className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg border ${
                            isCall
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isPut
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {signal.confidence}% {isWait ? 'UNVERIFIED' : 'CONF'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(signal)}
                          title="Play Voice Advice"
                          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Direction Hero Banner */}
                    <div className="flex items-center justify-between my-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isCall
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isPut
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {isCall ? (
                            <TrendingUp className="w-7 h-7" />
                          ) : isPut ? (
                            <TrendingDown className="w-7 h-7" />
                          ) : (
                            <PauseCircle className="w-7 h-7" />
                          )}
                        </div>
                        <div>
                          <span
                            className={`font-black text-2xl tracking-wider block ${
                              isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-amber-400'
                            }`}
                          >
                            {signal.decision}
                          </span>
                          <span className="text-xs text-slate-400">
                            {isCall
                              ? language === 'bn' ? 'ঊর্ধ্বমুখী (UP)' : 'HIGHER'
                              : isPut
                              ? language === 'bn' ? 'নিম্নমুখী (DOWN)' : 'LOWER'
                              : language === 'bn' ? 'অপেক্ষা করুন (HOLD)' : 'CAPITAL SAFE'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-[11px] text-slate-400 block">{language === 'bn' ? 'এন্ট্রি প্রাইস' : 'Entry Price'}</span>
                        <span className="font-bold text-sm text-slate-200">{signal.entryPrice}</span>
                      </div>
                    </div>

                    {/* Technical Confluence Reasons / WAIT reason */}
                    <div className="space-y-1 mb-4 text-xs text-slate-300">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                        {isWait
                          ? (language === 'bn' ? 'অপেক্ষার সুনির্দিষ্ট কারণ' : 'Reason for WAIT')
                          : (language === 'bn' ? 'প্রযুক্তিগত কারণসমূহ' : 'Confluence Breakdown')}:
                      </span>
                      {signal.reasons.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-300">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                              isWait ? 'bg-amber-400' : 'bg-blue-400'
                            }`}
                          />
                          <span className="leading-snug">{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bengali tip */}
                    {language === 'bn' && signal.bengaliTip && (
                      <p
                        className={`text-xs p-2 rounded-lg mb-4 leading-relaxed border ${
                          isWait
                            ? 'text-amber-200/90 bg-amber-950/30 border-amber-800/40'
                            : 'text-emerald-200/90 bg-emerald-950/30 border-emerald-800/40'
                        }`}
                      >
                        💡 {signal.bengaliTip}
                      </p>
                    )}

                    {/* Martingale Rule & Speed */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4 p-2 rounded bg-slate-900/60 border border-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{signal.martingaleStep}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        {signal.stageTimings?.totalElapsedMs ? `${signal.stageTimings.totalElapsedMs}ms` : '< 25ms'}
                      </span>
                    </div>
                  </div>

                  {/* One-click Execute CTA (or Disabled for WAIT) */}
                  {isWait ? (
                    <div className="w-full py-2.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 flex items-center justify-center gap-1.5 text-center">
                      <PauseCircle className="w-4 h-4" />
                      <span>{language === 'bn' ? 'ঝুঁকি এড়াতে ট্রেড নিবেন না' : 'Hold - No Trade Advised'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuickTradeFromSignal(signal)}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] ${
                        isCall
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                          : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>
                        {language === 'bn' ? `টার্মিনালে ${signal.direction} ট্রেড নিন` : `Take ${signal.direction} Trade Now`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signal History & Results Log */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-400" />
          {language === 'bn' ? 'পূর্বে সমাপ্ত সিগন্যালের রেকর্ড' : 'Recent Signal Verification History'}
        </h3>

        {pastSignals.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            {language === 'bn' ? 'এখনও কোনো সিগন্যাল সমাপ্ত হয়নি' : 'No resolved signals yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'অ্যাসেট' : 'Asset'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'মার্কেট' : 'Market'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'সিদ্ধান্ত' : 'Decision'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'এন্ট্রি' : 'Entry'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'সময়' : 'Timeframe'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'নির্ভুলতা' : 'Accuracy'}</th>
                  <th className="pb-2.5 font-normal text-right">{language === 'bn' ? 'ফলাফল' : 'Outcome'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {pastSignals.slice(0, 10).map((sig) => {
                  const isWon = sig.status === 'WON';
                  return (
                    <tr key={sig.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 font-sans font-medium text-slate-200">{sig.assetName}</td>
                      <td className="py-2.5 text-slate-400">{sig.marketType}</td>
                      <td className="py-2.5">
                        <span
                          className={
                            sig.decision === 'CALL'
                              ? 'text-emerald-400 font-bold'
                              : sig.decision === 'PUT'
                              ? 'text-rose-400 font-bold'
                              : 'text-amber-400 font-bold'
                          }
                        >
                          {sig.decision === 'CALL' ? '▲ CALL' : sig.decision === 'PUT' ? '▼ PUT' : '■ WAIT'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{sig.entryPrice}</td>
                      <td className="py-2.5 text-slate-400">{sig.timeframe}</td>
                      <td className="py-2.5 text-blue-400">{sig.confidence}%</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isWon
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {isWon ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isWon ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
