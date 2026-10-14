import React, { useState } from 'react';
import { AssetPair, ActiveTrade, TradeDirection, Language } from '../types/trading';
import { ArrowUpRight, ArrowDownRight, Clock, DollarSign, ShieldAlert, Timer } from 'lucide-react';

interface ExecutionPanelProps {
  asset: AssetPair;
  currentPrice: number;
  balance: number;
  activeTrades: ActiveTrade[];
  onPlaceTrade: (direction: TradeDirection, amount: number, durationSeconds: number) => void;
  language: Language;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  asset,
  currentPrice,
  balance,
  activeTrades,
  onPlaceTrade,
  language,
}) => {
  const [tradeAmount, setTradeAmount] = useState<number>(25);
  const [durationSeconds, setDurationSeconds] = useState<number>(60); // 1 minute default
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payoutPercent = asset.payoutPercent;
  const potentialProfit = Number(((tradeAmount * payoutPercent) / 100).toFixed(2));
  const totalReturn = Number((tradeAmount + potentialProfit).toFixed(2));

  const handleTrade = (direction: TradeDirection) => {
    if (tradeAmount <= 0) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন' : 'Please enter a valid trade amount');
      return;
    }
    if (tradeAmount > balance) {
      setErrorMessage(
        language === 'bn' ? 'অপর্যাপ্ত ব্যালেন্স! দয়া করে ব্যালেন্স রিসেট করুন' : 'Insufficient balance! Please reset demo balance'
      );
      return;
    }
    setErrorMessage(null);
    onPlaceTrade(direction, tradeAmount, durationSeconds);
  };

  const amountPresets = [5, 10, 25, 50, 100, 250];

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-xl text-slate-100">
      {/* Asset & Payout Summary */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'চলতি অ্যাসেট' : 'Active Market'}
          </span>
          <span className="font-semibold text-sm text-slate-200">{asset.name}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'মুনাফা' : 'Payout Rate'}</span>
          <span className="font-mono font-bold text-base text-emerald-400">+{payoutPercent}%</span>
        </div>
      </div>

      {/* Trade Expiry Selector */}
      <div className="mt-4">
        <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          {language === 'bn' ? 'ট্রেডের সময়সীমা (এক্সপায়ারি)' : 'Expiration Time'}
        </label>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
          {[
            { label: '30S', seconds: 30 },
            { label: '1M', seconds: 60 },
            { label: '2M', seconds: 120 },
            { label: '5M', seconds: 300 },
          ].map((item) => (
            <button
              key={item.seconds}
              type="button"
              onClick={() => setDurationSeconds(item.seconds)}
              className={`py-2 px-1 rounded-lg border text-center transition-all ${
                durationSeconds === item.seconds
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Investment Amount */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'bn' ? 'বিনিয়োগের পরিমাণ ($)' : 'Investment Amount ($)'}
          </label>
          <span className="text-xs font-mono text-slate-400">
            {language === 'bn' ? 'ব্যালেন্স:' : 'Bal:'} ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">$</span>
          <input
            type="number"
            min="1"
            max={balance}
            value={tradeAmount}
            onChange={(e) => {
              setErrorMessage(null);
              setTradeAmount(Math.max(1, Number(e.target.value) || 0));
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2.5 pl-8 pr-3 font-mono font-bold text-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-6 gap-1 mt-2">
          {amountPresets.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setTradeAmount(amt)}
              className="py-1 text-xs font-mono rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              +${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Profit Return Calculation Box */}
      <div className="mt-4 p-3 bg-slate-900/90 rounded-lg border border-slate-800/80">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
          <span>{language === 'bn' ? 'সম্ভাব্য নিট লাভ:' : 'Estimated Net Profit:'}</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">+${potentialProfit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{language === 'bn' ? 'মোট প্রাপ্তি (রিটার্ন):' : 'Total Payout Return:'}</span>
          <span className="font-mono text-slate-200">${totalReturn.toFixed(2)}</span>
        </div>
      </div>

      {/* Error or Unsupported display */}
      {!asset.isSupported ? (
        <div className="mt-3 p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>DATA UNAVAILABLE · {language === 'bn' ? 'ফিড অনুপলব্ধ' : 'Feed Incompatible'}</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {asset.unsupportedReason || (language === 'bn' ? 'বর্তমান প্রোভাইডারে এই পেয়ারের অথোরাইজড ফিড নেই।' : 'No authorized feed bridge for this instrument.')}
          </p>
        </div>
      ) : errorMessage ? (
        <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800/60 rounded text-xs text-rose-300 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Action Trade Execution Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* CALL / HIGHER BUTTON */}
        <button
          type="button"
          disabled={!asset.isSupported}
          onClick={() => handleTrade('CALL')}
          className="flex flex-col items-center justify-center py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold transition-all shadow-lg shadow-emerald-900/30 group cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-base tracking-wide">{language === 'bn' ? 'কল (CALL)' : 'CALL (HIGHER)'}</span>
          </div>
          <span className="text-xs text-emerald-100 font-mono font-normal mt-0.5">
            +{payoutPercent}% (${totalReturn.toFixed(1)})
          </span>
        </button>

        {/* PUT / LOWER BUTTON */}
        <button
          type="button"
          disabled={!asset.isSupported}
          onClick={() => handleTrade('PUT')}
          className="flex flex-col items-center justify-center py-3.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold transition-all shadow-lg shadow-rose-900/30 group cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="w-5 h-5 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-base tracking-wide">{language === 'bn' ? 'পুট (PUT)' : 'PUT (LOWER)'}</span>
          </div>
          <span className="text-xs text-rose-100 font-mono font-normal mt-0.5">
            +{payoutPercent}% (${totalReturn.toFixed(1)})
          </span>
        </button>
      </div>

      {/* Active Trades Live List */}
      <div className="mt-5 flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            {language === 'bn' ? 'চলতি সক্রিয় ট্রেড' : 'Live Active Positions'} ({activeTrades.length})
          </span>
        </div>

        {activeTrades.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 rounded-lg bg-slate-900/50 border border-slate-800/60 text-slate-500 text-xs">
            <Clock className="w-5 h-5 mb-1.5 opacity-40" />
            <span>{language === 'bn' ? 'কোনো চলমান ট্রেড নেই' : 'No active trade positions open'}</span>
            <span className="text-[11px] text-slate-600 mt-0.5">
              {language === 'bn' ? 'CALL বা PUT বাটনে ক্লিক করে ট্রেড শুরু করুন' : 'Click CALL or PUT to open a position'}
            </span>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[170px] pr-1">
            {activeTrades.map((t) => {
              const isCall = t.direction === 'CALL';
              const isInTheMoney = isCall ? currentPrice > t.entryPrice : currentPrice < t.entryPrice;
              const nowSec = Math.floor(Date.now() / 1000);
              const remainingSec = Math.max(0, t.endTime - nowSec);
              const progressPct = Math.min(
                100,
                Math.max(0, ((t.durationSeconds - remainingSec) / t.durationSeconds) * 100)
              );

              return (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isInTheMoney
                      ? 'bg-emerald-950/40 border-emerald-800/60'
                      : 'bg-rose-950/40 border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-medium">
                    <span className={isCall ? 'text-emerald-400' : 'text-rose-400'}>
                      {isCall ? '▲ CALL' : '▼ PUT'} ${t.amount}
                    </span>
                    <span className="text-slate-300">
                      {remainingSec}s {language === 'bn' ? 'বাকি' : 'left'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>
                      Entry: {t.entryPrice.toFixed(asset.pipDecimals)}
                    </span>
                    <span className={isInTheMoney ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isInTheMoney ? `+${(t.amount * 0.92).toFixed(1)} (ITM)` : '-$0.0 (OTM)'}
                    </span>
                  </div>

                  {/* Progress timer bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isInTheMoney ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
