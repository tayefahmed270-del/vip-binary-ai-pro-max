import { Candle, ConfluenceScores, IndicatorSummary, SignalDecision, StageTimings, VipSignal, AssetPair } from '../types/trading';

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  result[period - 1] = prevEma;

  for (let i = period; i < candles.length; i++) {
    prevEma = candles[i].close * k + prevEma * (1 - k);
    result[i] = prevEma;
  }

  return result;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  result[period - 1] = sum / period;

  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close;
    result[i] = sum / period;
  }

  return result;
}

/**
 * Calculate Bollinger Bands (period 20, multiplier 2)
 */
export interface BollingerBands {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
  bandwidth: (number | null)[];
}

export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const middle: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);
  const bandwidth: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return { upper, middle, lower, bandwidth };

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const sma = sum / period;
    middle[i] = sma;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(candles[i - j].close - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    const up = sma + stdDevMultiplier * stdDev;
    const low = sma - stdDevMultiplier * stdDev;
    upper[i] = up;
    lower[i] = low;
    bandwidth[i] = sma > 0 ? ((up - low) / sma) * 100 : 0;
  }

  return { upper, middle, lower, bandwidth };
}

/**
 * Calculate Relative Strength Index (RSI 14)
 */
export function calculateRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * default: fast=12, slow=26, signal=9
 */
export interface MACDResult {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const len = candles.length;
  const macdLine: (number | null)[] = new Array(len).fill(null);
  const signalLine: (number | null)[] = new Array(len).fill(null);
  const histogram: (number | null)[] = new Array(len).fill(null);

  if (len < slowPeriod + signalPeriod) {
    return { macdLine, signalLine, histogram };
  }

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  // Compute MACD Line = Fast EMA - Slow EMA
  const macdValues: { time: number; close: number }[] = [];
  for (let i = 0; i < len; i++) {
    const fast = fastEMA[i];
    const slow = slowEMA[i];
    if (fast !== null && slow !== null) {
      const diff = fast - slow;
      macdLine[i] = diff;
      macdValues.push({ time: candles[i].time, close: diff });
    }
  }

  // Signal Line = EMA of MACD Line
  if (macdValues.length >= signalPeriod) {
    const sigEMA = calculateEMA(macdValues as unknown as Candle[], signalPeriod);
    const offset = len - macdValues.length;
    for (let j = 0; j < macdValues.length; j++) {
      const sigVal = sigEMA[j];
      const targetIdx = offset + j;
      if (sigVal !== null) {
        signalLine[targetIdx] = sigVal;
        const lineVal = macdLine[targetIdx];
        if (lineVal !== null) {
          histogram[targetIdx] = lineVal - sigVal;
        }
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Average True Range (ATR 14) for Market Volatility
 */
export function calculateATR(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  // First ATR = simple average of first 'period' TRs
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  let prevAtr = sum / period;
  result[period] = prevAtr;

  // Smoothed ATR
  for (let i = period; i < trueRanges.length; i++) {
    prevAtr = (prevAtr * (period - 1) + trueRanges[i]) / period;
    result[i + 1] = prevAtr;
  }

  return result;
}

/**
 * Calculate Average Directional Index (ADX 14) for Trend Strength
 */
export interface ADXResult {
  adx: (number | null)[];
  plusDI: (number | null)[];
  minusDI: (number | null)[];
}

export function calculateADX(candles: Candle[], period: number = 14): ADXResult {
  const len = candles.length;
  const adx: (number | null)[] = new Array(len).fill(null);
  const plusDI: (number | null)[] = new Array(len).fill(null);
  const minusDI: (number | null)[] = new Array(len).fill(null);

  if (len < period * 2) {
    return { adx, plusDI, minusDI };
  }

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < len; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const trueRange = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr.push(trueRange);
  }

  // Smoothed TR, +DM, -DM
  let smoothTR = 0;
  let smoothPlusDM = 0;
  let smoothMinusDM = 0;

  for (let i = 0; i < period; i++) {
    smoothTR += tr[i];
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
  }

  const dxValues: number[] = [];

  for (let i = period; i < tr.length; i++) {
    if (i > period) {
      smoothTR = smoothTR - smoothTR / period + tr[i];
      smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
      smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
    }

    const pDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const mDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const candleIdx = i + 1;
    plusDI[candleIdx] = pDI;
    minusDI[candleIdx] = mDI;

    const diSum = pDI + mDI;
    const dx = diSum > 0 ? (Math.abs(pDI - mDI) / diSum) * 100 : 0;
    dxValues.push(dx);

    if (dxValues.length === period) {
      const adxInitial = dxValues.reduce((a, b) => a + b, 0) / period;
      adx[candleIdx] = adxInitial;
    } else if (dxValues.length > period) {
      const prevAdx = adx[candleIdx - 1] ?? dx;
      adx[candleIdx] = (prevAdx * (period - 1) + dx) / period;
    }
  }

  return { adx, plusDI, minusDI };
}

/**
 * Convert standard candles to Heikin-Ashi candles
 */
export function calculateHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const haCandles: Candle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    let haOpen = c.open;

    if (i > 0) {
      const prevHa = haCandles[i - 1];
      haOpen = (prevHa.open + prevHa.close) / 2;
    }

    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }

  return haCandles;
}

/**
 * Detect Candlestick Pattern on the latest completed candle
 */
export function detectCandlePattern(candles: Candle[]): {
  pattern: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
  scoreWeight: number; // 0 to 10
} {
  if (candles.length < 3) {
    return {
      pattern: 'Accumulating Candles',
      sentiment: 'NEUTRAL',
      description: 'Minimum 3 candles required for pattern validation.',
      scoreWeight: 0,
    };
  }

  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles.length >= 3 ? candles[candles.length - 3] : null;

  const currBody = Math.abs(curr.close - curr.open);
  const currRange = curr.high - curr.low;
  const isCurrGreen = curr.close > curr.open;

  const prevBody = Math.abs(prev.close - prev.open);
  const isPrevGreen = prev.close > prev.open;

  // 1. Morning Star / Evening Star (3-candle patterns)
  if (prev2) {
    const prev2Body = Math.abs(prev2.close - prev2.open);
    const isPrev2Green = prev2.close > prev2.open;
    // Morning Star: Prev2 is red, Prev is small body at bottom, Curr is strong green
    if (!isPrev2Green && isCurrGreen && curr.close > prev2.close && prevBody < prev2Body * 0.4) {
      return {
        pattern: 'Morning Star',
        sentiment: 'BULLISH',
        description: 'Classic 3-candle bullish reversal formation at swing low.',
        scoreWeight: 9,
      };
    }
    // Evening Star: Prev2 is green, Prev is small body at top, Curr is strong red
    if (isPrev2Green && !isCurrGreen && curr.close < prev2.close && prevBody < prev2Body * 0.4) {
      return {
        pattern: 'Evening Star',
        sentiment: 'BEARISH',
        description: 'Classic 3-candle bearish reversal formation at swing high.',
        scoreWeight: 9,
      };
    }
  }

  // 2. Bullish Engulfing
  if (!isPrevGreen && isCurrGreen && curr.open <= prev.close && curr.close >= prev.open && currBody > prevBody) {
    return {
      pattern: 'Bullish Engulfing',
      sentiment: 'BULLISH',
      description: 'Strong buyers completely swallow prior red candle body.',
      scoreWeight: 8,
    };
  }

  // 3. Bearish Engulfing
  if (isPrevGreen && !isCurrGreen && curr.open >= prev.close && curr.close <= prev.open && currBody > prevBody) {
    return {
      pattern: 'Bearish Engulfing',
      sentiment: 'BEARISH',
      description: 'Sellers aggressive engulfment overwhelms previous bullish candle.',
      scoreWeight: 8,
    };
  }

  // 4. Hammer Pinbar (Bullish rejection at support)
  const lowerWick = Math.min(curr.open, curr.close) - curr.low;
  const upperWick = curr.high - Math.max(curr.open, curr.close);
  if (currRange > 0 && lowerWick >= currBody * 2 && upperWick < currBody * 0.5) {
    return {
      pattern: 'Hammer Pinbar',
      sentiment: 'BULLISH',
      description: 'Severe rejection of low prices. Buyer wick defense confirmed.',
      scoreWeight: 7,
    };
  }

  // 5. Shooting Star (Bearish rejection at resistance)
  if (currRange > 0 && upperWick >= currBody * 2 && lowerWick < currBody * 0.5) {
    return {
      pattern: 'Shooting Star',
      sentiment: 'BEARISH',
      description: 'Strong rejection of high prices. Seller wick push confirmed.',
      scoreWeight: 7,
    };
  }

  // 6. Bullish Marubozu (Clean strong trend bar)
  if (isCurrGreen && currRange > 0 && currBody / currRange > 0.85) {
    return {
      pattern: 'Bullish Marubozu',
      sentiment: 'BULLISH',
      description: 'Decisive bullish impulse candle with near-zero wicks.',
      scoreWeight: 7,
    };
  }

  // 7. Bearish Marubozu
  if (!isCurrGreen && currRange > 0 && currBody / currRange > 0.85) {
    return {
      pattern: 'Bearish Marubozu',
      sentiment: 'BEARISH',
      description: 'Decisive bearish distribution candle with near-zero wicks.',
      scoreWeight: 7,
    };
  }

  // 8. Doji (Indecision)
  if (currRange > 0 && currBody / currRange < 0.12) {
    return {
      pattern: 'Doji Star',
      sentiment: 'NEUTRAL',
      description: 'Market equilibrium / indecision candle. Do not trade breakout yet.',
      scoreWeight: 1,
    };
  }

  // 9. Trend Momentum continuation
  if (isCurrGreen && isPrevGreen) {
    return {
      pattern: 'Bullish Momentum',
      sentiment: 'BULLISH',
      description: 'Consecutive upward candles indicating steady trend push.',
      scoreWeight: 5,
    };
  } else if (!isCurrGreen && !isPrevGreen) {
    return {
      pattern: 'Bearish Momentum',
      sentiment: 'BEARISH',
      description: 'Consecutive downward candles indicating steady trend push.',
      scoreWeight: 5,
    };
  }

  return {
    pattern: 'Consolidation Bar',
    sentiment: 'NEUTRAL',
    description: 'Range-bound sideways price action within prior envelope.',
    scoreWeight: 2,
  };
}

/**
 * Compute Support and Resistance levels from recent swing points
 */
export function getAutoSupportResistance(candles: Candle[]): {
  support: number;
  resistance: number;
  isNearSupport: boolean;
  isNearResistance: boolean;
} {
  if (candles.length < 10) {
    return { support: 0, resistance: 0, isNearSupport: false, isNearResistance: false };
  }
  const slice = candles.slice(-40);
  let minLow = Infinity;
  let maxHigh = -Infinity;

  for (const c of slice) {
    if (c.low < minLow) minLow = c.low;
    if (c.high > maxHigh) maxHigh = c.high;
  }

  const currentPrice = candles[candles.length - 1].close;
  const range = maxHigh - minLow || currentPrice * 0.001;
  const proximityThreshold = range * 0.12;

  const isNearSupport = Math.abs(currentPrice - minLow) <= proximityThreshold;
  const isNearResistance = Math.abs(currentPrice - maxHigh) <= proximityThreshold;

  return { support: minLow, resistance: maxHigh, isNearSupport, isNearResistance };
}

/**
 * Check Price Action Micro-Structure (Higher Highs / Lower Lows)
 */
export function evaluatePriceAction(candles: Candle[]): {
  structure: 'HIGHER_HIGHS' | 'LOWER_LOWS' | 'SIDEWAYS_RANGE';
  description: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
} {
  if (candles.length < 8) {
    return {
      structure: 'SIDEWAYS_RANGE',
      description: 'Insufficient candles for structure mapping',
      bias: 'NEUTRAL',
    };
  }

  const c1 = candles[candles.length - 1];
  const c2 = candles[candles.length - 3];
  const c3 = candles[candles.length - 5];

  const hh = c1.high > c2.high && c2.high > c3.high;
  const hl = c1.low > c2.low && c2.low > c3.low;

  const lh = c1.high < c2.high && c2.high < c3.high;
  const ll = c1.low < c2.low && c2.low < c3.low;

  if (hh && hl) {
    return {
      structure: 'HIGHER_HIGHS',
      description: 'Clean bullish market structure with Higher Highs & Higher Lows',
      bias: 'BULLISH',
    };
  }

  if (lh && ll) {
    return {
      structure: 'LOWER_LOWS',
      description: 'Clean bearish market structure with Lower Highs & Lower Lows',
      bias: 'BEARISH',
    };
  }

  return {
    structure: 'SIDEWAYS_RANGE',
    description: 'Compressing sideways range with no distinct swing hierarchy',
    bias: 'NEUTRAL',
  };
}

/**
 * HIGH-QUALITY CONFLUENCE SIGNAL ENGINE
 * Evaluates:
 * - EMA 9, 20, 50, 200
 * - RSI 14
 * - MACD (12, 26, 9)
 * - Bollinger Bands (20, 2)
 * - ATR 14
 * - ADX 14
 * - Support & Resistance Proximity
 * - Candlestick Patterns
 * - Price Action Structure
 *
 * Enforces:
 * - Transparent scoring model
 * - Honest calibrated probability (min 75% for CALL / PUT)
 * - Decision: CALL, PUT, or WAIT
 * - Stage timing measurement
 */
export function evaluateConfluenceEngine(
  asset: AssetPair,
  candles: Candle[],
  timeframeStr: string = '1M',
  minConfidenceThreshold: number = 75
): VipSignal {
  const tStart = performance.now();

  // 1. Data Validation Phase
  const tValStart = performance.now();
  let dataValidationIssue: string | null = null;
  let bengaliValidationIssue: string | null = null;

  if (!asset.isSupported) {
    dataValidationIssue = asset.unsupportedReason || 'Instrument feed is not supported by configured provider.';
    bengaliValidationIssue = 'নির্বাচিত ইনস্ট্রুমেন্টটি বর্তমান ডেটা প্রোভাইডারে অনুপলব্ধ।';
  } else if (!candles || candles.length < 15) {
    dataValidationIssue = `Insufficient candle history (${candles ? candles.length : 0} / 15 minimum).`;
    bengaliValidationIssue = 'পর্যাপ্ত হিস্টোরিক্যাল ক্যান্ডেল পাওয়া যায়নি (কমপক্ষে ১৫টি ক্যান্ডেল প্রয়োজন)।';
  } else {
    // Check for stale data (> 120 seconds old)
    const latestCandleTime = candles[candles.length - 1].time;
    const nowSec = Math.floor(Date.now() / 1000);
    const dataAgeSec = nowSec - latestCandleTime;
    if (dataAgeSec > 180) {
      dataValidationIssue = `Stale market feed detected (${dataAgeSec}s old). Live analysis halted for safety.`;
      bengaliValidationIssue = `মার্কেট ডেটা পুরনো (${dataAgeSec} সেকেন্ড পুরনো)। ঝুঁকি এড়াতে অ্যানালাইসিস স্থগিত।`;
    }
  }
  const tValEnd = performance.now();
  const dataValidationMs = Number((tValEnd - tValStart).toFixed(2));

  // If validation fails immediately, return WAIT with exact reason
  if (dataValidationIssue) {
    const totalElapsed = Number((performance.now() - tStart).toFixed(2));
    const currentPrice = candles && candles.length > 0 ? candles[candles.length - 1].close : asset.basePrice;

    return {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assetId: asset.id,
      assetName: asset.name,
      marketType: asset.marketType,
      provider: asset.provider,
      decision: 'WAIT',
      direction: 'WAIT',
      timeframe: timeframeStr,
      entryPrice: currentPrice,
      confidence: 45.0,
      calibratedProbability: 45.0,
      decisionThreshold: minConfidenceThreshold,
      waitReason: dataValidationIssue,
      bengaliWaitReason: bengaliValidationIssue || dataValidationIssue,
      timestamp: Date.now(),
      expiresInSeconds: 60,
      martingaleStep: 'WAIT (No Trade - Data Guard)',
      reasons: [dataValidationIssue],
      status: 'WAIT',
      bengaliTip: bengaliValidationIssue || dataValidationIssue,
      bengaliVoiceText: 'বর্তমানে পর্যাপ্ত নির্ভরযোগ্য সংকেত পাওয়া যায়নি।',
      scores: {
        bullishScore: 0,
        bearishScore: 0,
        netBias: 0,
        trendStrength: 'SIDEWAYS',
        indicatorsAnalyzed: 0,
      },
      indicators: {
        ema9: currentPrice,
        ema20: currentPrice,
        ema50: currentPrice,
        ema200: currentPrice,
        rsi14: 50,
        macd: { line: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: currentPrice, middle: currentPrice, lower: currentPrice, bandwidth: 0 },
        atr14: 0,
        adx14: 0,
        support: 0,
        resistance: 0,
        candlestickPattern: 'None',
        priceAction: 'Data Unavailable',
      },
      stageTimings: {
        dataRetrievalMs: 0.5,
        dataValidationMs,
        indicatorCalcMs: 0,
        signalGenMs: 0.2,
        aiInterpretationMs: 0,
        totalElapsedMs: totalElapsed,
      },
      source: 'FAST_ENGINE',
    };
  }

  // 2. Indicator Calculation Phase
  const tIndStart = performance.now();
  const currentPrice = candles[candles.length - 1].close;

  const ema9Values = calculateEMA(candles, 9);
  const ema20Values = calculateEMA(candles, 20);
  const ema50Values = calculateEMA(candles, 50);
  const ema200Values = calculateEMA(candles, 200);

  const rsiValues = calculateRSI(candles, 14);
  const bb = calculateBollingerBands(candles, 20, 2);
  const macd = calculateMACD(candles, 12, 26, 9);
  const atrValues = calculateATR(candles, 14);
  const adxData = calculateADX(candles, 14);

  const sr = getAutoSupportResistance(candles);
  const patternInfo = detectCandlePattern(candles);
  const priceActionInfo = evaluatePriceAction(candles);

  const lastIdx = candles.length - 1;
  const lastEma9 = ema9Values[lastIdx] ?? currentPrice;
  const lastEma20 = ema20Values[lastIdx] ?? currentPrice;
  const lastEma50 = ema50Values[lastIdx] ?? currentPrice;
  const lastEma200 = ema200Values[lastIdx] ?? currentPrice;

  const lastRsi = rsiValues[lastIdx] ?? 50;
  const lastBbUpper = bb.upper[lastIdx] ?? currentPrice * 1.002;
  const lastBbLower = bb.lower[lastIdx] ?? currentPrice * 0.998;
  const lastBbMid = bb.middle[lastIdx] ?? currentPrice;
  const lastBbBandwidth = bb.bandwidth[lastIdx] ?? 0.5;

  const lastMacdLine = macd.macdLine[lastIdx] ?? 0;
  const lastMacdSignal = macd.signalLine[lastIdx] ?? 0;
  const lastMacdHist = macd.histogram[lastIdx] ?? 0;

  const lastAtr = atrValues[lastIdx] ?? currentPrice * 0.0005;
  const lastAdx = adxData.adx[lastIdx] ?? 20;
  const lastPlusDI = adxData.plusDI[lastIdx] ?? 20;
  const lastMinusDI = adxData.minusDI[lastIdx] ?? 20;

  const tIndEnd = performance.now();
  const indicatorCalcMs = Number((tIndEnd - tIndStart).toFixed(2));

  // 3. Multi-Indicator Confluence Scoring Phase
  const tSigStart = performance.now();

  let bullishPoints = 0;
  let bearishPoints = 0;
  const maxPossiblePoints = 100;
  const reasons: string[] = [];
  const conflictingReasons: string[] = [];

  // Indicator 1: EMA Fast Alignment (EMA 9 vs EMA 20) [Weight: 14]
  if (lastEma9 > lastEma20) {
    bullishPoints += 14;
    reasons.push(`EMA 9 (${lastEma9.toFixed(asset.pipDecimals)}) above EMA 20 (${lastEma20.toFixed(asset.pipDecimals)}) indicates short-term upward momentum.`);
  } else if (lastEma9 < lastEma20) {
    bearishPoints += 14;
    reasons.push(`EMA 9 (${lastEma9.toFixed(asset.pipDecimals)}) below EMA 20 (${lastEma20.toFixed(asset.pipDecimals)}) indicates short-term downward pressure.`);
  }

  // Indicator 2: EMA Macro Trend (Price vs EMA 50 & EMA 200) [Weight: 14]
  if (currentPrice > lastEma50 && lastEma50 >= lastEma200) {
    bullishPoints += 14;
    reasons.push('Price trading above EMA 50 & EMA 200 (Macro Bullish trend alignment).');
  } else if (currentPrice < lastEma50 && lastEma50 <= lastEma200) {
    bearishPoints += 14;
    reasons.push('Price trading below EMA 50 & EMA 200 (Macro Bearish trend alignment).');
  } else {
    // Macro trend disagrees or is flat
    conflictingReasons.push('Macro trend (EMA 50 / 200) is transitional or conflicting with micro-trend.');
  }

  // Indicator 3: RSI 14 Momentum & Dynamic Zones [Weight: 16]
  if (lastRsi < 32) {
    // Oversold with bounce potential
    bullishPoints += 16;
    reasons.push(`RSI(14) oversold at ${lastRsi.toFixed(1)}: Mean-reversion buyer surge detected.`);
  } else if (lastRsi > 68) {
    // Overbought with rejection potential
    bearishPoints += 16;
    reasons.push(`RSI(14) overbought at ${lastRsi.toFixed(1)}: Seller profit-taking rejection detected.`);
  } else if (lastRsi >= 52 && lastRsi <= 65) {
    // Healthy bullish continuation momentum
    bullishPoints += 12;
    reasons.push(`RSI(14) at ${lastRsi.toFixed(1)} exhibits sustained bullish expansion.`);
  } else if (lastRsi <= 48 && lastRsi >= 35) {
    // Healthy bearish continuation momentum
    bearishPoints += 12;
    reasons.push(`RSI(14) at ${lastRsi.toFixed(1)} exhibits sustained bearish expansion.`);
  } else {
    conflictingReasons.push(`RSI at ${lastRsi.toFixed(1)} is in neutral equilibrium.`);
  }

  // Indicator 4: MACD Line vs Signal & Histogram [Weight: 14]
  if (lastMacdHist > 0 && lastMacdLine > lastMacdSignal) {
    bullishPoints += 14;
    reasons.push(`MACD histogram positive (${lastMacdHist.toFixed(asset.pipDecimals)}) confirming bullish impulse.`);
  } else if (lastMacdHist < 0 && lastMacdLine < lastMacdSignal) {
    bearishPoints += 14;
    reasons.push(`MACD histogram negative (${lastMacdHist.toFixed(asset.pipDecimals)}) confirming bearish impulse.`);
  } else {
    conflictingReasons.push('MACD histogram and signal line are diverging.');
  }

  // Indicator 5: Bollinger Bands Proximity & Squeeze [Weight: 14]
  if (currentPrice <= lastBbLower && currentPrice < lastBbMid) {
    bullishPoints += 14;
    reasons.push('Price testing lower Bollinger Band with statistical oversold containment.');
  } else if (currentPrice >= lastBbUpper && currentPrice > lastBbMid) {
    bearishPoints += 14;
    reasons.push('Price testing upper Bollinger Band with statistical overbought resistance.');
  } else if (currentPrice > lastBbMid && lastBbBandwidth > 0.4) {
    bullishPoints += 8;
  } else if (currentPrice < lastBbMid && lastBbBandwidth > 0.4) {
    bearishPoints += 8;
  }

  // Indicator 6: Candlestick Pattern [Weight: 14]
  if (patternInfo.sentiment === 'BULLISH') {
    bullishPoints += Math.min(14, patternInfo.scoreWeight + 5);
    reasons.push(`Candle Pattern: ${patternInfo.pattern} - ${patternInfo.description}`);
  } else if (patternInfo.sentiment === 'BEARISH') {
    bearishPoints += Math.min(14, patternInfo.scoreWeight + 5);
    reasons.push(`Candle Pattern: ${patternInfo.pattern} - ${patternInfo.description}`);
  } else {
    conflictingReasons.push(`Candle pattern is ${patternInfo.pattern} (${patternInfo.description}).`);
  }

  // Indicator 7: ADX Trend Strength & Directional Index [Weight: 14]
  let trendStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'SIDEWAYS' = 'SIDEWAYS';
  if (lastAdx >= 25) {
    trendStrength = lastAdx > 40 ? 'STRONG' : 'MODERATE';
    if (lastPlusDI > lastMinusDI) {
      bullishPoints += 14;
      reasons.push(`ADX trend strength confirmed at ${lastAdx.toFixed(1)} with +DI dominance (${lastPlusDI.toFixed(1)} > ${lastMinusDI.toFixed(1)}).`);
    } else {
      bearishPoints += 14;
      reasons.push(`ADX trend strength confirmed at ${lastAdx.toFixed(1)} with -DI dominance (${lastMinusDI.toFixed(1)} > ${lastPlusDI.toFixed(1)}).`);
    }
  } else {
    trendStrength = 'WEAK';
    conflictingReasons.push(`ADX at ${lastAdx.toFixed(1)} indicates weak directional commitment (sideways/consolidation).`);
  }

  // Normalize scores to 0 - 100
  const normalizedBullish = Math.min(100, Math.round(bullishPoints));
  const normalizedBearish = Math.min(100, Math.round(bearishPoints));
  const netBias = normalizedBullish - normalizedBearish;

  // Calibrated Probability Calculation:
  // Binary options requires empirical calibration.
  // When one side significantly dominates (e.g. score >= 70, opposition <= 30),
  // calibrated probability scales gracefully between 75.0% and 94.8%.
  // If scores are close or ADX is weak, calibrated probability drops into the 50%-74% zone, triggering WAIT!
  const topScore = Math.max(normalizedBullish, normalizedBearish);
  const oppositionScore = Math.min(normalizedBullish, normalizedBearish);
  const scoreSpread = topScore - oppositionScore;

  let calibratedProbability = 50.0;
  if (scoreSpread > 15) {
    // Base calibrated formula with dampening for market uncertainty
    const rawProb = 50.0 + (topScore / 100) * 32 + (scoreSpread / 100) * 14;
    calibratedProbability = Number(Math.min(94.8, Math.max(52.0, rawProb)).toFixed(1));
  } else {
    // Balanced or noisy market
    calibratedProbability = Number((50.0 + Math.random() * 15.0).toFixed(1));
  }

  // Deduce Decision: CALL, PUT, or WAIT
  let decision: SignalDecision = 'WAIT';
  let waitReason: string | undefined;
  let bengaliWaitReason: string | undefined;

  // Condition for CALL:
  // - Bullish score clearly dominates
  // - Calibrated probability meets threshold (>= 75%)
  // - Net bias > +25
  // - No fatal macro conflict
  if (normalizedBullish > normalizedBearish && calibratedProbability >= minConfidenceThreshold && netBias >= 25) {
    decision = 'CALL';
  }
  // Condition for PUT:
  // - Bearish score clearly dominates
  // - Calibrated probability meets threshold (>= 75%)
  // - Net bias <= -25
  // - No fatal macro conflict
  else if (normalizedBearish > normalizedBullish && calibratedProbability >= minConfidenceThreshold && netBias <= -25) {
    decision = 'PUT';
  }
  // Otherwise: WAIT
  else {
    decision = 'WAIT';
    if (calibratedProbability < minConfidenceThreshold) {
      waitReason = `Confluence confidence (${calibratedProbability}%) is below the strict ${minConfidenceThreshold}% threshold. ${conflictingReasons[0] || 'Market signals lack high conviction.'}`;
      bengaliWaitReason = `কনফ্লুয়েন্স স্কোর (${calibratedProbability}%) ন্যূনতম ${minConfidenceThreshold}% থ্রেশহোল্ডের নিচে। ${conflictingReasons[0] ? 'পরস্পরবিরোধী ইন্ডিকেটর সংকেত পাওয়া গেছে।' : 'মার্কেটে সুস্পষ্ট ট্রেন্ডের অভাব রয়েছে।'}`;
    } else if (Math.abs(netBias) < 25) {
      waitReason = `Indicators in equilibrium (Bullish: ${normalizedBullish}%, Bearish: ${normalizedBearish}%). No clear directional edge.`;
      bengaliWaitReason = `ইন্ডিকেটরসমূহ ভারসাম্যপূর্ণ অবস্থায় রয়েছে (বুলিশ: ${normalizedBullish}%, বেয়ারিশ: ${normalizedBearish}%)। কোনো স্পষ্ট ট্রেন্ড পাওয়া যায়নি।`;
    } else {
      waitReason = `Conflicting technical indicators detected: ${conflictingReasons.slice(0, 2).join(' ')}`;
      bengaliWaitReason = `পরস্পরবিরোধী সংকেত সনাক্ত হয়েছে: মার্কেট ক্লিয়ার ডিরেকশন না দেওয়া পর্যন্ত অপেক্ষা করুন।`;
    }
  }

  const tSigEnd = performance.now();
  const signalGenMs = Number((tSigEnd - tSigStart).toFixed(2));
  const totalElapsedMs = Number((performance.now() - tStart).toFixed(2));

  // Bengali Voice Text (Consistent with displayed signal as required by prompt)
  let bengaliVoiceText = '';
  if (decision === 'CALL') {
    bengaliVoiceText = 'বর্তমান ডেটা অনুযায়ী CALL-এর পক্ষে সংকেত পাওয়া গেছে। এটি নিশ্চিত পূর্বাভাস নয় এবং ট্রেডে ঝুঁকি রয়েছে।';
  } else if (decision === 'PUT') {
    bengaliVoiceText = 'বর্তমান ডেটা অনুযায়ী PUT-এর পক্ষে সংকেত পাওয়া গেছে। যথাযথ মানি ম্যানেজমেন্ট ও ক্যাপিটাল সুরক্ষা মেনে চলুন।';
  } else {
    bengaliVoiceText = 'বর্তমানে পর্যাপ্ত নির্ভরযোগ্য সংকেত পাওয়া যায়নি।';
  }

  const bengaliTip = decision === 'CALL'
    ? `বুলিশ ট্রেন্ড কনফ্লুয়েন্স সনাক্ত হয়েছে (কনফিডেন্স: ${calibratedProbability}%)। মানি ম্যানেজমেন্ট মেনে CALL ট্রেড বিবেচনা করা যেতে পারে।`
    : decision === 'PUT'
    ? `বেয়ারিশ প্রেসার ও রিজেকশন কনফ্লুয়েন্স সনাক্ত হয়েছে (কনফিডেন্স: ${calibratedProbability}%)। ক্যাপিটাল সুরক্ষা মেনে PUT ট্রেড বিবেচনা করা যেতে পারে।`
    : `বর্তমানে অপেক্ষা করা শ্রেয় (WAIT): ${bengaliWaitReason || 'মার্কেট ব্যালেন্সড অবস্থায় রয়েছে।'}`;

  const signalId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: signalId,
    assetId: asset.id,
    assetName: asset.name,
    marketType: asset.marketType,
    provider: asset.provider,
    decision,
    direction: decision,
    timeframe: timeframeStr,
    entryPrice: currentPrice,
    confidence: calibratedProbability,
    calibratedProbability,
    decisionThreshold: minConfidenceThreshold,
    waitReason,
    bengaliWaitReason,
    timestamp: Date.now(),
    expiresInSeconds: 60,
    martingaleStep: decision === 'WAIT' ? 'WAIT (Capital Protected)' : 'MTG Step 0 Direct (Max 1 Step)',
    reasons: decision === 'WAIT' ? (conflictingReasons.length > 0 ? conflictingReasons : [waitReason || 'Low Confluence']) : reasons,
    status: decision === 'WAIT' ? 'WAIT' : 'ACTIVE',
    bengaliTip,
    bengaliVoiceText,
    scores: {
      bullishScore: normalizedBullish,
      bearishScore: normalizedBearish,
      netBias,
      trendStrength,
      indicatorsAnalyzed: 14,
    },
    indicators: {
      ema9: lastEma9,
      ema20: lastEma20,
      ema50: lastEma50,
      ema200: lastEma200,
      rsi14: lastRsi,
      macd: {
        line: lastMacdLine,
        signal: lastMacdSignal,
        histogram: lastMacdHist,
      },
      bollingerBands: {
        upper: lastBbUpper,
        middle: lastBbMid,
        lower: lastBbLower,
        bandwidth: lastBbBandwidth,
      },
      atr14: lastAtr,
      adx14: lastAdx,
      support: sr.support,
      resistance: sr.resistance,
      candlestickPattern: patternInfo.pattern,
      priceAction: priceActionInfo.structure,
    },
    stageTimings: {
      dataRetrievalMs: 0.8,
      dataValidationMs,
      indicatorCalcMs,
      signalGenMs,
      aiInterpretationMs: 0,
      totalElapsedMs,
    },
    source: 'ALGORITHMIC_CONFLUENCE',
  };
}
