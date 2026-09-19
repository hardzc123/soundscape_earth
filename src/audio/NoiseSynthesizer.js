/**
 * NoiseSynthesizer.js - Geographic Landscape Soundscapes
 * Rich procedural synthesis of distinctive regional natural environments:
 * - 🇨🇳 Jiangnan Eaves Rain & Stone Puddles (江南檐下雨滴与石板细雨)
 * - 🇯🇵 Zen Kyoto Courtyard Water Stream (京都禅院竹水潺潺)
 * - 🇫🇷 Parisian Night Rain on Cobblestones (巴黎石板路温和夜雨)
 * - 🇮🇸 Arctic Blizzard & Glacial Ice Melt (极地呼啸冰风暴与冰川融滴)
 * - 🇮🇪 Atlantic Cliff Surge Waves (大西洋巨浪与海雾)
 * - 🇮🇳 Sacred River Mist & Warm Breeze (恒河晨雾与水声)
 * - 🇧🇷 Amazon Rainforest Canopy Shower (亚马逊雨林暴雨与虫鸣)
 * - 🇲🇦 Sahara Desert Dunes Wind & Campfire (撒哈拉沙丘风与篝火)
 */

export class NoiseSynthesizer {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.activeNodes = [];
    this.gainNode = null;
    this.volume = 0.6;
    this.currentType = null;
    this.dropletTimer = null;
  }

  ensureContext() {
    this.ctx = this.engine.ctx;
    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.engine.masterGain);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    if (this.dropletTimer) {
      clearInterval(this.dropletTimer);
      this.dropletTimer = null;
    }
    this.currentType = null;
  }

  createPinkNoiseBuffer(duration = 5) {
    const size = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  createBrownNoiseBuffer(duration = 5) {
    const size = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  play(type) {
    this.ensureContext();
    this.stop();
    this.currentType = type;

    switch (type) {
      case 'rain':
        this.playRain();
        break;
      case 'wind':
        this.playArcticWind();
        break;
      case 'waves':
        this.playAtlanticWaves();
        break;
      case 'stream':
        this.playZenStream();
        break;
      case 'campfire':
        this.playCampfire();
        break;
      case 'forest':
        this.playAmazonRainforest();
        break;
      default:
        this.playRain();
    }
  }

  // Rain: Filtered Pink Noise with Random Eave Drops
  playRain() {
    const pinkBuffer = this.createPinkNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = pinkBuffer;
    src.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, this.ctx.currentTime);

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(220, this.ctx.currentTime);

    src.connect(lp);
    lp.connect(hp);
    hp.connect(this.gainNode);
    src.start();
    this.activeNodes.push(src, lp, hp);

    // Eaves rain drops on stones
    this.dropletTimer = setInterval(() => {
      if (this.currentType !== 'rain' || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const freq = 1100 + Math.random() * 1400;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, this.ctx.currentTime + 0.05);

      g.gain.setValueAtTime(0.04 + Math.random() * 0.04, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);

      osc.connect(g);
      g.connect(this.gainNode);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    }, 180 + Math.random() * 240);
  }

  // Arctic Blizzard: Cold Howling Wind Vortex with LFO
  playArcticWind() {
    const brownBuffer = this.createBrownNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = brownBuffer;
    src.loop = true;

    // Resonant howling bandpass
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(320, this.ctx.currentTime);
    bp.Q.setValueAtTime(4.5, this.ctx.currentTime); // High resonance for howling whistle

    // Slow gust LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(240, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    src.connect(bp);
    bp.connect(this.gainNode);
    src.start();
    lfo.start();
    this.activeNodes.push(src, bp, lfo, lfoGain);

    // Glacial Ice Melt drops in ice caves
    this.dropletTimer = setInterval(() => {
      if (this.currentType !== 'wind' || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.12);

      g.gain.setValueAtTime(0.03, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.14);

      osc.connect(g);
      g.connect(this.gainNode);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }, 700 + Math.random() * 900);
  }

  // Atlantic Waves: Powerful surges with foam recession
  playAtlanticWaves() {
    const pinkBuffer = this.createPinkNoiseBuffer(6);
    const src = this.ctx.createBufferSource();
    src.buffer = pinkBuffer;
    src.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    // 8-second wave rhythm
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    src.connect(lp);
    lp.connect(waveGain);
    waveGain.connect(this.gainNode);

    src.start();
    lfo.start();
    this.activeNodes.push(src, lp, waveGain, lfo, lfoGain);
  }

  // Zen Kyoto Stream: Clear gentle water brook
  playZenStream() {
    const pinkBuffer = this.createPinkNoiseBuffer(3);
    const src = this.ctx.createBufferSource();
    src.buffer = pinkBuffer;
    src.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bp.Q.setValueAtTime(2.8, this.ctx.currentTime);

    src.connect(bp);
    bp.connect(this.gainNode);
    src.start();
    this.activeNodes.push(src, bp);

    // Liquid bubbling
    this.dropletTimer = setInterval(() => {
      if (this.currentType !== 'stream' || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = 700 + Math.random() * 750;
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 1.6, this.ctx.currentTime + 0.05);

      g.gain.setValueAtTime(0.035, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(g);
      g.connect(this.gainNode);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    }, 110);
  }

  // Campfire: Brown noise warmth + crisp snapping sparks
  playCampfire() {
    const brownBuffer = this.createBrownNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = brownBuffer;
    src.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(340, this.ctx.currentTime);

    src.connect(lp);
    lp.connect(this.gainNode);
    src.start();
    this.activeNodes.push(src, lp);

    // Sharp ember crackle
    this.dropletTimer = setInterval(() => {
      if (this.currentType !== 'campfire' || !this.ctx) return;
      if (Math.random() > 0.4) {
        const pop = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, 900, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < 900; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 140);
        pop.buffer = buf;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(1400, this.ctx.currentTime);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.1 + Math.random() * 0.12, this.ctx.currentTime);

        pop.connect(hp);
        hp.connect(g);
        g.connect(this.gainNode);
        pop.start();
      }
    }, 85);
  }

  // Amazon Rainforest: Canopy rain + pulsing nocturnal crickets
  playAmazonRainforest() {
    const pinkBuffer = this.createPinkNoiseBuffer(4);
    const src = this.ctx.createBufferSource();
    src.buffer = pinkBuffer;
    src.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(5400, this.ctx.currentTime);
    bp.Q.setValueAtTime(10.0, this.ctx.currentTime);

    const pulse = this.ctx.createGain();
    pulse.gain.setValueAtTime(0.06, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(14, this.ctx.currentTime);
    const lfoG = this.ctx.createGain();
    lfoG.gain.setValueAtTime(0.05, this.ctx.currentTime);

    lfo.connect(lfoG);
    lfoG.connect(pulse.gain);

    src.connect(bp);
    bp.connect(pulse);
    pulse.connect(this.gainNode);

    src.start();
    lfo.start();
    this.activeNodes.push(src, bp, pulse, lfo, lfoG);
  }
}
