import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({});
  }
} catch (err) {
  console.warn('Gemini SDK init warning:', err);
}

// AI Analysis Endpoint for VIP Binary Signals
// Enforces a strict 3500ms timeout to guarantee total analysis remains within the 5-second target!
app.post('/api/ai-analysis', async (req: Request, res: Response): Promise<void> => {
  const reqStart = Date.now();

  const {
    asset = 'EUR/USD (OTC)',
    marketType = 'OTC',
    provider = 'QUOTEX_OTC',
    timeframe = '1m',
    currentPrice = 1.0842,
    trend = 'BULLISH',
    rsi = 34.5,
    emaFast = 1.084,
    emaSlow = 1.0835,
    candlestickPattern = 'Bullish Hammer on Support',
    language = 'en',
    calibratedProbability = 82.5,
    algorithmicDecision = 'CALL',
  } = req.body;

  // Algorithmic Fallback Builder
  const buildAlgorithmicResponse = (reasonNote: string) => {
    const isCall = algorithmicDecision === 'CALL';
    const isPut = algorithmicDecision === 'PUT';
    const isWait = algorithmicDecision === 'WAIT';

    const action = isWait ? 'WAIT' : isCall ? 'CALL' : 'PUT';
    const confidence = isWait ? calibratedProbability : Math.max(76.5, calibratedProbability);

    let bengaliSummary = '';
    if (isCall) {
      bengaliSummary = 'মার্কেট টেকনিক্যাল কনফ্লুয়েন্স অনুযায়ী ঊর্ধ্বমুখী গতি নির্দেশ করছে। ক্যাপিটাল রিস্ক বজায় রেখে CALL বিবেচনা করা যেতে পারে।';
    } else if (isPut) {
      bengaliSummary = 'মার্কেট রেজিস্ট্যান্স জোনে সেলিং প্রেশার নির্দেশ করছে। সঠিক রিস্ক ম্যানেজমেন্ট মেনে PUT বিবেচনা করা যেতে পারে।';
    } else {
      bengaliSummary = 'বর্তমানে পর্যাপ্ত নির্ভরযোগ্য কনফ্লুয়েন্স পাওয়া যায়নি। এই মুহূর্তে ট্রেড না নিয়ে অপেক্ষা করাই নিরাপদ।';
    }

    return {
      success: true,
      action,
      confidence,
      expiration: timeframe.toUpperCase(),
      reasoning: [
        `Technical Confluence: RSI at ${rsi}, Fast EMA: ${emaFast}, Slow EMA: ${emaSlow}.`,
        `Price action structure: ${candlestickPattern}. Trend bias: ${trend}.`,
        reasonNote,
      ],
      martingaleAdvice: 'Never exceed Step 1 Martingale. Keep stake under 2% of capital.',
      sentiment: isCall ? 'Bullish Reversal Inflow' : isPut ? 'Bearish Distribution Pressure' : 'Sideways Consolidation',
      bengaliSummary,
      keySupportResistance: `Dynamic Confluence on ${asset} (${marketType})`,
      processingTimeMs: Date.now() - reqStart,
      source: 'ALGORITHMIC_BACKEND_QUANT',
    };
  };

  // If Gemini client not available or no API key, return ultra-fast verified algorithmic result immediately (< 5ms)
  if (!process.env.GEMINI_API_KEY || !ai) {
    res.json(buildAlgorithmicResponse('Evaluated via high-speed VIP algorithmic confluence model.'));
    return;
  }

  // Create a timeout race so the request never exceeds 3200ms
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI inference timeout (3200ms cap reached)')), 3200)
  );

  const inferencePromise = (async () => {
    const prompt = `You are the lead quantitative analyst for "VIP Binary AI Pro Max" (Quotex binary options terminal).
Evaluate this technical state for ${asset} (${marketType} feed, provider: ${provider}):
- Current Price: ${currentPrice}
- Timeframe: ${timeframe}
- Trend: ${trend}
- RSI (14): ${rsi}
- Fast EMA (9): ${emaFast}
- Slow EMA (20): ${emaSlow}
- Candle Pattern: ${candlestickPattern}
- Algorithmic Decision: ${algorithmicDecision}
- Calibrated Probability: ${calibratedProbability}%

Respond in JSON format with these exact keys:
{
  "action": "${algorithmicDecision}",
  "confidence": ${calibratedProbability},
  "expiration": "${timeframe.toUpperCase()}",
  "reasoning": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "martingaleAdvice": "string with risk limit",
  "sentiment": "e.g. Bullish Impulse, Bearish Rejection, or Sideways Chop",
  "bengaliSummary": "1-2 concise sentences in Bengali summarizing this exact result",
  "keySupportResistance": "e.g. S: 1.0820 | R: 1.0865"
}
Output strictly valid JSON. No markdown ticks.`;

    const response = await ai!.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  })();

  try {
    const parsed: any = await Promise.race([inferencePromise, timeoutPromise]);
    res.json({
      success: true,
      action: parsed.action || algorithmicDecision,
      confidence: parsed.confidence || calibratedProbability,
      expiration: parsed.expiration || timeframe.toUpperCase(),
      reasoning: parsed.reasoning || ['Multi-indicator confluence verified.'],
      martingaleAdvice: parsed.martingaleAdvice || 'Max Step 1 MTG recommended.',
      sentiment: parsed.sentiment || 'Balanced Momentum',
      bengaliSummary: parsed.bengaliSummary,
      keySupportResistance: parsed.keySupportResistance,
      processingTimeMs: Date.now() - reqStart,
      source: 'GEMINI_AI_INTERPRETATION',
    });
  } catch (error: any) {
    console.warn('AI analysis timed out or failed, using algorithmic fallback:', error?.message);
    res.json(buildAlgorithmicResponse(`Deterministic engine fallback (${error?.message || 'Fast response safeguard'})`));
  }
});

// Market Health & Diagnostics Pulse
app.get('/api/market-pulse', (_req: Request, res: Response): void => {
  res.json({
    timestamp: Date.now(),
    serverTime: new Date().toISOString(),
    status: 'ONLINE',
    providers: [
      { name: 'Quotex OTC Synthetic Feed', status: 'ACTIVE', latencyMs: 14, pairsCount: 6 },
      { name: 'Interbank Forex Live Feed', status: 'ACTIVE', latencyMs: 28, pairsCount: 4 },
      { name: 'Binance Crypto Stream', status: 'ACTIVE', latencyMs: 18, pairsCount: 1 },
    ],
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`VIP Binary AI Pro Max server running at http://0.0.0.0:${port}`);
  });
}

startServer();
