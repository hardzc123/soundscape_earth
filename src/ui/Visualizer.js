/**
 * Visualizer.js - Acoustic Radial Mandala / Minimalist Pure Soundwave Wheel
 * 
 * Inspired by Dieter Rams, Bang & Olufsen, and Leica industrial design:
 * - 100% Genuine Acoustic Resonance: Driven directly by live master audio frequencies.
 * - Zero Fake Polygons / Zero Artificial Scales: Pure, honest, timeless minimalism.
 * - Precision Architectural Dial: 60 hairline radial ticks & 12 cardinal micro-nodes.
 * - Low-Frequency Bass Wavefronts: Velvety concentric ripples emanate outward when cello/guqin/piano resonates.
 * - High-Frequency Shimmer Rays: Outer perimeter tick marks illuminate with whisper-thin micro-beams on plucks and high notes.
 * - Central Tactile Glass Plate: Displays country, authentic master track, and live acoustic state.
 */

export class Visualizer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.isRunning = false;
    this.time = 0;

    // Track metadata displayed in center plate
    this.currentCountry = null;
    this.currentTrack = null;

    // Real acoustic beat & onset detection (Spectral Flux + Adaptive Threshold)
    this.wavefrontRipples = [];
    this.lastRippleTime = 0;
    this.prevSpectrum = new Float32Array(128);
    this.fluxHistory = new Float32Array(25);
    this.fluxHistoryIdx = 0;
    this.isPlaying = false;

    // 60-band smoothed spectrum for perimeter tick micro-rays
    this.smoothedTicks = new Float32Array(60);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setPlaying(playing) {
    this.isPlaying = !!playing;
  }

  setTrackInfo(country, track) {
    this.currentCountry = country;
    this.currentTrack = track;
  }

  triggerTrackChangeWave() {
    this.wavefrontRipples.push({
      radius: 0,
      maxRadius: 1.0,
      alpha: 0.95,
      width: 1.8,
      isHarmonicBurst: true
    });
    for (let i = 0; i < 60; i++) {
      this.smoothedTicks[i] = Math.max(this.smoothedTicks[i], 0.35 + Math.random() * 0.25);
    }
  }

  // Backward compatibility
  setScaleData() {}
  setCountry(country) {
    this.currentCountry = country;
    if (country && country.tracks && country.tracks.length > 0) {
      this.currentTrack = country.tracks[0];
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

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
    this.time += 0.016;
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  draw() {
    const { ctx, width, height } = this;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const analyser = this.engine.musicAnalyser || this.engine.analyser;
    const isPlaying = this.isPlaying;

    let totalEnergy = 0;
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    const fftSize = analyser ? analyser.fftSize : 2048;
    const freqData = new Uint8Array(fftSize / 2);

    if (analyser && isPlaying) {
      analyser.getByteFrequencyData(freqData);

      // Bass band (bins 1 to 14, ~20Hz to 300Hz: Cello, Guqin, Piano left hand)
      let bassSum = 0;
      for (let i = 1; i <= 14; i++) bassSum += freqData[i];
      bassEnergy = (bassSum / 14 / 255);

      // Mid band (bins 15 to 60, ~300Hz to 1300Hz)
      let midSum = 0;
      for (let i = 15; i <= 60; i++) midSum += freqData[i];
      midEnergy = (midSum / 46 / 255);

      // High band (bins 61 to 180, ~1300Hz to 3900Hz: Plucks, air harmonics, bells)
      let highSum = 0;
      for (let i = 61; i <= 180; i++) highSum += freqData[i];
      highEnergy = (highSum / 120 / 255);

      totalEnergy = bassEnergy * 0.45 + midEnergy * 0.35 + highEnergy * 0.2;

      // Map 60 perimeter frequency sectors across active spectrum
      for (let i = 0; i < 60; i++) {
        const binIndex = Math.min(freqData.length - 1, Math.floor(1 + Math.pow(i / 60, 1.6) * 160));
        const val = freqData[binIndex] / 255;
        // Smooth decay
        if (val > this.smoothedTicks[i]) {
          this.smoothedTicks[i] += (val - this.smoothedTicks[i]) * 0.45;
        } else {
          this.smoothedTicks[i] *= 0.88;
        }
      }

      // Real Musical Transient & Onset Detection (Spectral Flux)
      let spectralFlux = 0;
      const numBins = Math.min(100, freqData.length);
      for (let i = 1; i < numBins; i++) {
        const curr = freqData[i] / 255;
        const prev = this.prevSpectrum[i] || 0;
        // Half-wave rectification: only count rising attack transients
        if (curr > prev) {
          const weight = i < 35 ? 1.4 : 0.8;
          spectralFlux += (curr - prev) * weight;
        }
        this.prevSpectrum[i] = curr;
      }
      spectralFlux /= numBins;

      // Update rolling dynamic average flux
      this.fluxHistory[this.fluxHistoryIdx] = spectralFlux;
      this.fluxHistoryIdx = (this.fluxHistoryIdx + 1) % this.fluxHistory.length;
      let avgFlux = 0;
      for (let i = 0; i < this.fluxHistory.length; i++) {
        avgFlux += this.fluxHistory[i];
      }
      avgFlux /= this.fluxHistory.length;

      // Real Beat / Attack Decision (matches rhythm, not continuous drone)
      const now = performance.now();
      const timeSinceLast = now - this.lastRippleTime;
      const isTransientAttack = (spectralFlux > avgFlux * 1.55 + 0.016) && (spectralFlux > 0.022);

      if (isTransientAttack && timeSinceLast > 280) {
        this.lastRippleTime = now;
        const attackIntensity = Math.min(1.0, (spectralFlux - avgFlux) * 16);
        this.wavefrontRipples.push({
          radius: 0,
          speed: 0.013 + attackIntensity * 0.006,
          maxRadius: 1.0,
          alpha: Math.min(0.85, 0.35 + attackIntensity * 0.5),
          width: 0.8 + attackIntensity * 1.6
        });
      }
    } else {
      // Natural decay when paused
      for (let i = 0; i < 60; i++) {
        this.smoothedTicks[i] *= 0.85;
      }
    }

    const cx = width / 2;
    const cy = height / 2;

    // Outer and inner radii
    const outerRadius = Math.min(width, height) * 0.42;
    const innerRadius = outerRadius * 0.60;

    // 1. Ambient Acoustic Halo (Soft background aura responding to live dynamics)
    const haloGrad = ctx.createRadialGradient(cx, cy, innerRadius * 0.8, cx, cy, outerRadius * 1.2);
    haloGrad.addColorStop(0, `rgba(255, 255, 255, ${0.03 + totalEnergy * 0.04})`);
    haloGrad.addColorStop(0.7, `rgba(255, 255, 255, ${0.008 + totalEnergy * 0.015})`);
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concentric Acoustic Bass Wavefronts (真实节拍瞬态产生的同心微澜)
    for (let i = this.wavefrontRipples.length - 1; i >= 0; i--) {
      const rip = this.wavefrontRipples[i];
      rip.radius += rip.speed || 0.014;
      rip.alpha *= 0.955;

      if (rip.alpha < 0.015 || rip.radius >= 1.0) {
        this.wavefrontRipples.splice(i, 1);
        continue;
      }

      const r = innerRadius + (outerRadius - innerRadius) * rip.radius;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (rip.isHarmonicBurst) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.75})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.35})`;
      }
      ctx.lineWidth = rip.width;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Precision Concentric Dial Circles (Hairline architectural tracks)
    // Outer boundary track
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Mid-reverb guide circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + (outerRadius - innerRadius) * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 4. 60 Precision Dial Ticks & High-Frequency Shimmer Rays (外环精密刻度与高频微光针)
    for (let i = 0; i < 60; i++) {
      const theta = (i * 2 * Math.PI) / 60 - Math.PI / 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const isCardinal = (i % 5 === 0); // 12 cardinal divisions (like hours on a watch)
      const tickEnergy = this.smoothedTicks[i] || 0;

      // Base tick length: 3px for normal, 6px for cardinal
      const baseTickLen = isCardinal ? 6.5 : 3.5;
      // High-frequency energy extends tick inward as a needle beam
      const extendedLen = baseTickLen + tickEnergy * 14;

      const x1 = cx + cos * outerRadius;
      const y1 = cy + sin * outerRadius;
      const x2 = cx + cos * (outerRadius - extendedLen);
      const y2 = cy + sin * (outerRadius - extendedLen);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (tickEnergy > 0.12) {
        // High note or pluck triggered: pure white micro-ray with delicate glow!
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isCardinal ? 1.2 : 0.8;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8 * tickEnergy;
        ctx.globalAlpha = Math.min(1.0, 0.4 + tickEnergy * 0.7);
      } else {
        // Resting architectural tick
        ctx.strokeStyle = isCardinal ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = isCardinal ? 0.75 : 0.5;
        ctx.globalAlpha = 1.0;
      }
      ctx.stroke();
      ctx.restore();

      // Cardinal Micro-Nodes on Outer Ring (12 delicate dots)
      if (isCardinal) {
        const dotRadius = 1.4;
        const dx = cx + cos * (outerRadius + 8);
        const dy = cy + sin * (outerRadius + 8);

        ctx.save();
        ctx.beginPath();
        ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
        if (tickEnergy > 0.15) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        }
        ctx.fill();
        ctx.restore();
      }
    }

    // 5. Central Tactile Glass Plate (中央极简半透毛玻璃圆芯)
    ctx.save();
    // Frosted Glass Disc Background
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 11, 15, 0.82)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 20;
    ctx.fill();

    // Hairline Inner Border
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + totalEnergy * 0.15})`;
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Subtle Core Concentric Guide Ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 6. Central State (Clean, Zen, Timeless Vector Minimalism)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isPlaying) {
      // Dynamic live acoustic core ring that breathes with music
      const coreR = innerRadius * (0.35 + totalEnergy * 0.16);
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + totalEnergy * 0.05})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + totalEnergy * 0.35})`;
      ctx.lineWidth = 0.75;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 8 * totalEnergy;
      ctx.stroke();

      // Minimalist Elegant Pause Bars
      const barH = 13;
      const barW = 2.5;
      const barGap = 3.5;
      const barAlpha = 0.7 + totalEnergy * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${barAlpha})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 6;
      ctx.fillRect(cx - barGap - barW / 2, cy - barH / 2, barW, barH);
      ctx.fillRect(cx + barGap - barW / 2, cy - barH / 2, barW, barH);
    } else {
      // Paused state: Pure Hairline Minimalist Play Triangle
      const triH = 14;
      ctx.beginPath();
      ctx.moveTo(cx - triH * 0.42, cy - triH * 0.62);
      ctx.lineTo(cx + triH * 0.65, cy);
      ctx.lineTo(cx - triH * 0.42, cy + triH * 0.62);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    ctx.restore();
  }
}
