/**
 * Country Noise & Music - AudioEngine
 * Manages AudioContext, master routing, algorithmic reverb, and visualization analyser.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.masterGain = null;
    this.analyser = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.timerId = null;
    this.timerRemaining = 0;
    this.onTimerTick = null;
  }

  async init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    // Analyser Node for Visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.75;

    // Master Mastering Stage: Studio Warmth EQ + Analog Limiter
    // 1. Warm Analog Low-Shelf / Presence EQ (温润黑胶母带质感)
    this.analogWarmth = this.ctx.createBiquadFilter();
    this.analogWarmth.type = 'lowshelf';
    this.analogWarmth.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.analogWarmth.gain.setValueAtTime(1.8, this.ctx.currentTime); // Gentle rich sub-warmth

    // 2. Air Band Presence Filter (丝滑空气感，去除生硬数字毛刺)
    this.airPresence = this.ctx.createBiquadFilter();
    this.airPresence.type = 'highshelf';
    this.airPresence.frequency.setValueAtTime(11000, this.ctx.currentTime);
    this.airPresence.gain.setValueAtTime(-1.2, this.ctx.currentTime); // Smooth studio rolloff

    // 3. Studio Dynamics Compressor / Brickwall Limiter (无失真保真压限)
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-3.0, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(8.0, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.18, this.ctx.currentTime);

    // Algorithmic Synthetic Spatial Reverb
    await this.setupReverb();

    // Studio Master Signal Chain:
    // masterGain -> analogWarmth -> airPresence -> limiter -> analyser -> destination
    this.masterGain.connect(this.analogWarmth);
    this.analogWarmth.connect(this.airPresence);
    this.airPresence.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  async resume() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isPlaying = true;
  }

  async setupReverb() {
    // Generate an organic impulse response for spatial ambient reverb
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 3.2; // 3.2 second decay
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    const decay = 2.4;
    for (let i = 0; i < length; i++) {
      const n = i / length;
      const env = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.analogWarmth);
  }

  setMasterVolume(val) {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  setTimer(minutes, onTick, onComplete) {
    if (this.timerId) clearInterval(this.timerId);
    if (minutes <= 0) {
      this.timerRemaining = 0;
      if (onTick) onTick(0);
      return;
    }

    this.timerRemaining = minutes * 60;
    if (onTick) onTick(this.timerRemaining);

    this.timerId = setInterval(() => {
      this.timerRemaining--;
      if (onTick) onTick(this.timerRemaining);

      // Fade out in the last 15 seconds
      if (this.timerRemaining <= 15 && this.timerRemaining > 0) {
        const factor = this.timerRemaining / 15;
        if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(0.8 * factor, this.ctx.currentTime, 0.1);
        }
      }

      if (this.timerRemaining <= 0) {
        clearInterval(this.timerId);
        this.timerId = null;
        // Restore master volume so next playback isn't silent
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        }
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  cancelTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.timerRemaining = 0;
      // Restore master volume in case cancelled during fade-out
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.05);
      }
    }
  }
}
