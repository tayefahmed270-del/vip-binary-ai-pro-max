import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Candle, IndicatorSettings, ActiveTrade, AssetPair } from '../types/trading';
import {
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateHeikinAshi,
  getAutoSupportResistance,
} from '../utils/indicators';
import {
  TrendingUp,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
} from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  asset: AssetPair;
  indicators: IndicatorSettings;
  setIndicators: React.Dispatch<React.SetStateAction<IndicatorSettings>>;
  activeTrades: ActiveTrade[];
  timeframe: string;
  setTimeframe: (tf: string) => void;
  candleSecondsRemaining: number;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  asset,
  indicators,
  setIndicators,
  activeTrades,
  timeframe,
  setTimeframe,
  candleSecondsRemaining,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(45); // number of visible candles
  const [panOffset, setPanOffset] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter or transform candles based on chart style
  const displayCandles = useMemo(() => {
    if (indicators.chartType === 'heikin') {
      return calculateHeikinAshi(candles);
    }
    return candles;
  }, [candles, indicators.chartType]);

  // Derived indicators
  const ema9Values = useMemo(() => calculateEMA(candles, 9), [candles]);
  const ema21Values = useMemo(() => calculateEMA(candles, 21), [candles]);
  const bbValues = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsiValues = useMemo(() => calculateRSI(candles, 14), [candles]);
  const { support, resistance } = useMemo(() => getAutoSupportResistance(candles), [candles]);

  const lastCandle = candles[candles.length - 1];
  const currentPrice = lastCandle ? lastCandle.close : asset.basePrice;

  // Render loop
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Reset & clear
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Dark sleek background
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, width, height);

    if (displayCandles.length < 2) {
      ctx.restore();
      return;
    }

    const priceAxisWidth = 72;
    const timeAxisHeight = 26;
    const rsiHeight = indicators.showRsi ? Math.min(100, height * 0.22) : 0;
    const chartHeight = height - timeAxisHeight - rsiHeight;
    const chartWidth = width - priceAxisWidth;

    // Visible window
    const visibleCount = Math.min(displayCandles.length, Math.max(15, zoomLevel));
    const startIndex = Math.max(0, displayCandles.length - visibleCount - panOffset);
    const endIndex = Math.min(displayCandles.length, startIndex + visibleCount);
    const visibleCandles = displayCandles.slice(startIndex, endIndex);

    if (visibleCandles.length === 0) {
      ctx.restore();
      return;
    }

    // Min & Max prices in visible range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    // Add 8% padding to price bounds for breathing room
    const pricePadding = (maxPrice - minPrice) * 0.08 || currentPrice * 0.001;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    // Coordinate transforms
    const getY = (price: number) => {
      return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const candleWidth = chartWidth / visibleCandles.length;
    const bodyWidth = Math.max(2, candleWidth * 0.72);

    // Grid lines (Horizontal Price Lines)
    const gridSteps = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const price = minPrice + (priceRange * i) / gridSteps;
      const y = getY(price);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price label on right axis
      ctx.fillText(price.toFixed(asset.pipDecimals), chartWidth + 6, y);
    }

    // Support and Resistance lines
    if (support > minPrice && support < maxPrice) {
      const sY = getY(support);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, sY);
      ctx.lineTo(chartWidth, sY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10B981';
      ctx.fillText(`SUPP ${support.toFixed(asset.pipDecimals)}`, 10, sY - 6);
    }

    if (resistance > minPrice && resistance < maxPrice) {
      const rY = getY(resistance);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, rY);
      ctx.lineTo(chartWidth, rY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F43F5E';
      ctx.fillText(`RES ${resistance.toFixed(asset.pipDecimals)}`, 10, rY - 6);
    }

    // Bollinger Bands
    if (indicators.showBollinger) {
      const bbUpperSlice = bbValues.upper.slice(startIndex, endIndex);
      const bbLowerSlice = bbValues.lower.slice(startIndex, endIndex);
      const bbMidSlice = bbValues.middle.slice(startIndex, endIndex);

      // Area fill
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const u = bbUpperSlice[i];
        if (u !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(u);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const l = bbLowerSlice[i];
        if (l !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(l);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fill();

      // Lines
      const drawIndicatorLine = (slice: (number | null)[], color: string, width: number = 1) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCandles.length; i++) {
          const val = slice[i];
          if (val !== null) {
            const x = i * candleWidth + candleWidth / 2;
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };

      drawIndicatorLine(bbUpperSlice, 'rgba(59, 130, 246, 0.55)', 1.2);
      drawIndicatorLine(bbMidSlice, 'rgba(59, 130, 246, 0.35)', 1);
      drawIndicatorLine(bbLowerSlice, 'rgba(59, 130, 246, 0.55)', 1.2);
    }

    // EMA 9 & 21
    if (indicators.showEma9) {
      const ema9Slice = ema9Values.slice(startIndex, endIndex);
      ctx.strokeStyle = '#06B6D4'; // cyan
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = ema9Slice[i];
        if (val !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    if (indicators.showEma21) {
      const ema21Slice = ema21Values.slice(startIndex, endIndex);
      ctx.strokeStyle = '#F59E0B'; // amber
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = ema21Slice[i];
        if (val !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Candlesticks or Line Chart
    if (indicators.chartType === 'line') {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const x = idx * candleWidth + candleWidth / 2;
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Subtle gradient below line
      ctx.lineTo((visibleCandles.length - 1) * candleWidth + candleWidth / 2, chartHeight);
      ctx.lineTo(candleWidth / 2, chartHeight);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, chartHeight);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      // Candlesticks
      visibleCandles.forEach((c, idx) => {
        const xCenter = idx * candleWidth + candleWidth / 2;
        const isUp = c.close >= c.open;
        const candleColor = isUp ? '#10B981' : '#F43F5E';

        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        // Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xCenter, highY);
        ctx.lineTo(xCenter, lowY);
        ctx.stroke();

        // Body
        const topY = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));

        ctx.fillStyle = candleColor;
        ctx.fillRect(xCenter - bodyWidth / 2, topY, bodyWidth, bodyHeight);
      });
    }

    // Active User Trades on Chart
    activeTrades.forEach((trade) => {
      if (trade.assetId === asset.id && trade.entryPrice >= minPrice && trade.entryPrice <= maxPrice) {
        const tradeY = getY(trade.entryPrice);
        const isCall = trade.direction === 'CALL';
        const tradeColor = isCall ? '#10B981' : '#F43F5E';

        ctx.strokeStyle = tradeColor;
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, tradeY);
        ctx.lineTo(chartWidth, tradeY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge
        ctx.fillStyle = tradeColor;
        const badgeText = `${isCall ? '▲ CALL' : '▼ PUT'} $${trade.amount}`;
        ctx.fillRect(chartWidth - 95, tradeY - 11, 90, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, chartWidth - 50, tradeY + 4);
      }
    });

    // Real-time Current Price Line
    const currentPriceY = getY(currentPrice);
    ctx.strokeStyle = '#38BDF8';
    ctx.setLineDash([3, 2]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, currentPriceY);
    ctx.lineTo(chartWidth, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right-side Price Badge with glowing background
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(chartWidth + 1, currentPriceY - 12, priceAxisWidth - 2, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(asset.pipDecimals), chartWidth + priceAxisWidth / 2, currentPriceY + 4);

    // Candle Remaining Countdown Tag on Price Line
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(chartWidth - 65, currentPriceY - 11, 58, 22, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const secondsPad = String(candleSecondsRemaining).padStart(2, '0');
    ctx.fillText(`00:${secondsPad}`, chartWidth - 36, currentPriceY + 4);

    // RSI Subchart
    if (indicators.showRsi) {
      const rsiTop = height - timeAxisHeight - rsiHeight;
      const rsiBottom = height - timeAxisHeight;

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rsiTop);
      ctx.lineTo(width, rsiTop);
      ctx.stroke();

      // RSI Levels 70, 50, 30
      const getRsiY = (level: number) => {
        return rsiBottom - (level / 100) * rsiHeight;
      };

      const y70 = getRsiY(70);
      const y50 = getRsiY(50);
      const y30 = getRsiY(30);

      // Overbought / Oversold zones
      ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
      ctx.fillRect(0, rsiTop, chartWidth, y70 - rsiTop);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(0, y30, chartWidth, rsiBottom - y30);

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(chartWidth, y70);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, y50);
      ctx.lineTo(chartWidth, y50);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, y30);
      ctx.lineTo(chartWidth, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('70', chartWidth + 6, y70 + 3);
      ctx.fillText('50', chartWidth + 6, y50 + 3);
      ctx.fillText('30', chartWidth + 6, y30 + 3);

      const lastRsi = rsiValues[rsiValues.length - 1] ?? 50;
      ctx.fillStyle = lastRsi > 70 ? '#F43F5E' : lastRsi < 30 ? '#10B981' : '#A855F7';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`RSI(14): ${lastRsi.toFixed(1)}`, 10, rsiTop + 14);

      // Plot RSI line
      const rsiSlice = rsiValues.slice(startIndex, endIndex);
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const val = rsiSlice[i];
        if (val !== null) {
          const x = i * candleWidth + candleWidth / 2;
          const y = getRsiY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // Time Axis (Bottom)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, height - timeAxisHeight, width, timeAxisHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, height - timeAxisHeight);
    ctx.lineTo(width, height - timeAxisHeight);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 5));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      const x = i * candleWidth + candleWidth / 2;
      const date = new Date(c.time * 1000);
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      const label = `${hours}:${mins}:${secs}`;
      ctx.fillText(label, x, height - 8);
    }

    // Mouse Crosshair and Tooltip
    if (mousePos && mousePos.x < chartWidth && mousePos.y < chartHeight) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshair price
      const hoveredPrice = maxPrice - (mousePos.y / chartHeight) * priceRange;
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(chartWidth + 1, mousePos.y - 10, priceAxisWidth - 2, 20);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hoveredPrice.toFixed(asset.pipDecimals), chartWidth + priceAxisWidth / 2, mousePos.y + 4);

      // Hovered candle info
      const candleIndex = Math.floor(mousePos.x / candleWidth);
      if (candleIndex >= 0 && candleIndex < visibleCandles.length) {
        const hc = visibleCandles[candleIndex];
        const isUp = hc.close >= hc.open;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 240, 52, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isUp ? '#10B981' : '#F43F5E';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`O: ${hc.open.toFixed(asset.pipDecimals)}  H: ${hc.high.toFixed(asset.pipDecimals)}`, 16, 28);
        ctx.fillText(`L: ${hc.low.toFixed(asset.pipDecimals)}  C: ${hc.close.toFixed(asset.pipDecimals)}`, 16, 44);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Vol: ${hc.volume}`, 16, 56);
      }
    }

    ctx.restore();
  }, [
    displayCandles,
    indicators,
    ema9Values,
    ema21Values,
    bbValues,
    rsiValues,
    support,
    resistance,
    activeTrades,
    asset,
    currentPrice,
    zoomLevel,
    panOffset,
    mousePos,
    candleSecondsRemaining,
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      renderChart();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [renderChart]);

  // Redraw when candles or inputs update
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.max(15, prev - 3));
    } else {
      setZoomLevel((prev) => Math.min(100, prev + 3));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Chart Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0F172A]/90 border-b border-slate-800/80 text-xs text-slate-300">
        {/* Timeframe Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
          {['5s', '15s', '30s', '1m', '2m', '5m'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chart Style & Indicators Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1">
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, chartType: 'candle' }))}
              className={`px-2 py-0.5 rounded transition-colors ${
                indicators.chartType === 'candle'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, chartType: 'line' }))}
              className={`px-2 py-0.5 rounded transition-colors ${
                indicators.chartType === 'line'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, chartType: 'heikin' }))}
              className={`px-2 py-0.5 rounded transition-colors ${
                indicators.chartType === 'heikin'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Heikin-Ashi
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-lg border border-slate-800 gap-1 font-mono">
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, showEma9: !prev.showEma9 }))}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                indicators.showEma9 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              EMA9
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, showEma21: !prev.showEma21 }))}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                indicators.showEma21 ? 'bg-amber-950 text-amber-300 border border-amber-800/80' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              EMA21
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, showBollinger: !prev.showBollinger }))}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                indicators.showBollinger ? 'bg-blue-950 text-blue-300 border border-blue-800/80' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-blue-400" />
              BB(20,2)
            </button>
            <button
              onClick={() => setIndicators((prev) => ({ ...prev, showRsi: !prev.showRsi }))}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                indicators.showRsi ? 'bg-purple-950 text-purple-300 border border-purple-800/80' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3 text-purple-400" />
              RSI(14)
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(15, prev - 5))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(100, prev + 5))}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(45);
                setPanOffset(0);
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[360px] bg-[#0B0F19]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
};
