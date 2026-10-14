import { AssetPair, Candle, MarketType, VipSignal } from '../types/trading';
import { evaluateConfluenceEngine } from './indicators';

/**
 * Standard supported instruments with STRICT separation between:
 * 1) REAL MARKET (Interbank Forex)
 * 2) QUOTEX OTC (Quotex OTC Synthetic Feeds)
 * 3) CRYPTO (Binance Live Crypto - marked distinctly so NOT confused with Forex or OTC)
 */
export const ASSET_PAIRS: AssetPair[] = [
  // --- QUOTEX OTC INSTRUMENTS ---
  {
    id: 'EURUSD_OTC',
    name: 'EUR/USD (OTC)',
    basePrice: 1.08455,
    pipDecimals: 5,
    payoutPercent: 93,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 2.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'GBPUSD_OTC',
    name: 'GBP/USD (OTC)',
    basePrice: 1.29824,
    pipDecimals: 5,
    payoutPercent: 92,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'High',
    feedFrequencyHz: 2.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'USDBDT_OTC',
    name: 'USD/BDT (OTC)',
    basePrice: 121.85,
    pipDecimals: 2,
    payoutPercent: 95,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'High',
    feedFrequencyHz: 1.5,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'USDINR_OTC',
    name: 'USD/INR (OTC)',
    basePrice: 86.742,
    pipDecimals: 3,
    payoutPercent: 90,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 1.5,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'USDJPY_OTC',
    name: 'USD/JPY (OTC)',
    basePrice: 153.42,
    pipDecimals: 3,
    payoutPercent: 89,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 2.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'EURGBP_OTC',
    name: 'EUR/GBP (OTC)',
    basePrice: 0.83515,
    pipDecimals: 5,
    payoutPercent: 91,
    category: 'OTC',
    marketType: 'OTC',
    provider: 'QUOTEX_OTC',
    isSupported: true,
    volatility: 'Low',
    feedFrequencyHz: 1.8,
    lastUpdateTimestamp: Date.now(),
  },

  // --- REAL MARKET (INTERBANK FOREX & COMMODITIES) ---
  {
    id: 'EURUSD_REAL',
    name: 'EUR/USD (REAL)',
    basePrice: 1.08412,
    pipDecimals: 5,
    payoutPercent: 85,
    category: 'FOREX',
    marketType: 'REAL',
    provider: 'INTERBANK_FOREX',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 1.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'GBPUSD_REAL',
    name: 'GBP/USD (REAL)',
    basePrice: 1.29780,
    pipDecimals: 5,
    payoutPercent: 84,
    category: 'FOREX',
    marketType: 'REAL',
    provider: 'INTERBANK_FOREX',
    isSupported: true,
    volatility: 'High',
    feedFrequencyHz: 1.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'USDJPY_REAL',
    name: 'USD/JPY (REAL)',
    basePrice: 153.38,
    pipDecimals: 3,
    payoutPercent: 82,
    category: 'FOREX',
    marketType: 'REAL',
    provider: 'INTERBANK_FOREX',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 1.0,
    lastUpdateTimestamp: Date.now(),
  },
  {
    id: 'AUDCAD_REAL',
    name: 'AUD/CAD (REAL)',
    basePrice: 0.90642,
    pipDecimals: 5,
    payoutPercent: 83,
    category: 'FOREX',
    marketType: 'REAL',
    provider: 'INTERBANK_FOREX',
    isSupported: true,
    volatility: 'Medium',
    feedFrequencyHz: 1.0,
    lastUpdateTimestamp: Date.now(),
  },

  // --- CRYPTO (BINANCE FEED - CLEARLY DISTINGUISHED) ---
  {
    id: 'BTCUSDT_BINANCE',
    name: 'BTC/USDT (Crypto)',
    basePrice: 88520.0,
    pipDecimals: 1,
    payoutPercent: 87,
    category: 'CRYPTO',
    marketType: 'REAL',
    provider: 'BINANCE_CRYPTO',
    isSupported: true,
    volatility: 'High',
    feedFrequencyHz: 5.0,
    lastUpdateTimestamp: Date.now(),
  },

  // --- EXAMPLE INCOMPATIBLE FEED (FOR VALIDATION DEMONSTRATION) ---
  {
    id: 'MOCK_UNAVAILABLE_PAIR',
    name: 'USD/ZAR (Restricted)',
    basePrice: 18.25,
    pipDecimals: 4,
    payoutPercent: 0,
    category: 'FOREX',
    marketType: 'REAL',
    provider: 'UNAVAILABLE',
    isSupported: false,
    unsupportedReason: 'Broker regulatory lock: Feed session closed. No authorized bridge available.',
    volatility: 'Low',
    feedFrequencyHz: 0,
    lastUpdateTimestamp: Date.now() - 3600000,
  },
];

/**
 * Filter instruments based on user mode:
 * 'REAL' -> Only Interbank Forex & Real Crypto
 * 'OTC'  -> Only Quotex OTC
 * 'AUTO' -> Detect open markets based on current UTC day/hour
 */
export function getFilteredAssets(mode: MarketType): AssetPair[] {
  if (mode === 'REAL') {
    return ASSET_PAIRS.filter((a) => a.marketType === 'REAL' && a.isSupported);
  }
  if (mode === 'OTC') {
    return ASSET_PAIRS.filter((a) => a.marketType === 'OTC' && a.isSupported);
  }
  // AUTO-DETECT: Check UTC day. If Saturday or Sunday, Real Forex is closed, OTC is active.
  const utcDay = new Date().getUTCDay();
  const isWeekend = utcDay === 0 || utcDay === 6;

  if (isWeekend) {
    return ASSET_PAIRS.filter((a) => a.marketType === 'OTC' || a.category === 'CRYPTO');
  }
  return ASSET_PAIRS.filter((a) => a.isSupported);
}

/**
 * Generate historical candles with custom bias or pattern for live & automated testing
 */
export function generateInitialCandles(
  asset: AssetPair,
  timeframeSeconds: number = 60,
  count: number = 60,
  scenario: 'NORMAL' | 'STRONG_BULLISH' | 'STRONG_BEARISH' | 'SIDEWAYS' | 'CONFLICTING' | 'STALE' = 'NORMAL'
): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const timeOffset = scenario === 'STALE' ? 300 : 0; // 5 minutes in the past if stale
  const startTime = now - count * timeframeSeconds - timeOffset;

  let currentPrice = asset.basePrice;
  const step = asset.basePrice * (asset.volatility === 'High' ? 0.0005 : 0.00025);

  for (let i = 0; i < count; i++) {
    const candleTime = startTime + i * timeframeSeconds;
    const open = currentPrice;

    let delta = 0;
    if (scenario === 'STRONG_BULLISH') {
      // Steady upward momentum + higher highs
      delta = (Math.random() * 0.7 + 0.3) * step;
    } else if (scenario === 'STRONG_BEARISH') {
      // Steady downward pressure + lower lows
      delta = -(Math.random() * 0.7 + 0.3) * step;
    } else if (scenario === 'SIDEWAYS') {
      // Narrow oscillating band around basePrice
      const diffFromBase = currentPrice - asset.basePrice;
      delta = -diffFromBase * 0.2 + (Math.random() - 0.5) * step * 0.3;
    } else if (scenario === 'CONFLICTING') {
      // Large wicks, erratic flips
      delta = (Math.sin(i * 1.5) * 0.8 + (Math.random() - 0.5)) * step;
    } else {
      // Standard realistic market walk with slight mean reversion
      const meanRevert = (asset.basePrice - currentPrice) * 0.02;
      delta = (Math.random() - 0.495) * step * 1.8 + meanRevert;
    }

    const close = Math.max(0.0001, open + delta);
    const wickHigh = Math.random() * step * (scenario === 'CONFLICTING' ? 2.5 : 0.8);
    const wickLow = Math.random() * step * (scenario === 'CONFLICTING' ? 2.5 : 0.8);

    const high = Math.max(open, close) + wickHigh;
    const low = Math.min(open, close) - wickLow;
    const volume = Math.floor(Math.random() * 450) + 80;

    candles.push({
      time: candleTime,
      open: Number(open.toFixed(asset.pipDecimals)),
      high: Number(high.toFixed(asset.pipDecimals)),
      low: Number(low.toFixed(asset.pipDecimals)),
      close: Number(close.toFixed(asset.pipDecimals)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Produce next real-time price tick
 */
export function generateNextTick(
  currentCandle: Candle,
  asset: AssetPair,
  trendBias: number = 0
): { updatedCandle: Candle; newPrice: number } {
  const volatilityFactor = asset.volatility === 'High' ? 0.0003 : asset.volatility === 'Medium' ? 0.00018 : 0.0001;
  const maxDelta = asset.basePrice * volatilityFactor;

  const rand = Math.random() - 0.495 + trendBias * 0.15;
  const priceDelta = rand * maxDelta;
  const newPrice = Number(Math.max(0.0001, currentCandle.close + priceDelta).toFixed(asset.pipDecimals));

  const updatedCandle: Candle = {
    ...currentCandle,
    high: Number(Math.max(currentCandle.high, newPrice).toFixed(asset.pipDecimals)),
    low: Number(Math.min(currentCandle.low, newPrice).toFixed(asset.pipDecimals)),
    close: newPrice,
    volume: currentCandle.volume + Math.floor(Math.random() * 6) + 1,
  };

  return { updatedCandle, newPrice };
}

/**
 * Generate algorithmic VIP signal based on transparent multi-indicator confluence
 */
export function generateVipSignal(
  asset: AssetPair,
  candles: Candle[],
  timeframeStr: string = '1M',
  minConfidenceThreshold: number = 75
): VipSignal {
  return evaluateConfluenceEngine(asset, candles, timeframeStr, minConfidenceThreshold);
}
