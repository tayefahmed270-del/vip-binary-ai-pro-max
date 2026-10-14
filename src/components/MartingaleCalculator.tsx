import React, { useState, useMemo } from 'react';
import { Language } from '../types/trading';
import { Calculator, AlertTriangle, ShieldCheck, DollarSign, TrendingUp, Info } from 'lucide-react';

interface MartingaleCalculatorProps {
  language: Language;
}

export const MartingaleCalculator: React.FC<MartingaleCalculatorProps> = ({ language }) => {
  const [initialStake, setInitialStake] = useState<number>(10);
  const [payoutRate, setPayoutRate] = useState<number>(92);
  const [multiplier, setMultiplier] = useState<number>(2.2);
  const [maxSteps, setMaxSteps] = useState<number>(4);

  // Compounding calculator state
  const [compoundCapital, setCompoundCapital] = useState<number>(100);
  const [dailyTargetPercent, setDailyTargetPercent] = useState<number>(3);
  const [tradingDays, setTradingDays] = useState<number>(30);

  // Compute Martingale Steps
  const martingaleTable = useMemo(() => {
    const rows = [];
    let cumulativeLoss = 0;

    for (let step = 0; step <= maxSteps; step++) {
      let stake = 0;
      if (step === 0) {
        stake = initialStake;
      } else {
        // Stake calculated using multiplier or exact break-even + profit formula:
        // (cumulativeLoss + initialStake * (payoutRate / 100)) / (payoutRate / 100)
        stake = Math.round(initialStake * Math.pow(multiplier, step));
      }

      const grossReturn = Number(((stake * (100 + payoutRate)) / 100).toFixed(2));
      const totalInvested = cumulativeLoss + stake;
      const netProfit = Number((grossReturn - totalInvested).toFixed(2));

      let riskTier = 'Safe';
      if (step === 1) riskTier = 'Standard MTG';
      else if (step === 2) riskTier = 'Moderate Risk';
      else if (step === 3) riskTier = 'High Risk';
      else if (step >= 4) riskTier = 'Account Danger';

      rows.push({
        step: step === 0 ? 'Step 0 (Direct)' : `Step ${step}`,
        stake,
        cumulativeLoss,
        totalInvested,
        grossReturn,
        netProfit,
        riskTier,
      });

      cumulativeLoss += stake;
    }

    return rows;
  }, [initialStake, payoutRate, multiplier, maxSteps]);

  // Compute 30-Day Compounding
  const compoundingProjection = useMemo(() => {
    let balance = compoundCapital;
    const history = [];

    for (let day = 1; day <= tradingDays; day++) {
      const dailyProfit = (balance * dailyTargetPercent) / 100;
      balance += dailyProfit;
      if (day === 1 || day % 5 === 0 || day === tradingDays) {
        history.push({
          day,
          profit: Number(dailyProfit.toFixed(2)),
          total: Number(balance.toFixed(2)),
        });
      }
    }

    return { finalBalance: Number(balance.toFixed(2)), checkpoints: history };
  }, [compoundCapital, dailyTargetPercent, tradingDays]);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            {language === 'bn' ? 'মার্টিনগেল ও ক্যাপিটাল সুরক্ষা ল্যাব' : 'Martingale & Money Management Lab'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'নিরাপদ রিস্ক ম্যানেজমেন্ট, রিকভারি স্টেক এবং কম্পাউন্ডিং গ্রোথ ক্যালকুলেটর'
              : 'Calculate exact recovery stakes, risk caps, and 30-day compounding growth targets'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{language === 'bn' ? 'সতর্কতা: সর্বোচ্চ স্টেপ ২ এর বেশি যাবেন না' : 'Golden Rule: Never exceed Step 2 MTG'}</span>
        </div>
      </div>

      {/* Inputs + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            {language === 'bn' ? 'প্যারামিটার নির্ধারণ' : 'Martingale Settings'}
          </h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'প্রারম্ভিক ট্রেড বেট ($):' : 'Base Stake ($):'}
            </label>
            <input
              type="number"
              min="1"
              value={initialStake}
              onChange={(e) => setInitialStake(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'ব্রোকার পে-আউট শতাংশ (%):' : 'Broker Payout (%):'}
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={payoutRate}
              onChange={(e) => setPayoutRate(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'স্টেক মাল্টিপ্লায়ার (গুণক):' : 'Stake Multiplier:'}
            </label>
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white cursor-pointer"
            >
              <option value={2.0}>2.0x (Break-even focus)</option>
              <option value={2.2}>2.2x (Recommended Standard)</option>
              <option value={2.5}>2.5x (Aggressive Recovery)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'সর্বোচ্চ মার্টিনগেল ধাপ:' : 'Max MTG Steps:'}
            </label>
            <select
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white cursor-pointer"
            >
              <option value={2}>2 Steps (Ultra Safe)</option>
              <option value={3}>3 Steps (Standard)</option>
              <option value={4}>4 Steps (High Risk)</option>
              <option value={5}>5 Steps (Extreme)</option>
            </select>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs text-blue-300 leading-relaxed mt-2">
            <span className="font-bold flex items-center gap-1 mb-1">
              <Info className="w-3.5 h-3.5" />
              {language === 'bn' ? 'প্রো ট্রেডার পরামর্শ:' : 'VIP Discipline Note:'}
            </span>
            {language === 'bn'
              ? 'পরপর ২টি ট্রেড লস হলে সেশন বন্ধ করুন। রিভেঞ্জ ট্রেডিং পরিহার করুন এবং কখনোই ব্যালেন্সের ৫% এর বেশি একবারে ঝুঁকিতে ফেলবেন না।'
              : 'If you encounter 2 consecutive MTG losses, stop trading for the session. Revenge trading is the #1 reason traders blow accounts.'}
          </div>
        </div>

        {/* Calculated Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>{language === 'bn' ? 'মার্টিনগেল হিসাব বিবরণী' : 'Step-by-Step Recovery Breakdown'}</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                {language === 'bn' ? 'পেআউট:' : 'Payout:'} {payoutRate}%
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-normal">{language === 'bn' ? 'ধাপ' : 'Step'}</th>
                    <th className="pb-2 font-normal">{language === 'bn' ? 'স্টেক' : 'Stake'}</th>
                    <th className="pb-2 font-normal">{language === 'bn' ? 'পূর্বের লস' : 'Prev Loss'}</th>
                    <th className="pb-2 font-normal">{language === 'bn' ? 'মোট ঝুঁকি' : 'Total Risk'}</th>
                    <th className="pb-2 font-normal">{language === 'bn' ? 'নিট লাভ' : 'Net Profit'}</th>
                    <th className="pb-2 font-normal text-right">{language === 'bn' ? 'রিস্ক লেভেল' : 'Risk'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {martingaleTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2.5 font-bold text-slate-300">{row.step}</td>
                      <td className="py-2.5 font-bold text-white">${row.stake}</td>
                      <td className="py-2.5 text-rose-400">-${row.cumulativeLoss}</td>
                      <td className="py-2.5 text-slate-300 font-semibold">${row.totalInvested}</td>
                      <td className="py-2.5 text-emerald-400 font-bold">+${row.netProfit}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                            idx === 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : idx === 1
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : idx === 2
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {row.riskTier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {language === 'bn' ? 'সর্বোচ্চ মোট ক্যাপিটাল রিকয়ারমেন্ট:' : 'Total Capital Needed For Strategy:'}
            </span>
            <span className="font-mono font-bold text-base text-rose-400">
              ${martingaleTable[martingaleTable.length - 1]?.totalInvested}
            </span>
          </div>
        </div>
      </div>

      {/* Compounding Growth Calculator Section */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {language === 'bn' ? 'কম্পাউন্ডিং ক্যাপিটাল গ্রোথ সিমুলেশন' : '30-Day Capital Compounding Projection'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'ছোট মুনাফা প্রতিদিন ধরে রাখলে ৩০ দিনে আপনার ক্যাপিটাল কীভাবে বৃদ্ধি পায়'
                : 'See how consistent small daily gains compound your trading capital over 30 days'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">{language === 'bn' ? '৩০ দিন পর প্রাক্কলিত ব্যালেন্স' : 'Projected Balance'}</span>
              <span className="font-mono font-bold text-lg text-emerald-400">${compoundingProjection.finalBalance}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'শুরুর মূলধন ($):' : 'Starting Capital ($):'}
            </label>
            <input
              type="number"
              min="10"
              value={compoundCapital}
              onChange={(e) => setCompoundCapital(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'দৈনিক টার্গেট লাভ (%):' : 'Daily Target Profit (%):'}
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={dailyTargetPercent}
              onChange={(e) => setDailyTargetPercent(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {language === 'bn' ? 'ট্রেডিং কার্যদিবস:' : 'Trading Days:'}
            </label>
            <input
              type="number"
              min="5"
              max="90"
              value={tradingDays}
              onChange={(e) => setTradingDays(Math.max(5, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white"
            />
          </div>
        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {compoundingProjection.checkpoints.map((pt) => (
            <div key={pt.day} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono">
              <span className="text-xs text-slate-400 block font-sans">
                {language === 'bn' ? `দিন ${pt.day}` : `Day ${pt.day}`}
              </span>
              <span className="text-sm font-bold text-white block mt-0.5">${pt.total}</span>
              <span className="text-[10px] text-emerald-400 block">+${pt.profit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
