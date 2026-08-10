/**
 * Web Audio API & Speech Synthesis Sound Engine for GagGhost AI
 * Creates procedural horror-comedy SFX & Thai voiceovers
 */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play procedural horror-comedy sound effects
  public playSFX(type: string) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      switch (type) {
        case 'scary_thunder': {
          // Low frequency rumble + noise crash
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.2);
          break;
        }

        case 'screaming_ghost': {
          // Creepy sliding frequency
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.4);
          osc.frequency.exponentialRampToValueAtTime(110, now + 1.0);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.0);
          break;
        }

        case 'comedy_boing': {
          // Funny pitch jump
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'funny_cough':
        case 'laugh_track': {
          // Comedy chime burst
          [300, 400, 500, 600].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.15);
          });
          break;
        }

        case 'suspense_stinger':
        default: {
          // Creepy minor chord stinger
          [220, 261.63, 311.13].forEach((freq) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.8);
          });
          break;
        }
      }
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  // Speak Thai Narration using SpeechSynthesis
  public speakThai(
    text: string,
    isComedyTwist: boolean = false,
    onEnd?: () => void
  ) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // cancel previous

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';

    // Pitch adjustment: eerie low pitch for horror, higher funny pitch for comedy
    utterance.pitch = isComedyTwist ? 1.2 : 0.85;
    utterance.rate = isComedyTwist ? 1.1 : 0.95;

    // Pick Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') || v.name.toLowerCase().includes('thai'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    let hasEnded = false;
    const safeEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = safeEnd;
    utterance.onerror = safeEnd;

    // Safety fallback timer in case browser SpeechSynthesis hangs
    const estDurationMs = Math.max(3000, text.length * 110);
    setTimeout(() => {
      safeEnd();
    }, estDurationMs);

    window.speechSynthesis.speak(utterance);
  }

  public stopAllSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
