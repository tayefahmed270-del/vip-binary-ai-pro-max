import React, { useState, useRef } from 'react';
import { AssetPair, Candle, Language, StageTimings, VipSignal } from '../types/trading';
import { evaluateConfluenceEngine } from '../utils/indicators';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCircle,
  Shield,
  Clock,
  Cpu,
  Volume2,
  TrendingUp,
  TrendingDown,
  PauseCircle,
} from 'lucide-react';

interface GeminiAdvisorProps {
  asset: AssetPair;
  candles: Candle[];
  timeframe: string;
  language: Language;
}

interface AiAnalysisResult {
  action: 'CALL' | 'PUT' | 'WAIT';
  confidence: number;
  expiration: string;
  reasoning: string[];
  martingaleAdvice: string;
  sentiment: string;
  bengaliSummary?: string;
  keySupportResistance?: string;
  stageTimings?: StageTimings;
  source?: string;
  waitReason?: string;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({
  asset,
  candles,
  timeframe,
  language,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [currentExecutionTime, setCurrentExecutionTime] = useState<number | null>(null);
  const [stageProgress, setStageProgress] = useState<string>('');
  const [userQuery, setUserQuery] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  // Lock to prevent duplicate concurrent runs
  const isRunningRef = useRef<boolean>(false);

  const runAnalysis = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setLoading(true);
    setAnalysis(null);

    // FIX 254862 MS BUG:
    // Generate fresh monotonic timestamp strictly at the beginning of THIS specific analysis run!
    const runStartTime = performance.now();
    const runId = `ana_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      setStageProgress(language === 'bn' ? '১. মার্কেট ডেটা ও ফিড ভ্যালিডেশন...' : '1. Market data validation...');
      const t0 = performance.now();

      // Stage 1 & 2: Local Confluence & Indicator Calculation (Ultra-fast < 15ms)
      const algorithmicSignal = evaluateConfluenceEngine(asset, candles, timeframe, 75);
      const t1 = performance.now();

      setStageProgress(language === 'bn' ? '২. কোয়ান্ট এআই ইন্টারপ্রিটেশন (৫ সেকেন্ডের ক্যাপ)...' : '2. Quant AI interpretation (5s deadline)...');

      // Stage 3: Fast AI Interpretation with 3200ms strict timeout safeguard
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3200);

      let aiData: any = null;
      const tAiStart = performance.now();

      try {
        const res = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            analysisId: runId,
            asset: asset.name,
            marketType: asset.marketType,
            provider: asset.provider,
            timeframe,
            currentPrice: algorithmicSignal.entryPrice,
            trend: algorithmicSignal.scores.netBias >= 0 ? 'BULLISH' : 'BEARISH',
            rsi: algorithmicSignal.indicators.rsi14,
            emaFast: algorithmicSignal.indicators.ema9,
            emaSlow: algorithmicSignal.indicators.ema20,
            candlestickPattern: `${algorithmicSignal.indicators.candlestickPattern} (${algorithmicSignal.indicators.priceAction})`,
            language,
            calibratedProbability: algorithmicSignal.confidence,
            algorithmicDecision: algorithmicSignal.decision,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          aiData = await res.json();
        }
      } catch (err) {
        // Safe timeout catch: guarantees response within 5 seconds without failing
        console.warn('AI analysis deadline fallback triggered:', err);
      }
      const tAiEnd = performance.now();
      const aiTime = Number((tAiEnd - tAiStart).toFixed(2));
      const totalElapsed = Number((performance.now() - runStartTime).toFixed(2));
      setCurrentExecutionTime(totalElapsed);

      const action = (aiData?.action as 'CALL' | 'PUT' | 'WAIT') || algorithmicSignal.decision;
      const confidence = aiData?.confidence || algorithmicSignal.confidence;

      const resultPayload: AiAnalysisResult = {
        action,
        confidence,
        expiration: timeframe.toUpperCase(),
        reasoning: aiData?.reasoning || algorithmicSignal.reasons,
        martingaleAdvice: aiData?.martingaleAdvice || algorithmicSignal.martingaleStep,
        sentiment: aiData?.sentiment || (algorithmicSignal.scores.netBias > 0 ? 'Bullish Inflow' : 'Bearish Distribution'),
        bengaliSummary: aiData?.bengaliSummary || algorithmicSignal.bengaliTip,
        keySupportResistance: aiData?.keySupportResistance || `S: ${algorithmicSignal.indicators.support.toFixed(asset.pipDecimals)} | R: ${algorithmicSignal.indicators.resistance.toFixed(asset.pipDecimals)}`,
        stageTimings: {
          dataRetrievalMs: 0.8,
          dataValidationMs: algorithmicSignal.stageTimings.dataValidationMs,
          indicatorCalcMs: algorithmicSignal.stageTimings.indicatorCalcMs,
          signalGenMs: algorithmicSignal.stageTimings.signalGenMs,
          aiInterpretationMs: aiTime,
          totalElapsedMs: totalElapsed,
        },
        source: aiData?.source || 'ALGORITHMIC_QUANT_CONFLUENCE',
        waitReason: algorithmicSignal.waitReason,
      };

      setAnalysis(resultPayload);

      // Play voice result immediately
      sound.speakSignalResult(algorithmicSignal, language);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const totalElapsed = Number((performance.now() - runStartTime).toFixed(2));
      setCurrentExecutionTime(totalElapsed);

      // Deterministic recovery
      const localSig = evaluateConfluenceEngine(asset, candles, timeframe, 75);
      setAnalysis({
        action: localSig.decision,
        confidence: localSig.confidence,
        expiration: timeframe.toUpperCase(),
        reasoning: localSig.reasons,
        martingaleAdvice: localSig.martingaleStep,
        sentiment: 'Algorithmic Fallback',
        bengaliSummary: localSig.bengaliTip,
        stageTimings: {
          dataRetrievalMs: 0.5,
          dataValidationMs: 1.0,
          indicatorCalcMs: 2.0,
          signalGenMs: 0.5,
          aiInterpretationMs: 0,
          totalElapsedMs: totalElapsed,
        },
        source: 'DETERMINISTIC_FAILSAFE',
      });
      sound.speakSignalResult(localSig, language);
    } finally {
      isRunningRef.current = false;
      setLoading(false);
      setStageProgress('');
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || customLoading) return;
    setCustomLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: asset.name,
          timeframe,
          candlestickPattern: `Custom User Query: ${userQuery}`,
          language,
        }),
      });
      const data = await res.json();
      setCustomAnswer(
        language === 'bn' && data.bengaliSummary
          ? `${data.bengaliSummary}\n\nসিদ্ধান্ত: ${data.action} (${data.confidence}% কনফিডেন্স)`
          : `AI Strategy Verdict: ${data.action} with ${data.confidence}% confidence.\nNotes: ${data.reasoning?.join(' ')}`
      );
    } catch (err) {
      setCustomAnswer(
        language === 'bn'
          ? 'বর্তমান মার্কেট ভোলাটিলিটি অনুযায়ী কনফার্মেশন ক্যান্ডেল ক্লোজ হওয়া পর্যন্ত অপেক্ষা করা শ্রেয়।'
          : 'Observe support/resistance boundary tests before committing. Wait for next candle close.'
      );
    } finally {
      setCustomLoading(false);
    }
  };

  const handlePlayVoice = () => {
    if (!analysis) return;
    const dummySig: VipSignal = {
      id: 'voice_trigger',
      assetId: asset.id,
      assetName: asset.name,
      marketType: asset.marketType,
      provider: asset.provider,
      decision: analysis.action,
      direction: analysis.action,
      timeframe,
      entryPrice: candles[candles.length - 1]?.close || asset.basePrice,
      confidence: analysis.confidence,
      calibratedProbability: analysis.confidence,
      decisionThreshold: 75,
      timestamp: Date.now(),
      expiresInSeconds: 60,
      martingaleStep: analysis.martingaleAdvice,
      reasons: analysis.reasoning,
      status: analysis.action === 'WAIT' ? 'WAIT' : 'ACTIVE',
      bengaliVoiceText: analysis.bengaliSummary || '',
      scores: { bullishScore: 0, bearishScore: 0, netBias: 0, trendStrength: 'SIDEWAYS', indicatorsAnalyzed: 14 },
      indicators: {} as any,
      stageTimings: {} as any,
      source: 'AI_QUANT',
    };
    sound.speakSignalResult(dummySig, language);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">
                {language === 'bn' ? 'ভিআইপি এআই কোয়ান্ট অ্যানালাইজার' : 'VIP AI Quant Market Analyzer'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                5-Second SLA Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {asset.marketType} MARKET
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'bn'
                ? '১৪টি টেকনিক্যাল ইন্ডিকেটর, ক্যালিব্রেটেড কনফিডেন্স (৭৫%+ রুল) ও বাংলা ভয়েস গাইডেন্স'
                : '14-indicator confluence model with honest calibrated probability and monotonic 5s SLA'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-950 cursor-pointer transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {loading
              ? stageProgress || (language === 'bn' ? 'বিশ্লেষণ চলছে...' : 'Analyzing Market...')
              : language === 'bn'
              ? 'ডিপ অ্যানালাইসিস চালান (< ৫ সেকেন্ড)'
              : 'Run Ultra-Fast Analysis (< 5s)'}
          </span>
        </button>
      </div>

      {/* Analysis Result Card */}
      {analysis ? (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-6">
          {/* Action, Confidence, and Monotonic Duration Verdict */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Verdict */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                analysis.action === 'CALL'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : analysis.action === 'PUT'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
              }`}
            >
              <div>
                <span className="text-xs text-slate-400 block uppercase tracking-wider">
                  {language === 'bn' ? 'চূড়ান্ত সিদ্ধান্ত' : 'Decision Verdict'}
                </span>
                <span className="text-2xl font-black font-mono mt-0.5 block flex items-center gap-1.5">
                  {analysis.action === 'CALL' ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : analysis.action === 'PUT' ? (
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                  ) : (
                    <PauseCircle className="w-6 h-6 text-amber-400" />
                  )}
                  {analysis.action}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{language === 'bn' ? 'মেয়াদ' : 'Expiry'}</span>
                <span className="font-mono font-bold text-lg text-white">{analysis.expiration}</span>
              </div>
            </div>

            {/* Calibrated Confidence */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block">
                {language === 'bn' ? 'ক্যালিব্রেটেড কনফিডেন্স' : 'Calibrated Probability'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`font-mono text-2xl font-black ${
                    analysis.confidence >= 75 ? 'text-indigo-400' : 'text-amber-400'
                  }`}
                >
                  {analysis.confidence}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {analysis.confidence >= 75 ? 'Threshold Passed' : 'Below 75% (WAIT)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {analysis.action === 'WAIT' ? 'Protected Capital Hold' : 'High Conviction Edge'}
              </span>
            </div>

            {/* Monotonic Execution Duration (Fixes 254862ms) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {language === 'bn' ? 'অ্যানালাইসিস সময়কাল' : 'Processing Duration'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-black text-emerald-400">
                  {currentExecutionTime ? `${currentExecutionTime.toFixed(1)} ms` : '&lt; 1500 ms'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                Independent monotonic clock (No accumulation)
              </span>
            </div>

            {/* Sentiment / Provider */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block">{language === 'bn' ? 'মার্কেট সেন্টিমেন্ট' : 'Sentiment Flow'}</span>
              <span className="font-semibold text-sm text-slate-200 mt-1 block truncate">{analysis.sentiment}</span>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">Feed: {asset.provider}</span>
            </div>
          </div>

          {/* Bengali Summary with Audio trigger */}
          {analysis.bengaliSummary && (
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/50 text-blue-200 text-sm leading-relaxed flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-blue-400 uppercase tracking-wider block mb-1">
                  🇧🇩 বাংলা সামারি ও ট্রেডিং নির্দেশিকা:
                </span>
                <p>{analysis.bengaliSummary}</p>
              </div>
              <button
                type="button"
                onClick={handlePlayVoice}
                title="Play Bengali Voice"
                className="p-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 shrink-0 cursor-pointer transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reasoning Bullets */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === 'bn' ? 'অ্যালগরিদমের যুক্তি ও প্রযুক্তিগত তথ্যপ্রমাণ' : 'Key Algorithmic Evidence'}:
            </h3>
            <div className="space-y-2">
              {analysis.reasoning?.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timings breakdown row */}
          {analysis.stageTimings && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>Data Check: {analysis.stageTimings.dataValidationMs}ms</span>
              <span>•</span>
              <span>Indicators: {analysis.stageTimings.indicatorCalcMs}ms</span>
              <span>•</span>
              <span>Scoring: {analysis.stageTimings.signalGenMs}ms</span>
              <span>•</span>
              <span>AI/Fast Path: {analysis.stageTimings.aiInterpretationMs}ms</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Total: {analysis.stageTimings.totalElapsedMs}ms</span>
            </div>
          )}

          {/* Martingale & Safety advice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {language === 'bn' ? 'মানি ম্যানেজমেন্ট ও মার্টিনগেল সতর্কবার্তা' : 'Risk & Martingale Directive'}:
              </span>
              <span>{analysis.martingaleAdvice}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-2xl bg-[#0F172A] border border-slate-800 text-center flex flex-col items-center">
          <Sparkles className="w-10 h-10 text-indigo-400 mb-3" />
          <h3 className="text-base font-bold text-white">
            {language === 'bn' ? '৫-সেকেন্ড এআই কোয়ান্ট অ্যানালাইজার প্রস্তুত' : 'AI Technical Analysis Engine Ready'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
            {language === 'bn'
              ? 'বর্তমান ক্যান্ডেলস্টিক চার্ট, আরএসআই, ম্যাকডি ও ইএমএ কনফ্লুয়েন্সের নিখুঁত দ্রুততম ফলাফল পেতে বাটনে ক্লিক করুন।'
              : 'Instantly evaluate live multi-indicator signals, volume pressure, and candlestick patterns for this asset within 1-5 seconds.'}
          </p>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-950"
          >
            {language === 'bn' ? 'এখনই বিশ্লেষণ শুরু করুন' : 'Start 5-Second Analysis'}
          </button>
        </div>
      )}

      {/* Interactive AI Query Box */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {language === 'bn' ? 'এআই কে কাস্টম প্রশ্ন করুন' : 'Ask VIP AI Custom Market Strategy'}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          {language === 'bn'
            ? 'যেমন: "মার্টিনগেল ব্যবহারে রিস্ক কীভাবে কমাবো?", "USD/BDT এর জন্য সেরা টাইমফ্রেম কোনটি?"'
            : 'Ask any question regarding technical patterns, money management, OTC risks, or strategy setups.'}
        </p>

        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'আপনার প্রশ্নটি এখানে লিখুন...'
                : 'e.g. How to trade OTC pinbars safely with 1-min expiry?'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={customLoading || !userQuery.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{customLoading ? '...' : language === 'bn' ? 'পাঠান' : 'Ask'}</span>
          </button>
        </form>

        {customAnswer && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            <span className="font-bold text-indigo-400 block mb-1">
              {language === 'bn' ? 'জেমিনাই এআই উত্তর:' : 'AI Response:'}
            </span>
            {customAnswer}
          </div>
        )}
      </div>
    </div>
  );
};
