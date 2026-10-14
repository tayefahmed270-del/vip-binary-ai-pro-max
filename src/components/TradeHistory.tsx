import React, { useState } from 'react';
import { PastTrade, Language } from '../types/trading';
import { History, Download, Trash2, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle } from 'lucide-react';

interface TradeHistoryProps {
  trades: PastTrade[];
  onClearHistory: () => void;
  language: Language;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onClearHistory, language }) => {
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  const totalTrades = trades.length;
  const wonTrades = trades.filter((t) => t.status === 'WON').length;
  const lostTrades = trades.filter((t) => t.status === 'LOST').length;
  const winRate = totalTrades > 0 ? ((wonTrades / totalTrades) * 100).toFixed(1) : '0.0';
  const totalNetPnl = trades.reduce((sum, t) => sum + t.netPnl, 0);

  const filteredTrades = trades.filter((t) => {
    if (filter === 'won') return t.status === 'WON';
    if (filter === 'lost') return t.status === 'LOST';
    return true;
  });

  const exportCSV = () => {
    if (trades.length === 0) return;
    const headers = 'ID,Asset,Direction,Amount,EntryPrice,ExitPrice,NetPnL,Status,ClosedAt\n';
    const rows = trades
      .map(
        (t) =>
          `"${t.id}","${t.assetName}","${t.direction}",${t.amount},${t.entryPrice},${t.exitPrice},${t.netPnl},"${t.status}","${new Date(
            t.closedAt
          ).toISOString()}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vip_binary_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'মোট ট্রেড' : 'Total Executed'}</span>
          <span className="font-mono text-2xl font-bold text-white mt-1 block">{totalTrades}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'উইন রেট (Win %)' : 'Terminal Win Rate'}</span>
          <span className="font-mono text-2xl font-bold text-emerald-400 mt-1 block">{winRate}%</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'সফল / ব্যর্থ ট্রেড' : 'Won / Lost'}</span>
          <div className="flex items-center gap-2 mt-1 font-mono text-lg font-bold">
            <span className="text-emerald-400">{wonTrades}W</span>
            <span className="text-slate-500">/</span>
            <span className="text-rose-400">{lostTrades}L</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{language === 'bn' ? 'মোট নিট লাভ/ক্ষতি' : 'Total Net P&L'}</span>
          <span
            className={`font-mono text-2xl font-bold mt-1 block ${
              totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalNetPnl >= 0 ? `+$${totalNetPnl.toFixed(2)}` : `-$${Math.abs(totalNetPnl).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {language === 'bn' ? 'ট্রেড হিস্ট্রি ও অডিট ট্রেইল' : 'Execution Log & Performance Audit'}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'সব' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilter('won')}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === 'won' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'উইন' : 'Won'}
              </button>
              <button
                type="button"
                onClick={() => setFilter('lost')}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === 'lost' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'লস' : 'Lost'}
              </button>
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={exportCSV}
              disabled={trades.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs text-slate-200 border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Clear history */}
            <button
              type="button"
              onClick={onClearHistory}
              disabled={trades.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 disabled:opacity-40 text-xs text-rose-300 border border-rose-800/60 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
            </button>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{language === 'bn' ? 'কোনো পূর্ববর্তী ট্রেড রেকর্ড পাওয়া যায়নি' : 'No past trade records found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'অ্যাসেট' : 'Asset'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'টাইপ' : 'Type'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'পরিমাণ' : 'Stake'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'এন্ট্রি প্রাইস' : 'Entry'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'ক্লোজ প্রাইস' : 'Exit'}</th>
                  <th className="pb-2.5 font-normal">{language === 'bn' ? 'নিট লাভ/ক্ষতি' : 'P&L'}</th>
                  <th className="pb-2.5 font-normal text-right">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTrades.map((t) => {
                  const isWon = t.status === 'WON';
                  const isCall = t.direction === 'CALL';
                  const date = new Date(t.closedAt);
                  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 text-slate-400">{timeStr}</td>
                      <td className="py-2.5 font-sans font-medium text-slate-200">{t.assetName}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isCall ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCall ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-white">${t.amount}</td>
                      <td className="py-2.5 text-slate-400">{t.entryPrice}</td>
                      <td className="py-2.5 text-slate-400">{t.exitPrice}</td>
                      <td className="py-2.5 font-bold">
                        <span className={isWon ? 'text-emerald-400' : 'text-rose-400'}>
                          {isWon ? `+$${t.netPnl.toFixed(2)}` : `-$${Math.abs(t.netPnl).toFixed(2)}`}
                        </span>
                      </td>
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
