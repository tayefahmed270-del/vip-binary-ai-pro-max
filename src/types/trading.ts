export type TradeDirection = 'CALL' | 'PUT';
export type SignalDecision = 'CALL' | 'PUT' | 'WAIT';

export type MarketType = 'REAL' | 'OTC' | 'AUTO';

export type DataProvider =
  | 'QUOTEX_OTC'
  | 'INTERBANK_FOREX'
  | 'BINANCE_CRYPTO'
  | 'UNAVAILABLE';

export interface Candle {
  time: number; // timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetPair {
  id: string;
  name: string;
  basePrice: number;
  pipDecimals: number;
  payoutPercent: number;
  category: 'OTC' | 'FOREX' | 'CRYPTO';
  marketType: 'REAL' | 'OTC';
  provider: DataProvider;
  isSupported: boolean;
  unsupportedReason?: string;
  volatility: 'Low' | 'Medium' | 'High';
  feedFrequencyHz: number;
  lastUpdateTimestamp: number;
}

export interface IndicatorSettings {
  showEma9: boolean;
  showEma21: boolean;
  showBollinger: boolean;
  showRsi: boolean;
  chartType: 'candle' | 'line' | 'heikin';
}

export interface ActiveTrade {
  id: string;
  assetId: string;
  assetName: string;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  payoutPercent: number;
  potentialProfit: number;
  durationSeconds: number;
  startTime: number;
  endTime: number;
  status: 'OPEN' | 'WON' | 'LOST' | 'TIE';
}

export interface PastTrade extends ActiveTrade {
  exitPrice: number;
  netPnl: number;
  closedAt: number;
}

export interface StageTimings {
  dataRetrievalMs: number;
  dataValidationMs: number;
  indicatorCalcMs: number;
  signalGenMs: number;
  aiInterpretationMs: number;
  totalElapsedMs: number;
}

export interface ConfluenceScores {
  bullishScore: number; // 0 - 100
  bearishScore: number; // 0 - 100
  netBias: number; // -100 to +100
  trendStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'SIDEWAYS';
  indicatorsAnalyzed: number;
}

export interface IndicatorSummary {
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr14: number;
  adx14: number;
  support: number;
  resistance: number;
  candlestickPattern: string;
  priceAction: string;
}

export interface VipSignal {
  id: string; // unique analysis ID
  assetId: string;
  assetName: string;
  marketType: 'REAL' | 'OTC';
  provider: DataProvider;
  decision: SignalDecision; // CALL, PUT, or WAIT
  direction: SignalDecision; // legacy compatibility
  timeframe: string;
  entryPrice: number;
  confidence: number; // Calibrated probability (75-99% if CALL/PUT, or unverified/lower if WAIT)
  calibratedProbability: number;
  decisionThreshold: number; // e.g. 75%
  waitReason?: string;
  bengaliWaitReason?: string;
  timestamp: number;
  expiresInSeconds: number;
  martingaleStep: string;
  reasons: string[];
  status: 'ACTIVE' | 'WON' | 'LOST' | 'PENDING' | 'WAIT';
  bengaliTip?: string;
  bengaliVoiceText: string;
  scores: ConfluenceScores;
  indicators: IndicatorSummary;
  stageTimings: StageTimings;
  source: 'AI_QUANT' | 'ALGORITHMIC_CONFLUENCE' | 'FAST_ENGINE';
}

export interface DiagnosticMetrics {
  connectionStatus: 'CONNECTED' | 'VALIDATING' | 'RECONNECTING' | 'ERROR';
  marketType: 'REAL' | 'OTC';
  instrument: string;
  dataProvider: DataProvider;
  latestTimestamp: number;
  dataAgeMs: number;
  candleCount: number;
  dataIntegrityStatus: 'VALID' | 'WARNING_GAPS' | 'STALE' | 'INVALID';
  indicatorCalculationMs: number;
  aiResponseMs: number;
  totalAnalysisDurationMs: number;
  signalScore: {
    bullish: number;
    bearish: number;
    net: number;
  };
  calibratedProbability: number;
  decisionThreshold: number;
  lastDecision: SignalDecision;
  exactReasonForWait?: string;
  bengaliReasonForWait?: string;
  apiErrorDetails?: string;
  lastSuccessfulUpdate: number;
  disclaimerBengali: string;
}

export interface AutomatedTestCase {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  description: string;
  datasetName: string;
  expectedDecision: SignalDecision | 'DATA_UNAVAILABLE' | 'TIMEOUT_SAFE';
  runTest: () => Promise<TestResult>;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  actualDecision: string;
  confidence: number;
  durationMs: number;
  details: string;
  detailsBn: string;
  timestamp: number;
}

export type AppTab = 'terminal' | 'signals' | 'gemini' | 'diagnostics' | 'tests' | 'martingale' | 'history';
export type Language = 'en' | 'bn';
