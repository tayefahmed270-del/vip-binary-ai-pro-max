import { VipSignal } from '../types/trading';

/**
 * Web Audio API Synthesizer for high-tech trading sounds
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public voiceAssistantEnabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playSignalAlert() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playTradePlaced() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playWin() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  public playLoss() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 370, 311]; // descending minor

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  public playTick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * BENGALI TEXT-TO-SPEECH (Web Speech API)
   * Guaranteed to speak the exact verified result:
   * - CALL: "বর্তমান ডেটা অনুযায়ী CALL-এর পক্ষে সংকেত পাওয়া গেছে। এটি নিশ্চিত পূর্বাভাস নয় এবং ট্রেডে ঝুঁকি রয়েছে।"
   * - PUT: "বর্তমান ডেটা অনুযায়ী PUT-এর পক্ষে সংকেত পাওয়া গেছে। যথাযথ মানি ম্যানেজমেন্ট ও ক্যাপিটাল সুরক্ষা মেনে চলুন।"
   * - WAIT: "বর্তমানে পর্যাপ্ত নির্ভরযোগ্য সংকেত পাওয়া যায়নি।"
   */
  public speakSignalResult(signal: VipSignal, language: 'en' | 'bn' = 'bn'): void {
    if (!this.enabled || !this.voiceAssistantEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop prior speech

      let textToSpeak = '';
      if (language === 'bn') {
        textToSpeak = signal.bengaliVoiceText || (
          signal.decision === 'CALL'
            ? 'বর্তমান ডেটা অনুযায়ী CALL-এর পক্ষে সংকেত পাওয়া গেছে। এটি নিশ্চিত পূর্বাভাস নয় এবং ট্রেডে ঝুঁকি রয়েছে।'
            : signal.decision === 'PUT'
            ? 'বর্তমান ডেটা অনুযায়ী PUT-এর পক্ষে সংকেত পাওয়া গেছে। যথাযথ মানি ম্যানেজমেন্ট ও ক্যাপিটাল সুরক্ষা মেনে চলুন।'
            : 'বর্তমানে পর্যাপ্ত নির্ভরযোগ্য সংকেত পাওয়া যায়নি।'
        );
      } else {
        textToSpeak = signal.decision === 'CALL'
          ? `VIP Signal CALL detected for ${signal.assetName} with ${signal.confidence} percent confidence. Capital risk applies.`
          : signal.decision === 'PUT'
          ? `VIP Signal PUT detected for ${signal.assetName} with ${signal.confidence} percent confidence. Practice money management.`
          : `Wait decision advised. Insufficient confluent evidence for ${signal.assetName}.`;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (language === 'bn') {
        utterance.lang = 'bn-BD';
        const bnVoice = voices.find((v) => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
        if (bnVoice) utterance.voice = bnVoice;
      } else {
        utterance.lang = 'en-US';
        const enVoice = voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const sound = new SoundEngine();
