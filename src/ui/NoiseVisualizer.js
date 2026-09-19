/**
 * NoiseVisualizer.js
 * Ethereal, live acoustic waveform visualizer for natural white noise soundscapes.
 * 
 * Inspired by Bang & Olufsen, Teenage Engineering, and Dieter Rams:
 * - Real-time Web Audio FFT analysis from natureGain.
 * - Dynamic 36-bar acoustic soundwave spectrum with organic breathing wavelets.
 * - Dual-state luminous rendering (active illuminated side vs. passive hairline side).
 * - High-DPI Retina canvas rendering with zero frame drop.
 */

export class NoiseVisualizer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.volume = 0.7;
    this.isPlaying = false;
    this.isRunning = false;
    this.time = 0;

    this.numBars = 36;
    this.fftData = new Uint8Array(64);
    this.smoothedHeights = new Float32Array(this.numBars);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setPlaying(playing) {
    this.isPlaying = !!playing;
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning) return;
    this.time += 0.035;
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  draw() {
    const { ctx, width, height } = this;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const analyser = this.engine && this.engine.natureAnalyser;
    const hasLiveAudio = this.isPlaying && analyser && this.volume > 0.01;

    if (hasLiveAudio) {
      analyser.getByteFrequencyData(this.fftData);
    }

    const centerY = height / 2;
    const barWidth = 2.0;
    const totalBars = this.numBars;
    const availableW = width - 16;
    const spacing = availableW / (totalBars - 1);
    const startX = 8;
    const activeCutoffX = startX + (width - 16) * this.volume;

    // Center subtle zero-energy guide hairline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    ctx.moveTo(startX, centerY);
    ctx.lineTo(width - startX, centerY);
    ctx.stroke();

    for (let i = 0; i < totalBars; i++) {
      const bx = startX + i * spacing;
      const isActive = bx <= activeCutoffX;

      let targetEnergy = 0;
      if (hasLiveAudio) {
        // Map bar index to frequency spectrum bin
        const bin = Math.min(this.fftData.length - 1, Math.floor((i / totalBars) * 28));
        const rawFft = this.fftData[bin] / 255.0;
        // Add subtle organic undulating ripple so continuous noise lives and breathes
        const organicRipple = 0.15 * Math.sin(this.time * 2.8 + i * 0.45) + 0.1 * Math.cos(this.time * 1.6 + i * 0.8);
        targetEnergy = Math.max(0, rawFft + organicRipple) * this.volume;
      } else if (this.volume > 0.01) {
        // Subtle ambient resting wave when paused or unrouted
        const idleWave = (Math.sin(this.time * 1.5 + i * 0.35) * 0.5 + 0.5) * 0.25;
        targetEnergy = idleWave * this.volume;
      } else {
        targetEnergy = 0;
      }

      // Smooth interpolation for silky motion
      this.smoothedHeights[i] += (targetEnergy - this.smoothedHeights[i]) * 0.22;
      const energy = this.smoothedHeights[i];

      // Minimum bar height is 2px, maximum stretches to 82% of container height
      const barH = Math.max(2.5, energy * (height * 0.82));
      const topY = centerY - barH / 2;

      ctx.save();
      ctx.beginPath();
      // Rounded bar pill
      if (ctx.roundRect) {
        ctx.roundRect(bx - barWidth / 2, topY, barWidth, barH, 1.2);
      } else {
        ctx.rect(bx - barWidth / 2, topY, barWidth, barH);
      }

      if (isActive) {
        // Active illuminated section
        const alpha = Math.min(1.0, 0.55 + energy * 0.45);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        if (energy > 0.35) {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          ctx.shadowBlur = 4;
        }
      } else {
        // Passive section (ahead of fader thumb)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      }
      ctx.fill();
      ctx.restore();
    }
  }
}
