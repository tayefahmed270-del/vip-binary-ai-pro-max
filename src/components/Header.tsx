import React from 'react';
import { AssetPair, AppTab, Language, MarketType } from '../types/trading';
import {
  TrendingUp,
  Zap,
  Bot,
  Calculator,
  History,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Globe,
  Smartphone,
  Layers,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  assetPairs: AssetPair[];
  selectedAsset: AssetPair;
  onSelectAsset: (asset: AssetPair) => void;
  marketMode: MarketType;
  onSelectMarketMode: (mode: MarketType) => void;
  balance: number;
  onResetBalance: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenManifestModal: () => void;
  floatingWidgetEnabled: boolean;
  onToggleFloatingWidget: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  assetPairs,
  selectedAsset,
  onSelectAsset,
  marketMode,
  onSelectMarketMode,
  balance,
  onResetBalance,
  soundEnabled,
  onToggleSound,
  language,
  onToggleLanguage,
  onOpenManifestModal,
  floatingWidgetEnabled,
  onToggleFloatingWidget,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Package identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 font-black">
            <span className="text-sm tracking-tighter">VIP</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                VIP Binary AI Pro Max
              </h1>
              <button
                type="button"
                onClick={onOpenManifestModal}
                title="Click to view app/src/main/AndroidManifest.xml & APK Build Guide"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition-colors cursor-pointer"
              >
                <Smartphone className="w-2.5 h-2.5" />
                com.vipbinary.aipromax
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">● Quotex Live Ticks</span>
              <span>·</span>
              <span>Confluence Engine v4.5</span>
              <span>·</span>
              <span className="text-blue-400 font-mono">5s SLA</span>
            </div>
          </div>
        </div>

        {/* Center: Market Mode & Asset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* REAL / OTC / AUTO Selector */}
          <div className="flex items-center bg-[#0F172A] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onSelectMarketMode('AUTO')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                marketMode === 'AUTO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              AUTO
            </button>
            <button
              type="button"
              onClick={() => onSelectMarketMode('OTC')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                marketMode === 'OTC' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              OTC
            </button>
            <button
              type="button"
              onClick={() => onSelectMarketMode('REAL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                marketMode === 'REAL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              REAL
            </button>
          </div>

          {/* Asset Dropdown */}
          <div className="flex items-center gap-2 bg-[#0F172A] p-1 rounded-xl border border-slate-800">
            <div className="relative">
              <select
                value={selectedAsset.id}
                onChange={(e) => {
                  const found = assetPairs.find((a) => a.id === e.target.value);
                  if (found) onSelectAsset(found);
                }}
                className="appearance-none bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-1.5 pl-3 pr-8 rounded-lg border border-slate-700/80 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {assetPairs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.marketType}] ({p.payoutPercent}%)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="px-2 py-1 bg-emerald-950/80 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs font-mono font-bold">
              {selectedAsset.payoutPercent}% {language === 'bn' ? 'লাভ' : 'PAYOUT'}
            </div>
          </div>
        </div>

        {/* Right side controls: Balance, Audio, Language */}
        <div className="flex items-center gap-2">
          {/* Practice Balance Widget */}
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {language === 'bn' ? 'ভিআইপি ডেমো অ্যাকাউন্ট' : 'VIP Demo Account'}
              </span>
              <span className="font-mono font-extrabold text-sm text-emerald-400">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={onResetBalance}
              title={language === 'bn' ? 'ব্যালেন্স রিসেট করুন ($10,000)' : 'Reset Balance to $10,000'}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 ml-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio & Voice' : 'Unmute Audio & Voice'}
            className="p-2 rounded-xl bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Floating Widget HUD Toggle */}
          <button
            type="button"
            onClick={onToggleFloatingWidget}
            title={
              floatingWidgetEnabled
                ? 'Disable Floating Signal HUD'
                : 'Enable Floating Signal HUD (FloatingWidgetService.kt)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              floatingWidgetEnabled
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-md shadow-amber-950/40'
                : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HUD</span>
          </button>

          {/* Android Manifest Button */}
          <button
            type="button"
            onClick={onOpenManifestModal}
            title="Android APK Manifest & Architecture"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0F172A] border border-blue-900/60 text-blue-300 hover:text-white hover:bg-blue-950/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">APK</span>
          </button>

          {/* Language Toggle (EN / BN) */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title="Toggle English / বাংলা"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0F172A] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <nav className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setCurrentTab('terminal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'terminal'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'লাইভ টার্মিনাল' : 'Live Terminal'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('signals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'signals'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>{language === 'bn' ? 'এআই ভিআইপি সিগন্যাল' : 'VIP AI Signals'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('gemini')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'gemini'
              ? 'bg-indigo-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'জেমিনাই কোয়ান্ট এআই' : 'Gemini AI Quant'}</span>
        </button>

        {/* Diagnostics Dashboard Tab */}
        <button
          type="button"
          onClick={() => setCurrentTab('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'diagnostics'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-300" />
          <span>{language === 'bn' ? 'ডায়াগনস্টিক ও ফিড অডিট' : 'Diagnostics & Telemetry'}</span>
        </button>

        {/* Automated Tests Tab */}
        <button
          type="button"
          onClick={() => setCurrentTab('tests')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'tests'
              ? 'bg-cyan-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
          <span>{language === 'bn' ? 'অটোমেটেড টেস্ট স্যুট' : 'Automated Tests'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('martingale')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'martingale'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'মার্টিনগেল ক্যালকুলেটর' : 'Martingale & Risk Lab'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-700 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ট্রেড হিস্ট্রি' : 'Trade Journal'}</span>
        </button>
      </nav>
    </header>
  );
};
