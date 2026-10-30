// Sound & Haptic Feedback Engine for IronPixels
// Powered by Helton Yan's Pixel Combat Audio Assets & Web Audio API fallback

export type SoundEffectType = "attack" | "chest" | "timer" | "select" | "level_up";

class SoundEngine {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private isHapticsEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private keepAliveOsc: OscillatorNode | null = null;
  private keepAliveGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ironpixels_sound_muted");
        this.isMuted = saved === "true";
        const savedHaptics = localStorage.getItem("ironpixels_haptics_enabled");
        this.isHapticsEnabled = savedHaptics !== "false";
      } catch (e) {}
      this.preload();
    }
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      return null;
    }
  }

  /**
   * Starts a sub-audible (-100dB) Web Audio oscillator while the rest timer is active.
   * This prevents mobile & desktop browsers from freezing the background tab or Service Worker
   * when the user switches to another app or locks their screen during rest intervals.
   */
  public startTimerKeepAlive() {
    if (typeof window === "undefined") return;
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;
      if (this.keepAliveOsc) return; // Already active

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1, ctx.currentTime); // 1 Hz sub-audible
      gain.gain.setValueAtTime(0.00001, ctx.currentTime); // Virtually zero volume (-100dB)

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.keepAliveOsc = osc;
      this.keepAliveGain = gain;
    } catch (e) {}
  }

  public stopTimerKeepAlive() {
    try {
      if (this.keepAliveOsc) {
        this.keepAliveOsc.stop();
        this.keepAliveOsc.disconnect();
        this.keepAliveOsc = null;
      }
      if (this.keepAliveGain) {
        this.keepAliveGain.disconnect();
        this.keepAliveGain = null;
      }
    } catch (e) {
      this.keepAliveOsc = null;
      this.keepAliveGain = null;
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ironpixels_sound_muted", muted ? "true" : "false");
      } catch (e) {}
    }
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getIsHapticsEnabled(): boolean {
    return this.isHapticsEnabled;
  }

  public setHapticsEnabled(enabled: boolean): boolean {
    this.isHapticsEnabled = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ironpixels_haptics_enabled", enabled ? "true" : "false");
      } catch (e) {}
    }
    return this.isHapticsEnabled;
  }

  public toggleHaptics(): boolean {
    return this.setHapticsEnabled(!this.isHapticsEnabled);
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

    // Ensure shared AudioContext is unlocked during user gestures
    this.getOrCreateAudioContext();

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
    if (!this.isHapticsEnabled) return;
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  private synthesizeWebAudio(effect: SoundEffectType) {
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;
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
        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1318.5, now + 0.12);
        osc.frequency.setValueAtTime(1760, now + 0.24);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
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
