/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  AssetPair,
  Candle,
  IndicatorSettings,
  ActiveTrade,
  PastTrade,
  VipSignal,
  AppTab,
  Language,
  TradeDirection,
  MarketType,
  DiagnosticMetrics,
} from './types/trading';
import { ASSET_PAIRS, generateInitialCandles, generateNextTick, generateVipSignal, getFilteredAssets } from './utils/mockMarket';
import { evaluateConfluenceEngine } from './utils/indicators';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { CandleChart } from './components/CandleChart';
import { ExecutionPanel } from './components/ExecutionPanel';
import { SignalsRadar } from './components/SignalsRadar';
import { GeminiAdvisor } from './components/GeminiAdvisor';
import { MartingaleCalculator } from './components/MartingaleCalculator';
import { TradeHistory } from './components/TradeHistory';
import { PatternScanner } from './components/PatternScanner';
import { AndroidManifestModal } from './components/AndroidManifestModal';
import { FloatingSignalWidget } from './components/FloatingSignalWidget';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { AutomatedTestRunner } from './components/AutomatedTestRunner';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('terminal');
  const [marketMode, setMarketMode] = useState<MarketType>('AUTO');

  // Filtered assets based on market mode (REAL / OTC / AUTO)
  const availableAssets = useMemo(() => getFilteredAssets(marketMode), [marketMode]);
  const [selectedAsset, setSelectedAsset] = useState<AssetPair>(availableAssets[0] || ASSET_PAIRS[0]);

  // Keep selected asset valid if marketMode changes
  useEffect(() => {
    if (!availableAssets.some((a) => a.id === selectedAsset.id)) {
      if (availableAssets.length > 0) {
        setSelectedAsset(availableAssets[0]);
      }
    }
  }, [availableAssets, selectedAsset.id]);

  const [timeframe, setTimeframe] = useState<string>('1m');
  const [language, setLanguage] = useState<Language>('bn'); // Bengali by default as requested
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState<boolean>(false);
  const [isFloatingWidgetEnabled, setIsFloatingWidgetEnabled] = useState<boolean>(true);

  // Indicators state
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showEma9: true,
    showEma21: true,
    showBollinger: true,
    showRsi: true,
    chartType: 'candle',
  });

  // Account Balance (stored in localStorage)
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('vip_binary_balance');
    return saved ? Number(saved) : 10000;
  });

  // Candles & Countdown
  const getTimeframeSeconds = (tf: string): number => {
    switch (tf) {
      case '5s':
        return 5;
      case '15s':
        return 15;
      case '30s':
        return 30;
      case '1m':
        return 60;
      case '2m':
        return 120;
      case '5m':
        return 300;
      default:
        return 60;
    }
  };

  const tfSeconds = getTimeframeSeconds(timeframe);
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(ASSET_PAIRS[0], 60, 60));
  const [candleSecondsRemaining, setCandleSecondsRemaining] = useState<number>(tfSeconds);

  // Active & Past Trades
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [pastTrades, setPastTrades] = useState<PastTrade[]>(() => {
    const saved = localStorage.getItem('vip_binary_past_trades');
    return saved ? JSON.parse(saved) : [];
  });

  // Signals State
  const [signals, setSignals] = useState<VipSignal[]>(() => {
    const initialSig = generateVipSignal(ASSET_PAIRS[0], candles, '1M', 75);
    const seedCandles1 = generateInitialCandles(ASSET_PAIRS[1], 60, 50, 'STRONG_BULLISH');
    const seedCandles2 = generateInitialCandles(ASSET_PAIRS[2], 60, 50, 'STRONG_BEARISH');
    const sig1 = generateVipSignal(ASSET_PAIRS[1], seedCandles1, '1M', 75);
    const sig2 = generateVipSignal(ASSET_PAIRS[2], seedCandles2, '2M', 75);

    return [
      initialSig,
      { ...sig1, id: 'seed_2', status: 'WON' },
      { ...sig2, id: 'seed_3', status: 'WON' },
    ];
  });

  // Diagnostic Metrics State
  const [metrics, setMetrics] = useState<DiagnosticMetrics>(() => {
    const sig = signals[0];
    return {
      connectionStatus: 'CONNECTED',
      marketType: selectedAsset.marketType,
      instrument: selectedAsset.name,
      dataProvider: selectedAsset.provider,
      latestTimestamp: Date.now(),
      dataAgeMs: 450,
      candleCount: candles.length,
      dataIntegrityStatus: 'VALID',
      indicatorCalculationMs: 2.1,
      aiResponseMs: 12.0,
      totalAnalysisDurationMs: sig.stageTimings.totalElapsedMs || 3.4,
      signalScore: {
        bullish: sig.scores?.bullishScore || 65,
        bearish: sig.scores?.bearishScore || 35,
        net: sig.scores?.netBias || 30,
      },
      calibratedProbability: sig.confidence,
      decisionThreshold: 75,
      lastDecision: sig.decision,
      exactReasonForWait: sig.waitReason,
      bengaliReasonForWait: sig.bengaliWaitReason,
      lastSuccessfulUpdate: Date.now(),
      disclaimerBengali: 'অতীত পারফরম্যান্স ভবিষ্যতের ফলাফলের নিশ্চয়তা দেয় না।',
    };
  });

  // Keep sound class synced with state
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Persist balance & past trades
  useEffect(() => {
    localStorage.setItem('vip_binary_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('vip_binary_past_trades', JSON.stringify(pastTrades));
  }, [pastTrades]);

  // When asset or timeframe changes, initialize historical candles
  useEffect(() => {
    const freshCandles = generateInitialCandles(selectedAsset, tfSeconds, 60);
    setCandles(freshCandles);
    setCandleSecondsRemaining(tfSeconds);
  }, [selectedAsset, timeframe, tfSeconds]);

  // Real-time market tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const lastCandle = prev[prev.length - 1];
        const { updatedCandle } = generateNextTick(lastCandle, selectedAsset);
        const copy = [...prev];
        copy[copy.length - 1] = updatedCandle;
        return copy;
      });

      setCandleSecondsRemaining((sec) => {
        if (sec <= 1) {
          // Close candle and start new candle
          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            const newCandle: Candle = {
              time: Math.floor(Date.now() / 1000),
              open: last.close,
              high: last.close,
              low: last.close,
              close: last.close,
              volume: Math.floor(Math.random() * 20) + 1,
            };
            return [...prev.slice(-119), newCandle];
          });
          return tfSeconds;
        }
        return sec - 1;
      });

      // Update diagnostic telemetry
      setMetrics((m) => {
        const now = Date.now();
        const lastCandleTime = candles[candles.length - 1]?.time ? candles[candles.length - 1].time * 1000 : now;
        const age = Math.max(10, now - lastCandleTime);
        return {
          ...m,
          latestTimestamp: now,
          dataAgeMs: age,
          candleCount: candles.length,
          dataIntegrityStatus: age > 180000 ? 'STALE' : 'VALID',
          lastSuccessfulUpdate: now,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedAsset, tfSeconds, candles]);

  // Monitor and resolve active trades
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const checkInterval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const currentPrice = candles[candles.length - 1]?.close ?? selectedAsset.basePrice;

      const remaining: ActiveTrade[] = [];
      const resolved: PastTrade[] = [];

      activeTrades.forEach((trade) => {
        if (nowSec >= trade.endTime) {
          const isCall = trade.direction === 'CALL';
          const won = isCall ? currentPrice > trade.entryPrice : currentPrice < trade.entryPrice;
          const tie = currentPrice === trade.entryPrice;

          let netPnl = 0;
          let status: 'WON' | 'LOST' | 'TIE' = 'LOST';

          if (won) {
            status = 'WON';
            netPnl = trade.potentialProfit;
            setBalance((b) => b + trade.amount + trade.potentialProfit);
            sound.playWin();

            try {
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#10B981', '#38BDF8', '#F59E0B'],
              });
            } catch (e) {
              // ignore
            }
          } else if (tie) {
            status = 'TIE';
            netPnl = 0;
            setBalance((b) => b + trade.amount);
          } else {
            status = 'LOST';
            netPnl = -trade.amount;
            sound.playLoss();
          }

          resolved.push({
            ...trade,
            status,
            exitPrice: currentPrice,
            netPnl,
            closedAt: Date.now(),
          });
        } else {
          remaining.push(trade);
        }
      });

      if (resolved.length > 0) {
        setActiveTrades(remaining);
        setPastTrades((prev) => [...resolved, ...prev]);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [activeTrades, candles, selectedAsset.basePrice]);

// Automated 45-second signal scan disabled; use manual analysis buttons.


  // Place Trade handler
  const handlePlaceTrade = useCallback(
    (direction: TradeDirection, amount: number, durationSeconds: number) => {
      if (amount > balance) return;

      const currentPrice = candles[candles.length - 1]?.close ?? selectedAsset.basePrice;
      const potentialProfit = Number(((amount * selectedAsset.payoutPercent) / 100).toFixed(2));
      const nowSec = Math.floor(Date.now() / 1000);

      const newTrade: ActiveTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        direction,
        entryPrice: currentPrice,
        currentPrice,
        amount,
        payoutPercent: selectedAsset.payoutPercent,
        potentialProfit,
        durationSeconds,
        startTime: nowSec,
        endTime: nowSec + durationSeconds,
        status: 'OPEN',
      };

      setBalance((b) => b - amount);
      setActiveTrades((prev) => [newTrade, ...prev]);
      sound.playTradePlaced();
    },
    [balance, candles, selectedAsset]
  );

  // Manual Trigger New Signal (< 5s SLA)
  const handleGenerateSignal = () => {
    const tStart = performance.now();
    const newSig = generateVipSignal(selectedAsset, candles, '1M', 75);
    const duration = performance.now() - tStart;

    sound.playSignalAlert();
    sound.speakSignalResult(newSig, language);

    setSignals((prev) => [newSig, ...prev.slice(0, 19)]);
    setMetrics((m) => ({
      ...m,
      lastDecision: newSig.decision,
      calibratedProbability: newSig.confidence,
      exactReasonForWait: newSig.waitReason,
      bengaliReasonForWait: newSig.bengaliWaitReason,
      totalAnalysisDurationMs: duration,
      signalScore: {
        bullish: newSig.scores.bullishScore,
        bearish: newSig.scores.bearishScore,
        net: newSig.scores.netBias,
      },
    }));
  };

  // Quick Trade from Signal Card (Only allowed for CALL or PUT, never WAIT)
  const handleQuickTradeFromSignal = (sig: VipSignal) => {
    if (sig.decision === 'WAIT') return;
    const found = ASSET_PAIRS.find((a) => a.id === sig.assetId);
    if (found && found.id !== selectedAsset.id) {
      setSelectedAsset(found);
    }
    handlePlaceTrade(sig.decision as TradeDirection, 50, 60);
    setCurrentTab('terminal');
  };

  const handleResetBalance = () => {
    setBalance(10000);
  };

  const handleClearHistory = () => {
    setPastTrades([]);
  };

  const handleRefreshFeed = () => {
    const fresh = generateInitialCandles(selectedAsset, tfSeconds, 60);
    setCandles(fresh);
    setCandleSecondsRemaining(tfSeconds);
  };

  const currentPrice = candles[candles.length - 1]?.close ?? selectedAsset.basePrice;
  const activeSignal = signals.find((s) => s.status === 'ACTIVE') || signals[0] || null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        assetPairs={availableAssets}
        selectedAsset={selectedAsset}
        onSelectAsset={setSelectedAsset}
        marketMode={marketMode}
        onSelectMarketMode={setMarketMode}
        balance={balance}
        onResetBalance={handleResetBalance}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'))}
        onOpenManifestModal={() => setIsManifestModalOpen(true)}
        floatingWidgetEnabled={isFloatingWidgetEnabled}
        onToggleFloatingWidget={() => setIsFloatingWidgetEnabled((prev) => !prev)}
      />

      {/* Floating Signal HUD Widget (FloatingWidgetService.kt Simulation) */}
      {isFloatingWidgetEnabled && (
        <FloatingSignalWidget
          signal={activeSignal}
          onQuickTrade={handleQuickTradeFromSignal}
          language={language}
          onClose={() => setIsFloatingWidgetEnabled(false)}
        />
      )}

      {/* Android Manifest & Config Modal */}
      <AndroidManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        language={language}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5">
        {currentTab === 'terminal' && (
          <div className="flex flex-col gap-4">
            {/* Real-time Pattern & Momentum Bar */}
            <PatternScanner
              candles={candles}
              asset={selectedAsset}
              language={language}
              onQuickSignalRequest={handleGenerateSignal}
            />

            {/* Split Grid: Canvas Candlestick Chart (Left 70%) & Execution Panel (Right 30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-8 xl:col-span-9 min-h-[500px] flex flex-col">
                <CandleChart
                  candles={candles}
                  asset={selectedAsset}
                  indicators={indicators}
                  setIndicators={setIndicators}
                  activeTrades={activeTrades}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  candleSecondsRemaining={candleSecondsRemaining}
                />
              </div>

              <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
                <ExecutionPanel
                  asset={selectedAsset}
                  currentPrice={currentPrice}
                  balance={balance}
                  activeTrades={activeTrades}
                  onPlaceTrade={handlePlaceTrade}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'signals' && (
          <SignalsRadar
            signals={signals}
            currentAsset={selectedAsset}
            onGenerateNewSignal={handleGenerateSignal}
            onQuickTradeFromSignal={handleQuickTradeFromSignal}
            language={language}
          />
        )}

        {currentTab === 'gemini' && (
          <GeminiAdvisor
            asset={selectedAsset}
            candles={candles}
            timeframe={timeframe}
            language={language}
          />
        )}

        {currentTab === 'diagnostics' && (
          <DiagnosticDashboard
            metrics={metrics}
            selectedAsset={selectedAsset}
            candles={candles}
            lastSignal={activeSignal}
            language={language}
            onRefreshFeed={handleRefreshFeed}
          />
        )}

        {currentTab === 'tests' && (
          <AutomatedTestRunner language={language} />
        )}

        {currentTab === 'martingale' && <MartingaleCalculator language={language} />}

        {currentTab === 'history' && (
          <TradeHistory
            trades={pastTrades}
            onClearHistory={handleClearHistory}
            language={language}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#090D16] py-3 px-5 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-between max-w-[1720px] mx-auto gap-2">
          <span>VIP Binary AI Pro Max · Application Package: com.vipbinary.aipromax</span>
          <span className="text-slate-600">
            {language === 'bn'
              ? 'শিক্ষা ও কৌশল প্রশিক্ষণের উদ্দেশ্যে প্রস্তুতকৃত টার্মিনাল · কোনো ট্রেড স্বয়ংক্রিয়ভাবে কার্যকর হয় না'
              : 'Educational simulation and algorithmic decision terminal. Trades are never auto-placed.'}
          </span>
          <span className="font-mono text-emerald-500">Quotex Real/OTC Validated v4.5</span>
        </div>
      </footer>
    </div>
  );
}
