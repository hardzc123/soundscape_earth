/**
 * InstrumentSynthesizer.js - Authentic Physical & Acoustic Modeling
 * Features authentic ethnic acoustic instruments:
 * - 🇨🇳 Chinese Guzheng (古筝流水刮奏/滚指/弹拨) & Xiao/Bamboo Flute (竹膜共鸣)
 * - 🇯🇵 Japanese Shakuhachi (尺八吹气破风/滑音) & Koto (平调子十三弦筝) & Shishi-odoshi (添水鹿威)
 * - 🇫🇷 Parisian Musette Accordion (巴黎风箱双音簧颤音华尔兹)
 * - 🇮🇳 Indian Sitar (西塔琴 Javari 扁平桥蜂鸣/Meend弯音) & Tanpura (四弦循环嗡鸣)
 * - 🇮🇸 Icelandic Bowed Pad & Ambient Neoclassical Piano (极光冰原延音)
 * - 🇮🇪 Celtic Harp (凯尔特竖琴流动滚奏)
 * - 🇧🇷 Brazilian Bossa Nova Nylon Guitar (温润切分爵士和弦)
 * - 🇲🇦 Moroccan Oud (乌德琴希贾兹微音颤音)
 */

export class InstrumentSynthesizer {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.gainNode = null;
    this.reverbSend = null;
    this.volume = 0.7;
    this.activeDroneNodes = [];
    this.activeWaltzHandle = null;
    this.activeTanpuraHandle = null;
    this.activeNoteTimers = [];
    this.activeVoices = [];
  }

  ensureContext() {
    this.ctx = this.engine.ctx;
    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.engine.masterGain);

      // Reverb send
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.gainNode.connect(this.reverbSend);
      if (this.engine.reverbNode) {
        this.reverbSend.connect(this.engine.reverbNode);
      }
    }
  }

  registerTimer(tid) {
    this.activeNoteTimers.push(tid);
    return tid;
  }

  registerVoice(source, gainNode = null) {
    this.activeVoices.push({ source, gainNode });
    return source;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stopAllDronesAndRhythms() {
    // 1. Clear all sequence and arpeggio timeouts immediately
    this.activeNoteTimers.forEach(tid => clearTimeout(tid));
    this.activeNoteTimers = [];

    // 2. Rapidly fade and kill any sounding note voices to prevent audio bleeding between tracks
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.activeVoices.forEach(({ source, gainNode }) => {
      try {
        if (gainNode && gainNode.gain) {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.03);
        }
        if (source && source.stop) {
          source.stop(now + 0.035);
        }
      } catch (e) {}
    });
    this.activeVoices = [];

    // 3. Stop any active drones or sustained nodes
    this.activeDroneNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeDroneNodes = [];

    if (this.activeWaltzHandle) {
      clearTimeout(this.activeWaltzHandle);
      this.activeWaltzHandle = null;
    }
    if (this.activeTanpuraHandle) {
      clearTimeout(this.activeTanpuraHandle);
      this.activeTanpuraHandle = null;
    }
  }

  /* ============================================================
     1. 🇨🇳 CHINA: Guzheng Pluck, Cascading Glissando & Xiao Bamboo Flute
     ============================================================ */

  /**
   * Authentic Guzheng Pluck with wooden box resonance and harmonic decay
   */
  playGuzhengNote(freq, duration = 3.5, velocity = 0.8) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc3.type = 'sine';

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.01, now);
    osc3.frequency.setValueAtTime(freq * 3.02, now);

    // Subtle traditional Chinese pitch bend (微弯音)
    if (Math.random() > 0.5) {
      osc1.frequency.setValueAtTime(freq * 1.025, now);
      osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.15);
    }

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.32 * velocity, now + 0.008); // Sharp plectrum strike
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Resonant Paulownia wood soundboard filter
    const woodFilter = this.ctx.createBiquadFilter();
    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(1600, now);
    woodFilter.Q.setValueAtTime(1.5, now);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    osc3.connect(noteGain);
    noteGain.connect(woodFilter);
    woodFilter.connect(this.gainNode);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    osc3.stop(now + duration + 0.1);
  }

  /**
   * Chinese Guzheng Cascading Glissando (古筝流水刮奏/花指)
   * Rapid ascending/descending pentatonic sweep across 6-9 strings
   */
  playGuzhengGlissando(notes, isAscending = true) {
    this.ensureContext();
    const sequence = isAscending ? notes : [...notes].reverse();
    const stepDelay = 45; // ms between string plucks

    sequence.forEach((freq, idx) => {
      this.registerTimer(setTimeout(() => {
        const vel = 0.5 + 0.3 * Math.sin((idx / sequence.length) * Math.PI);
        this.playGuzhengNote(freq, 2.8, vel);
      }, idx * stepDelay));
    });
  }

  /**
   * Chinese Bamboo Flute / Xiao (竹笛/箫 - 带竹膜共鸣震颤与虚吹气声)
   */
  playChineseFlute(freq, duration = 4.2) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.98, now);
    // Expressive portamento slide into the pitch
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.25);

    // Di Mo (竹膜共振高频谐波)
    const diMo = this.ctx.createOscillator();
    diMo.type = 'triangle';
    diMo.frequency.setValueAtTime(freq * 2, now);

    // Gentle vibrato (柔和揉音)
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.4, now);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(freq * 0.018, now);
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    // Breath air noise
    const breathBuffer = this.ctx.createBuffer(1, 6000, this.ctx.sampleRate);
    const data = breathBuffer.getChannelData(0);
    for (let i = 0; i < 6000; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1500);
    const breathSrc = this.ctx.createBufferSource();
    breathSrc.buffer = breathBuffer;
    const breathFilter = this.ctx.createBiquadFilter();
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(freq * 1.8, now);
    breathFilter.Q.setValueAtTime(3.0, now);
    const breathGain = this.ctx.createGain();
    breathGain.gain.setValueAtTime(0.05, now);
    breathGain.gain.exponentialRampToValueAtTime(0.005, now + 1.2);
    breathSrc.connect(breathFilter);
    breathFilter.connect(breathGain);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.24, now + 0.4); // Tender breath attack
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(mainGain);
    diMo.connect(mainGain);
    breathGain.connect(mainGain);
    mainGain.connect(this.gainNode);

    vibrato.start(now);
    osc.start(now);
    diMo.start(now);
    breathSrc.start(now);

    vibrato.stop(now + duration + 0.1);
    osc.stop(now + duration + 0.1);
    diMo.stop(now + duration + 0.1);
  }

  /* ============================================================
     2. 🇯🇵 JAPAN: Shakuhachi (尺八破风), Koto & Shishi-odoshi (添水)
     ============================================================ */

  /**
   * Japanese Shakuhachi (尺八 - 空灵古刹，管口强烈吹气摩擦与俯仰音滑音)
   */
  playShakuhachi(freq, duration = 4.5) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const core = this.ctx.createOscillator();
    core.type = 'triangle';
    // Meri/Kari: starts slightly flat, bends up expressively
    core.frequency.setValueAtTime(freq * 0.94, now);
    core.frequency.exponentialRampToValueAtTime(freq, now + 0.35);

    // Shakuhachi intense breath turbulence
    const breathSize = this.ctx.sampleRate * 1.2;
    const breathBuffer = this.ctx.createBuffer(1, breathSize, this.ctx.sampleRate);
    const bData = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathSize; i++) {
      bData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
    }
    const breathNode = this.ctx.createBufferSource();
    breathNode.buffer = breathBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.Q.setValueAtTime(5.0, now);

    const bGain = this.ctx.createGain();
    bGain.gain.setValueAtTime(0.16, now); // Sharp burst of breath
    bGain.gain.exponentialRampToValueAtTime(0.015, now + 1.2);

    breathNode.connect(bp);
    bp.connect(bGain);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.28, now + 0.25);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    core.connect(noteGain);
    bGain.connect(noteGain);
    noteGain.connect(this.gainNode);

    core.start(now);
    breathNode.start(now);

    core.stop(now + duration + 0.1);
  }

  /**
   * Shishi-odoshi (添水/鹿威 - 竹管清脆叩击石台回响)
   */
  playShishiOdoshi() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Hollow bamboo strike transient (双段木质共振)
    const strike1 = this.ctx.createOscillator();
    const strike2 = this.ctx.createOscillator();
    strike1.type = 'triangle';
    strike2.type = 'sine';

    strike1.frequency.setValueAtTime(380, now);
    strike1.frequency.exponentialRampToValueAtTime(90, now + 0.08);

    strike2.frequency.setValueAtTime(950, now);
    strike2.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    const strikeGain = this.ctx.createGain();
    strikeGain.gain.setValueAtTime(0.38, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    // Stone courtyard resonant echo
    const stoneFilter = this.ctx.createBiquadFilter();
    stoneFilter.type = 'bandpass';
    stoneFilter.frequency.setValueAtTime(750, now);
    stoneFilter.Q.setValueAtTime(3.5, now);

    strike1.connect(strikeGain);
    strike2.connect(strikeGain);
    strikeGain.connect(stoneFilter);
    stoneFilter.connect(this.gainNode);

    strike1.start(now);
    strike2.start(now);
    strike1.stop(now + 0.65);
    strike2.stop(now + 0.65);
  }

  /* ============================================================
     3. 🇫🇷 FRANCE: Parisian Musette Accordion & 3/4 Waltz Swells
     ============================================================ */

  /**
   * Authentic Parisian Musette Accordion (巴黎风箱双音簧手风琴)
   * Plays a reed chord with dual detuned reed warble and bellows swell
   */
  playAccordionChord(notes, duration = 1.4, isUpbeat = false) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const chordGain = this.ctx.createGain();
    const maxGain = isUpbeat ? 0.18 : 0.26;
    chordGain.gain.setValueAtTime(0.001, now);
    // Bellows breath attack
    chordGain.gain.linearRampToValueAtTime(maxGain, now + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    chordGain.connect(this.gainNode);

    notes.forEach(freq => {
      // Dual reed detuning (±4.5 cents) creates iconic French musette shimmer
      [-4.5, 4.5].forEach(detuneCents => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detuneCents, now);

        const reedFilter = this.ctx.createBiquadFilter();
        reedFilter.type = 'bandpass';
        reedFilter.frequency.setValueAtTime(freq * 1.6, now);
        reedFilter.Q.setValueAtTime(2.2, now);

        osc.connect(reedFilter);
        reedFilter.connect(chordGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    });
  }

  /**
   * Starts French Parisian 3/4 Waltz Rhythm (塞纳河华尔兹: 咚-哒-哒)
   */
  startParisianWaltz() {
    this.stopAllDronesAndRhythms();
    const chordProgression = [
      { bass: 110, chord: [220, 261.63, 329.63] }, // Am
      { bass: 146.83, chord: [220, 293.66, 349.23] }, // Dm
      { bass: 164.81, chord: [246.94, 329.63, 415.3] }, // E7
      { bass: 110, chord: [220, 261.63, 329.63] }  // Am
    ];
    let progIdx = 0;
    const tempo = 620; // ms per beat (approx 96 bpm)

    const runWaltzBar = () => {
      const currentBar = chordProgression[progIdx];
      // Beat 1: Bass note
      this.playAccordionChord([currentBar.bass], 1.2, false);

      // Beat 2: Upbeat chord 1
      setTimeout(() => {
        this.playAccordionChord(currentBar.chord, 0.7, true);
      }, tempo);

      // Beat 3: Upbeat chord 2
      setTimeout(() => {
        this.playAccordionChord(currentBar.chord, 0.7, true);
      }, tempo * 2);

      progIdx = (progIdx + 1) % chordProgression.length;
      this.activeWaltzHandle = setTimeout(runWaltzBar, tempo * 3 + (Math.random() - 0.5) * 60);
    };

    runWaltzBar();
  }

  /* ============================================================
     4. 🇮🇳 INDIA: Sitar with Javari Bridge Buzz & Tanpura Drone
     ============================================================ */

  /**
   * Sitar Note with authentic Javari flat-bridge buzzing harmonics and Meend glide
   */
  playSitarNote(freq, duration = 3.8, isMeend = false) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const fundamental = this.ctx.createOscillator();
    fundamental.type = 'sawtooth';

    // Meend (Indian microtonal pitch glide up)
    if (isMeend) {
      fundamental.frequency.setValueAtTime(freq * 0.89, now);
      fundamental.frequency.exponentialRampToValueAtTime(freq, now + 0.35);
    } else {
      fundamental.frequency.setValueAtTime(freq, now);
    }

    // Javari flat bridge buzzing overtone
    const javariBuzz = this.ctx.createOscillator();
    javariBuzz.type = 'sawtooth';
    javariBuzz.frequency.setValueAtTime(freq * 3, now);

    const javariFilter = this.ctx.createBiquadFilter();
    javariFilter.type = 'peaking';
    javariFilter.frequency.setValueAtTime(3200, now);
    javariFilter.gain.setValueAtTime(14, now);
    javariFilter.Q.setValueAtTime(4.0, now);

    const sitarGain = this.ctx.createGain();
    sitarGain.gain.setValueAtTime(0.0001, now);
    sitarGain.gain.linearRampToValueAtTime(0.3, now + 0.012); // Plectrum mizrab strike
    sitarGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    fundamental.connect(javariFilter);
    javariBuzz.connect(javariFilter);
    javariFilter.connect(sitarGain);
    sitarGain.connect(this.gainNode);

    fundamental.start(now);
    javariBuzz.start(now);

    fundamental.stop(now + duration + 0.1);
    javariBuzz.stop(now + duration + 0.1);
  }

  /**
   * Starts Indian Tanpura 4-String Hypnotic Cycle (Pa - Sa - Sa - Sa)
   */
  startTanpuraDrone(rootFreq = 130.81) { // C3
    this.stopAllDronesAndRhythms();
    // Pa (5th), Sa (root high), Sa (root high), Sa (root low)
    const strings = [rootFreq * 1.5, rootFreq * 2, rootFreq * 2, rootFreq];
    let stringIdx = 0;

    const pluckTanpuraString = () => {
      const f = strings[stringIdx];
      this.playSitarNote(f, 3.6, false);
      stringIdx = (stringIdx + 1) % strings.length;
      this.activeTanpuraHandle = setTimeout(pluckTanpuraString, 1200);
    };

    pluckTanpuraString();
  }

  /* ============================================================
     5. 🇮🇸 ICELAND: Ethereal Neoclassical Bowed Piano / Glacial Drone
     ============================================================ */
  startGlacialDrone(rootFreq = 65.41) {
    this.stopAllDronesAndRhythms();
    this.ensureContext();
    const now = this.ctx.currentTime;

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(0.18, now + 4.0);
    droneGain.connect(this.gainNode);

    // Detuned cold sub-bass + shimmer
    [rootFreq, rootFreq * 1.006, rootFreq * 1.5, rootFreq * 2].forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(320, now);
      lp.Q.setValueAtTime(3.0, now);

      osc.connect(lp);
      lp.connect(droneGain);
      osc.start(now);
      this.activeDroneNodes.push(osc, lp);
    });
    this.activeDroneNodes.push(droneGain);
  }

  /* ============================================================
     6. 🇮🇪 IRELAND: Celtic Harp (竖琴滚奏琶音)
     ============================================================ */
  playCelticHarpArpeggio(notes) {
    this.ensureContext();
    notes.forEach((freq, idx) => {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.24, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(g);
        osc2.connect(g);
        g.connect(this.gainNode);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 3.3);
        osc2.stop(now + 3.3);
      }, idx * 110));
    });
  }

  /* ============================================================
     7. 🇧🇷 BRAZIL: Bossa Nova Nylon Guitar Chords
     ============================================================ */
  playBossaNovaChord(chordNotes) {
    this.ensureContext();
    chordNotes.forEach((freq, idx) => {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const bodyFilter = this.ctx.createBiquadFilter();
        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(1400, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(bodyFilter);
        bodyFilter.connect(g);
        g.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + 1.9);
      }, idx * 25));
    });
  }

  /* ============================================================
     8. Resonant Ancient Temple Bronze Bell (古刹大钟)
     ============================================================ */
  playBronzeTempleBell(freq = 110, duration = 10.0) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const ratios = [1.0, 2.01, 3.12, 4.45, 6.2];
    const amps = [0.35, 0.22, 0.12, 0.06, 0.02];

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    ratios.forEach((r, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * r + (Math.random() - 0.5) * 2, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(amps[idx], now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration / (1 + idx * 0.7));

      osc.connect(g);
      g.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.2);
    });

    masterGain.connect(this.gainNode);
  }

  /* ============================================================
   9. 🇩🇪 GERMANY: Bach Masterpiece Solo Cello (巴赫大提琴琴弦摩擦与木质共鸣箱)
   ============================================================ */
  playCelloNote(freq, duration = 4.2) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Rich bowed string sawtooth with warmth
    const stringOsc = this.ctx.createOscillator();
    stringOsc.type = 'sawtooth';
    stringOsc.frequency.setValueAtTime(freq, now);

    // Warm deep sub-fundamental
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, now);

    // Expressive human cello vibrato (每秒 5.2Hz 柔和揉弦)
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.2, now);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(freq * 0.015, now);
    vibrato.connect(vibGain);
    vibGain.connect(stringOsc.frequency);

    // Spruce wood soundboard body resonances (大提琴木质琴箱共鸣峰)
    const bodyFilter1 = this.ctx.createBiquadFilter();
    bodyFilter1.type = 'bandpass';
    bodyFilter1.frequency.setValueAtTime(250, now);
    bodyFilter1.Q.setValueAtTime(3.0, now);

    const bodyFilter2 = this.ctx.createBiquadFilter();
    bodyFilter2.type = 'lowpass';
    bodyFilter2.frequency.setValueAtTime(1600, now);

    // Bowing attack envelope (琴弓由轻至实拉动)
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.32, now + 0.35); // Slow bow bite
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    stringOsc.connect(bodyFilter1);
    subOsc.connect(bodyFilter1);
    bodyFilter1.connect(bodyFilter2);
    bodyFilter2.connect(noteGain);
    noteGain.connect(this.gainNode);

    vibrato.start(now);
    stringOsc.start(now);
    subOsc.start(now);

    vibrato.stop(now + duration + 0.1);
    stringOsc.stop(now + duration + 0.1);
    subOsc.stop(now + duration + 0.1);
  }

  /* ============================================================
     10. 🇺🇸 USA: Mississippi Delta Blues Guitar Slide (三角洲滑棒吉他与布鲁斯滑音)
     ============================================================ */
  playBluesGuitarSlide(freq, duration = 3.2, isSlide = true) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';

    if (isSlide) {
      // Iconic quarter-tone microtonal blues bend (蓝调微度弯音)
      osc.frequency.setValueAtTime(freq * 0.94, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.22);
    } else {
      osc.frequency.setValueAtTime(freq, now);
    }

    // Steel string brass resonator bite (全金属琴弦亮泽)
    const steelFilter = this.ctx.createBiquadFilter();
    steelFilter.type = 'peaking';
    steelFilter.frequency.setValueAtTime(2200, now);
    steelFilter.gain.setValueAtTime(6.0, now);
    steelFilter.Q.setValueAtTime(2.5, now);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.28, now + 0.012); // Plectrum attack
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(steelFilter);
    steelFilter.connect(noteGain);
    noteGain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  /* ============================================================
     11. 🇬🇷 GREECE: Aegean Bouzouki Double-String Tremolo (爱琴海双弦布祖基琴轮指)
     ============================================================ */
  playBouzoukiTremolo(freq, duration = 2.4) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Dual paired steel strings slightly detuned (布祖基特有复弦混响)
    [-3.0, 3.0].forEach((detuneVal, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneVal, now);

      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(freq * 2.2, now);
      f.Q.setValueAtTime(2.0, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.2, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(f);
      f.connect(g);
      g.connect(this.gainNode);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  /* ============================================================
     12. 🇳🇴 NORWAY: Hardanger Fiddle Sympathetic Resonance (哈当厄尔小提琴底弦共鸣)
     ============================================================ */
  playHardangerFiddle(freq, duration = 4.0) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const melodyOsc = this.ctx.createOscillator();
    melodyOsc.type = 'sawtooth';
    melodyOsc.frequency.setValueAtTime(freq, now);

    // Sympathetic understrings drone (挪威国宝小提琴 4根共鸣底弦空灵泛音)
    const sympatheticOsc = this.ctx.createOscillator();
    sympatheticOsc.type = 'sine';
    sympatheticOsc.frequency.setValueAtTime(freq * 0.5, now);

    const fiddleFilter = this.ctx.createBiquadFilter();
    fiddleFilter.type = 'bandpass';
    fiddleFilter.frequency.setValueAtTime(1200, now);
    fiddleFilter.Q.setValueAtTime(2.2, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.25, now + 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    melodyOsc.connect(fiddleFilter);
    sympatheticOsc.connect(fiddleFilter);
    fiddleFilter.connect(g);
    g.connect(this.gainNode);

    melodyOsc.start(now);
    sympatheticOsc.start(now);
    melodyOsc.stop(now + duration + 0.1);
    sympatheticOsc.stop(now + duration + 0.1);
  }

  /* ============================================================
     13. 🇪🇬 EGYPT & MOROCCO: Ancient Reed Nay Flute (尼罗河与撒哈拉长笛乃伊)
     ============================================================ */
  playArabicNayFlute(freq, duration = 4.2) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    // Characteristic Middle Eastern microtonal slide
    osc.frequency.setValueAtTime(freq * 0.96, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.3);

    // Ancient reed turbulence
    const breathSize = this.ctx.sampleRate * 1.0;
    const breathBuffer = this.ctx.createBuffer(1, breathSize, this.ctx.sampleRate);
    const bData = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathSize; i++) {
      bData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }
    const breathSrc = this.ctx.createBufferSource();
    breathSrc.buffer = breathBuffer;

    const bFilter = this.ctx.createBiquadFilter();
    bFilter.type = 'bandpass';
    bFilter.frequency.setValueAtTime(1800, now);
    bFilter.Q.setValueAtTime(4.0, now);

    const bGain = this.ctx.createGain();
    bGain.gain.setValueAtTime(0.12, now);
    bGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    breathSrc.connect(bFilter);
    bFilter.connect(bGain);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.24, now + 0.3);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(mainGain);
    bGain.connect(mainGain);
    mainGain.connect(this.gainNode);

    osc.start(now);
    breathSrc.start(now);
    osc.stop(now + duration + 0.1);
    this.registerVoice(osc, mainGain);
  }

  /* ============================================================
     14. 🇨🇳 CHINA: Pipa Rapid Tremolo / Finger Roll (琵琶轮指/滚指)
     ============================================================ */
  playPipaTremolo(freq, count = 5) {
    this.ensureContext();
    const step = 42; // ms between finger strikes
    for (let i = 0; i < count; i++) {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        // Sharp silk string plectrum attack filter
        const silkFilter = this.ctx.createBiquadFilter();
        silkFilter.type = 'bandpass';
        silkFilter.frequency.setValueAtTime(2200, now);
        silkFilter.Q.setValueAtTime(3.2, now);

        const g = this.ctx.createGain();
        const vel = 0.22 + 0.08 * Math.sin((i / count) * Math.PI);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(vel, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(silkFilter);
        silkFilter.connect(g);
        g.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + 0.5);
        this.registerVoice(osc, g);
      }, i * step));
    }
  }

  /* ============================================================
     15. 🇮🇳 INDIA & 🇯🇵 JAPAN: Tibetan / Zen Singing Bowl (颂钵深层身心共振)
     ============================================================ */
  playSingingBowl(freq = 216, duration = 8.5) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Dual micro-detuned sine waves produce gentle acoustic beating (舒缓脑波差频)
    const bowlMaster = this.ctx.createGain();
    bowlMaster.gain.setValueAtTime(0.001, now);
    bowlMaster.gain.linearRampToValueAtTime(0.32, now + 0.1);
    bowlMaster.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    bowlMaster.connect(this.gainNode);

    [0, 1.8, freq * 2.76, freq * 5.4].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx < 2 ? (freq + (idx === 1 ? 1.8 : 0)) : offset, now);

      const partialGain = this.ctx.createGain();
      const amp = idx < 2 ? 0.35 : (0.12 / idx);
      partialGain.gain.setValueAtTime(amp, now);
      partialGain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (1 + idx * 0.5));

      osc.connect(partialGain);
      partialGain.connect(bowlMaster);

      osc.start(now);
      osc.stop(now + duration + 0.2);
      this.registerVoice(osc, partialGain);
    });
  }

  /* ============================================================
     16. 🇯🇵 JAPAN: Wind Chimes (京都古寺风铃/玻璃铜铃清响)
     ============================================================ */
  playWindChimes() {
    this.ensureContext();
    const chimePitches = [1760, 1975.5, 2349.3, 2637.0, 3135.96]; // High pentatonic chimes
    const strikes = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < strikes; i++) {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const pitch = chimePitches[Math.floor(Math.random() * chimePitches.length)];
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(g);
        g.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + 2.9);
        this.registerVoice(osc, g);
      }, i * (120 + Math.random() * 150)));
    }
  }

  /* ============================================================
     17. 🇪🇬 EGYPT: Arabic Qanun Cascading Zither (东方卡龙琴琶音)
     ============================================================ */
  playQanunArpeggio(notes) {
    this.ensureContext();
    const step = 55;
    notes.forEach((freq, idx) => {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.002, now); // Dual string chorus

        const qanunFilter = this.ctx.createBiquadFilter();
        qanunFilter.type = 'bandpass';
        qanunFilter.frequency.setValueAtTime(1800, now);
        qanunFilter.Q.setValueAtTime(2.8, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.24, now + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc1.connect(qanunFilter);
        osc2.connect(qanunFilter);
        qanunFilter.connect(g);
        g.connect(this.gainNode);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.9);
        osc2.stop(now + 1.9);
        this.registerVoice(osc1, g);
        this.registerVoice(osc2, g);
      }, idx * step));
    });
  }

  /* ============================================================
     18. 🇺🇸 USA: Native American Cedar Wood Flute (大峡谷印第安长笛)
     ============================================================ */
  playNativeAmericanFlute(freq, duration = 4.0) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 0.96, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.22); // Traditional portamento rise

    // Octave undertone chamber resonance
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.5, now);

    // Cedar wood breath warmth
    const breathSize = Math.floor(this.ctx.sampleRate * 0.8);
    const breathBuf = this.ctx.createBuffer(1, breathSize, this.ctx.sampleRate);
    const bData = breathBuf.getChannelData(0);
    for (let i = 0; i < breathSize; i++) bData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    const breathSrc = this.ctx.createBufferSource();
    breathSrc.buffer = breathBuf;

    const bFilter = this.ctx.createBiquadFilter();
    bFilter.type = 'bandpass';
    bFilter.frequency.setValueAtTime(freq * 1.5, now);
    bFilter.Q.setValueAtTime(4.0, now);

    const bGain = this.ctx.createGain();
    bGain.gain.setValueAtTime(0.08, now);
    bGain.gain.exponentialRampToValueAtTime(0.005, now + 1.0);
    breathSrc.connect(bFilter);
    bFilter.connect(bGain);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.26, now + 0.35);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(mainGain);
    sub.connect(mainGain);
    bGain.connect(mainGain);
    mainGain.connect(this.gainNode);

    osc.start(now);
    sub.start(now);
    breathSrc.start(now);

    osc.stop(now + duration + 0.1);
    sub.stop(now + duration + 0.1);
    this.registerVoice(osc, mainGain);
    this.registerVoice(sub, mainGain);
  }

  /* ============================================================
     19. 🇮🇸 ICELAND & 🇩🇪 GERMANY: Neoclassical Felt Piano (柔毡静谧立式钢琴)
     ============================================================ */
  playFeltPianoNote(freq, duration = 3.6) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.003, now);

    // Muffled warm felt hammer lowpass filter
    const feltFilter = this.ctx.createBiquadFilter();
    feltFilter.type = 'lowpass';
    feltFilter.frequency.setValueAtTime(780, now);
    feltFilter.frequency.exponentialRampToValueAtTime(320, now + duration * 0.8);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.018); // Soft felt hammer strike
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(feltFilter);
    osc2.connect(feltFilter);
    feltFilter.connect(g);
    g.connect(this.gainNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    this.registerVoice(osc1, g);
    this.registerVoice(osc2, g);
  }

  /* ============================================================
     20. 🇬🇧 SCOTLAND: Highland Bagpipe Drone & Chanter (苏格兰高地风笛长调)
     ============================================================ */
  playBagpipeDroneAndChanter(chanterFreq, droneFreq = 116.54) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // 1. Continuous Highland drone (Bb2 and Bb3)
    const droneOsc1 = this.ctx.createOscillator();
    const droneOsc2 = this.ctx.createOscillator();
    droneOsc1.type = 'sawtooth';
    droneOsc2.type = 'sawtooth';
    droneOsc1.frequency.setValueAtTime(droneFreq, now);
    droneOsc2.frequency.setValueAtTime(droneFreq * 2, now);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'bandpass';
    droneFilter.frequency.setValueAtTime(350, now);
    droneFilter.Q.setValueAtTime(1.8, now);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(0.16, now + 0.5);
    droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.gainNode);

    droneOsc1.start(now);
    droneOsc2.start(now);
    droneOsc1.stop(now + 3.9);
    droneOsc2.stop(now + 3.9);
    this.registerVoice(droneOsc1, droneGain);
    this.registerVoice(droneOsc2, droneGain);

    // 2. Piercing double-reed chanter melody
    const chanterOsc = this.ctx.createOscillator();
    chanterOsc.type = 'square';
    chanterOsc.frequency.setValueAtTime(chanterFreq, now);

    const chanterFilter = this.ctx.createBiquadFilter();
    chanterFilter.type = 'bandpass';
    chanterFilter.frequency.setValueAtTime(chanterFreq * 2.2, now);
    chanterFilter.Q.setValueAtTime(3.5, now);

    const chanterGain = this.ctx.createGain();
    chanterGain.gain.setValueAtTime(0.001, now);
    chanterGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    chanterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    chanterOsc.connect(chanterFilter);
    chanterFilter.connect(chanterGain);
    chanterGain.connect(this.gainNode);

    chanterOsc.start(now);
    chanterOsc.stop(now + 3.3);
    this.registerVoice(chanterOsc, chanterGain);
  }

  /* ============================================================
     21. 🇪🇸 SPAIN: Flamenco Rasgueado (弗拉门戈指背扫弦)
     ============================================================ */
  playFlamencoRasgueado(chordNotes) {
    this.ensureContext();
    const strumCount = 4; // 4 rapid finger flick passes (e-a-m-i)
    for (let s = 0; s < strumCount; s++) {
      this.registerTimer(setTimeout(() => {
        chordNotes.forEach((freq, idx) => {
          this.registerTimer(setTimeout(() => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            const guitarBody = this.ctx.createBiquadFilter();
            guitarBody.type = 'bandpass';
            guitarBody.frequency.setValueAtTime(1200, now);
            guitarBody.Q.setValueAtTime(2.0, now);

            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.22, now + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

            osc.connect(guitarBody);
            guitarBody.connect(g);
            g.connect(this.gainNode);

            osc.start(now);
            osc.stop(now + 1.3);
            this.registerVoice(osc, g);
          }, idx * 18));
        });
      }, s * 70));
    }
  }

  /* ============================================================
     22. 🇮🇹 ITALY: Mandolin Fast Double Tremolo (威尼斯曼陀铃双拨清颤)
     ============================================================ */
  playMandolinTremolo(freq, duration = 1.8) {
    this.ensureContext();
    const strokes = Math.floor(duration * 12); // ~12 rapid tremolo strokes per second
    const strokeDelay = (duration * 1000) / strokes;

    for (let i = 0; i < strokes; i++) {
      this.registerTimer(setTimeout(() => {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'triangle';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, now);
        osc2.frequency.setValueAtTime(freq * 1.003, now); // Dual steel strings

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.Q.setValueAtTime(2.2, now);

        const g = this.ctx.createGain();
        const envelope = Math.exp(-i / (strokes * 0.7));
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.18 * envelope, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);
        g.connect(this.gainNode);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.14);
        osc2.stop(now + 0.14);
        this.registerVoice(osc1, g);
        this.registerVoice(osc2, g);
      }, i * strokeDelay));
    }
  }

  /* ============================================================
     23. 🇺🇸 USA: Delta Blues Harmonica Bend (密西西比蓝调口琴弯音)
     ============================================================ */
  playHarmonicaNote(freq, duration = 2.8) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const reed1 = this.ctx.createOscillator();
    const reed2 = this.ctx.createOscillator();
    reed1.type = 'sawtooth';
    reed2.type = 'square';

    // Blues draw bend: starts lower, bends into pitch, then drops
    reed1.frequency.setValueAtTime(freq * 0.92, now);
    reed1.frequency.exponentialRampToValueAtTime(freq, now + 0.28);
    reed1.frequency.exponentialRampToValueAtTime(freq * 0.95, now + duration * 0.8);

    reed2.frequency.setValueAtTime(freq * 1.002, now);

    const reedFilter = this.ctx.createBiquadFilter();
    reedFilter.type = 'bandpass';
    reedFilter.frequency.setValueAtTime(freq * 2.2, now);
    reedFilter.Q.setValueAtTime(2.8, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    reed1.connect(reedFilter);
    reed2.connect(reedFilter);
    reedFilter.connect(g);
    g.connect(this.gainNode);

    reed1.start(now);
    reed2.start(now);
    reed1.stop(now + duration + 0.1);
    reed2.stop(now + duration + 0.1);
    this.registerVoice(reed1, g);
    this.registerVoice(reed2, g);
  }
}

