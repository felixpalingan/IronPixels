// Sound & Haptic Feedback Engine for IronPixels
// Powered by Helton Yan's Pixel Combat Audio Assets & Web Audio API fallback

export type SoundEffectType = "attack" | "chest" | "timer" | "select" | "level_up";

class SoundEngine {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.preload();
    }
  }

  private preload() {
    const sounds: SoundEffectType[] = ["attack", "chest", "timer", "select"];
    sounds.forEach((name) => {
      try {
        const audio = new Audio(`/assets/audio/${name}.wav`);
        audio.preload = "auto";
        audio.volume = 0.6;
        this.audioCache.set(name, audio);
      } catch (e) {}
    });
  }

  public play(effect: SoundEffectType) {
    if (this.isMuted || typeof window === "undefined") return;

    try {
      const cached = this.audioCache.get(effect);
      if (cached) {
        cached.currentTime = 0;
        cached.play().catch(() => {
          this.synthesizeWebAudio(effect);
        });
      } else {
        const audio = new Audio(`/assets/audio/${effect}.wav`);
        audio.volume = 0.6;
        audio.play().catch(() => {
          this.synthesizeWebAudio(effect);
        });
      }
    } catch (e) {
      this.synthesizeWebAudio(effect);
    }
  }

  public triggerHaptic(pattern: number | number[] = [50, 30, 50]) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  private synthesizeWebAudio(effect: SoundEffectType) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (effect === "attack") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (effect === "timer") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (effect === "chest") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.type = "square";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();
