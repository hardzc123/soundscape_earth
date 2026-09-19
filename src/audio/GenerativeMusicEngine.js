/**
 * GenerativeMusicEngine.js
 * Generates distinct cultural melodies and specific masterpiece motifs for all world countries.
 * Every single track mode has a dedicated, instantly recognizable acoustic signature.
 */

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class GenerativeMusicEngine {
  constructor(engine, instrumentSynth) {
    this.engine = engine;
    this.synth = instrumentSynth;
    this.currentMode = 'china_gaoshan';
    this.isPlaying = false;
    this.phraseTimer = null;
    this.volume = 0.75;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.synth) {
      this.synth.setVolume(this.volume);
    }
  }

  play(mode = this.currentMode) {
    this.currentMode = mode;
    this.isPlaying = true;
    this.synth.stopAllDronesAndRhythms();

    if (this.phraseTimer) {
      clearTimeout(this.phraseTimer);
      this.phraseTimer = null;
    }

    // Immediately trigger instant cultural motif on track switch
    this.runLoop(true);
  }

  stop() {
    this.isPlaying = false;
    if (this.phraseTimer) {
      clearTimeout(this.phraseTimer);
      this.phraseTimer = null;
    }
    this.synth.stopAllDronesAndRhythms();
  }

  runLoop(isImmediate = false) {
    if (!this.isPlaying) return;

    const mode = this.currentMode;
    let delay = isImmediate ? 2800 : (3200 + Math.random() * 2000);

    /* ============================================================
       1. 🇨🇳 CHINA (中国)
       ============================================================ */
    if (mode.startsWith('china')) {
      const pentatonic = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81].map(midiToFreq);
      const lowPentatonic = [48, 50, 52, 55, 57, 60, 62].map(midiToFreq);

      if (mode === 'china_gaoshan') {
        // 《高山流水》Cascading Guzheng glissando sweep across strings
        this.synth.playGuzhengGlissando(pentatonic.slice(1, 8), Math.random() > 0.35);
        delay = 3400;
      } else if (mode === 'china_meihua') {
        // 《梅花三弄》Lyrical bamboo flute / Xiao solo with breath & vibrato
        const f = pentatonic[Math.floor(Math.random() * 5) + 2];
        this.synth.playChineseFlute(f, 4.2);
        delay = 4000;
      } else if (mode === 'china_sizhu') {
        // 《江南丝竹》Brisk tea-house pentatonic pluck sequence
        const phrase = [pentatonic[3], pentatonic[4], pentatonic[2], pentatonic[5]];
        phrase.forEach((note, idx) => {
          this.synth.registerTimer(setTimeout(() => {
            if (this.isPlaying) this.synth.playGuzhengNote(note, 2.2, 0.75);
          }, idx * 280));
        });
        delay = 3000;
      } else if (mode === 'china_pingsha') {
        // 《平沙落雁》Low Guqin pitch-bending ancient modal slide
        const note = lowPentatonic[Math.floor(Math.random() * lowPentatonic.length)];
        this.synth.playGuzhengNote(note, 4.0, 0.85);
        delay = 3800;
      } else if (mode === 'china_chunjiang') {
        // 《春江花月夜》Pipa tremolo / rapid plucking harmonics
        const note = pentatonic[Math.floor(Math.random() * 5) + 3];
        this.synth.playPipaTremolo(note, 5);
        delay = 2800;
      } else if (mode === 'china_gusu') {
        // 《姑苏行》Bright Kunqu jade flute melody
        const fluteNotes = [pentatonic[4], pentatonic[5], pentatonic[6]];
        const f = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];
        this.synth.playChineseFlute(f, 3.8);
        delay = 3600;
      } else if (mode === 'china_yuzhou') {
        // 《渔舟唱晚》Sunset Guzheng melodic phrase with expressive bends
        const f = pentatonic[Math.floor(Math.random() * 6) + 1];
        this.synth.playGuzhengNote(f, 3.0, 0.8);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playGuzhengNote(f * 1.125, 2.6, 0.65);
        }, 320));
        delay = 3400;
      } else if (mode === 'china_hanshan') {
        // 《寒山晨钟》Deep resonant Bronze Temple Bell with 8s lingering wash
        this.synth.playBronzeTempleBell(108, 9.0);
        delay = 5500;
      } else {
        const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        this.synth.playGuzhengNote(note, 3.2, 0.75);
      }
    }

    /* ============================================================
       2. 🇯🇵 JAPAN (日本)
       ============================================================ */
    else if (mode.startsWith('japan')) {
      const hirajoshi = [62, 63, 67, 69, 70, 74, 75, 79].map(midiToFreq);

      if (mode === 'japan_harunoumi' || mode === 'japan_rokudan') {
        // 《春之海》《六段之调》Koto Hirajoshi classical phrases
        const phrase = [hirajoshi[5], hirajoshi[6], hirajoshi[5], hirajoshi[4], hirajoshi[3]];
        phrase.forEach((freq, idx) => {
          this.synth.registerTimer(setTimeout(() => {
            if (this.isPlaying) this.synth.playGuzhengNote(freq, 2.8, 0.7);
          }, idx * 420));
        });
        delay = 3800;
      } else if (mode === 'japan_moon') {
        // 《荒城之月》Haunting solo Shakuhachi flute
        this.synth.playShakuhachi(hirajoshi[2], 4.5);
        delay = 4200;
      } else if (mode === 'japan_zen') {
        // 《禅院添水》Shishi-odoshi bamboo clack & resonant bell
        this.synth.playShishiOdoshi();
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playBronzeTempleBell(175, 5.0);
        }, 500));
        delay = 3600;
      } else if (mode === 'japan_furin') {
        // 《古都风铃》Crystalline Kyoto wind chimes tinkling in breeze
        this.synth.playWindChimes();
        delay = 3200;
      } else if (mode === 'japan_snow') {
        // 《残雪之夜》Low Kyorei meditative Shakuhachi
        this.synth.playShakuhachi(hirajoshi[0] * 0.5, 5.0);
        delay = 4500;
      } else if (mode === 'japan_chidori') {
        // 《千鸟之曲》Koto rapid water ripple glissando imitating plovers
        this.synth.playGuzhengGlissando(hirajoshi.slice(1, 7), true);
        delay = 3200;
      } else if (mode === 'japan_genji') {
        // 《源氏物语之韵》Heian court Gagaku Koto ancient imperial cadence
        const note = hirajoshi[Math.floor(Math.random() * hirajoshi.length)];
        this.synth.playGuzhengNote(note, 4.0, 0.75);
        delay = 3600;
      } else if (mode === 'japan_ryoanji') {
        // 《龙安寺石庭》Ryoan-ji rock garden minimalist singing bowl & bamboo strike
        this.synth.playSingingBowl(216, 7.5);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playShishiOdoshi();
        }, 1200));
        delay = 5000;
      } else {
        this.synth.playShishiOdoshi();
      }
    }

    /* ============================================================
       3. 🇫🇷 FRANCE (法国)
       ============================================================ */
    else if (mode.startsWith('france')) {
      const chords = [
        [220, 261.63, 329.63], // Am
        [174.61, 220, 261.63], // F
        [196, 246.94, 293.66], // G
        [130.81, 164.81, 196]  // C
      ];

      if (mode === 'france_montmartre' || mode === 'france_twilight') {
        // 《蒙马特小夜曲》Parisian 3/4 musette waltz accordion bass-chord-chord
        const ch = chords[Math.floor(Math.random() * chords.length)];
        this.synth.playAccordionChord([ch[0] * 0.5], 1.2, false);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playAccordionChord(ch, 0.7, true);
        }, 360));
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playAccordionChord(ch, 0.7, true);
        }, 720));
        delay = 2800;
      } else if (mode === 'france_louvre') {
        // 《卢浮宫月色》Impressionist felt piano nocturne in Louvre
        const notes = [261.63, 329.63, 392.0, 493.88, 523.25];
        const f = notes[Math.floor(Math.random() * notes.length)];
        this.synth.playFeltPianoNote(f, 3.8);
        delay = 3400;
      } else if (mode === 'france_giverny') {
        // 《雨中吉维尼》Monet's garden impressionist pad & warm bellows swell
        const ch = [196, 246.94, 293.66, 349.23];
        this.synth.playAccordionChord(ch, 2.8, false);
        delay = 3800;
      } else {
        // Romantic Left Bank accordion swell
        const ch = chords[Math.floor(Math.random() * chords.length)];
        this.synth.playAccordionChord(ch, 2.0, Math.random() > 0.5);
        delay = 3200;
      }
    }

    /* ============================================================
       4. 🇪🇸 SPAIN (西班牙)
       ============================================================ */
    else if (mode.startsWith('spain')) {
      const phrygian = [52, 53, 55, 57, 59, 60, 62, 64, 65, 67].map(midiToFreq);

      if (mode === 'spain_asturias') {
        // 《阿斯图里亚斯之传奇》Asturias rapid flamenco rasgueado
        const chord = [phrygian[0], phrygian[2], phrygian[4], phrygian[7]];
        this.synth.playFlamencoRasgueado(chord);
        delay = 2600;
      } else if (mode === 'spain_romance') {
        // 《爱的罗曼史》Romance de Amor nylon guitar slow arpeggio
        const phrase = [phrygian[7], phrygian[4], phrygian[2], phrygian[7]];
        phrase.forEach((note, idx) => {
          this.synth.registerTimer(setTimeout(() => {
            if (this.isPlaying) this.synth.playGuzhengNote(note, 2.5, 0.7);
          }, idx * 300));
        });
        delay = 3400;
      } else if (mode === 'spain_sevilla' || mode === 'spain_granada') {
        // 《塞维利亚小夜曲》《格拉纳达暮色》Andalusian cadence
        const f = phrygian[Math.floor(Math.random() * phrygian.length)];
        this.synth.playGuzhengNote(f, 2.2, 0.85);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playGuzhengNote(f * 1.059, 2.4, 0.7); // Phrygian semitone
        }, 220));
        delay = 3000;
      } else {
        const f = phrygian[Math.floor(Math.random() * phrygian.length)];
        this.synth.playGuzhengNote(f, 2.2, 0.8);
        delay = 3200;
      }
    }

    /* ============================================================
       5. 🇮🇹 ITALY (意大利)
       ============================================================ */
    else if (mode.startsWith('italy')) {
      const italNotes = [55, 59, 60, 62, 64, 67, 69, 72].map(midiToFreq);

      if (mode === 'italy_tuscany' || mode === 'italy_sorrento' || mode === 'italy_barcarolle') {
        // 《托斯卡纳艳阳田园》《重归苏莲托》Bright mandolin double tremolo
        const f = italNotes[Math.floor(Math.random() * (italNotes.length - 2)) + 1];
        this.synth.playMandolinTremolo(f, 1.8);
        delay = 2800;
      } else if (mode === 'italy_renaissance') {
        // 《佛罗伦萨文艺复兴小调》Lute modal arpeggio
        const phrase = [italNotes[0], italNotes[2], italNotes[4], italNotes[6]];
        phrase.forEach((note, idx) => {
          this.synth.registerTimer(setTimeout(() => {
            if (this.isPlaying) this.synth.playGuzhengNote(note, 2.2, 0.7);
          }, idx * 220));
        });
        delay = 3200;
      } else {
        const f = italNotes[Math.floor(Math.random() * italNotes.length)];
        this.synth.playGuzhengNote(f, 1.6, 0.7);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playGuzhengNote(f, 1.8, 0.75);
        }, 110));
        delay = 2900;
      }
    }

    /* ============================================================
       6. 🇬🇧 SCOTLAND (苏格兰)
       ============================================================ */
    else if (mode.startsWith('scotland')) {
      const bagpipeNotes = [466.16, 523.25, 587.33, 622.25, 698.46, 783.99]; // Bb Mixolydian

      if (mode === 'scotland_brave' || mode === 'scotland_auld' || mode === 'scotland_hebrides') {
        // 《苏格兰勇士》《友谊地久天长》Highland bagpipe drone & chanter anthem
        const chanterNote = bagpipeNotes[Math.floor(Math.random() * bagpipeNotes.length)];
        this.synth.playBagpipeDroneAndChanter(chanterNote, 116.54);
        delay = 3800;
      } else if (mode === 'scotland_castle') {
        // 《爱丁堡雨雾古堡》Celtic tin whistle
        const f = bagpipeNotes[Math.floor(Math.random() * bagpipeNotes.length)];
        this.synth.playChineseFlute(f, 3.5);
        delay = 3400;
      } else {
        const dorian = [50, 53, 57, 60, 62, 64, 65, 69, 72].map(midiToFreq);
        this.synth.playCelticHarpArpeggio([dorian[0], dorian[2], dorian[4], dorian[6]]);
        delay = 3500;
      }
    }

    /* ============================================================
       7. 🇮🇸 ICELAND (冰岛)
       ============================================================ */
    /* ============================================================
       7. 🇮🇸 ICELAND (冰岛 - 30首母带声景极光矩阵)
       ============================================================ */
    else if (mode.startsWith('iceland')) {
      const ambient = [48, 55, 58, 62, 65, 67, 70, 74].map(midiToFreq);
      const feltNotes = [130.81, 164.81, 196.0, 246.94, 261.63, 293.66, 329.63, 392.0];

      if (mode === 'iceland_cave' || mode === 'iceland_sun' || mode === 'iceland_akureyri') {
        // 《瓦特纳冰川洞穴》《雷克雅未克午夜阳光》《阿克雷里午夜雪原》Minimalist felt piano
        const f = feltNotes[Math.floor(Math.random() * feltNotes.length)];
        this.synth.playFeltPianoNote(f, 4.2);
        delay = 3400;
      } else if (mode === 'iceland_melt' || mode === 'iceland_diamonds' || mode === 'iceland_jokulsarlon') {
        // 《冰川融滴回响》《杰古沙龙钻石沙滩》《冰河湖静止浮冰》Crystalline ice chime pings
        this.synth.playWindChimes();
        delay = 3200;
      } else if (mode === 'iceland_church') {
        // 《哈尔格林姆教堂管风琴》Majestic basalt column cathedral resonance
        this.synth.playCelloNote(65.41, 5.5); // C2 low pipe
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playCelloNote(130.81, 4.5); // C3
        }, 120));
        delay = 4200;
      } else if (mode === 'iceland_whale') {
        // 《胡萨维克观鲸之歌》Deep Atlantic oceanic whale song resonance
        this.synth.playSingingBowl(144, 8.5);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playCelloNote(73.42, 6.0); // D2
        }, 300));
        delay = 4800;
      } else if (mode === 'iceland_aurora' || mode === 'iceland_aurorawaltz') {
        // 《北方极光之舞》《瓦特纳极光圆舞曲》Shimmering high celestial harmonics
        const f = ambient[Math.floor(Math.random() * (ambient.length - 2)) + 2];
        this.synth.playGuzhengNote(f * 2, 3.5, 0.45);
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playCelloNote(f * 0.5, 4.5);
        }, 180));
        delay = 3600;
      } else if (mode === 'iceland_skogafoss' || mode === 'iceland_dettifoss' || mode === 'iceland_thingvellir') {
        // 《斯科加瀑布轰鸣》《黛提瀑布灰烬》《辛格维利尔大裂谷》Massive sub rumble & glacial cascade
        this.synth.playCelloNote(48.99, 6.5); // Low G1 sub
        this.synth.registerTimer(setTimeout(() => {
          if (this.isPlaying) this.synth.playCelloNote(98.0, 5.0);
        }, 220));
        delay = 4500;
      } else if (mode === 'iceland_seljalandsfoss' || mode === 'iceland_pony' || mode === 'iceland_westfjords') {
        // 《塞里雅兰水帘洞》《冰岛小马原野》《西峡湾苔原》Flowing water & grassy meadow plucks
        const harp = [ambient[1], ambient[2], ambient[4], ambient[6]];
        this.synth.playCelticHarpArpeggio(harp);
        delay = 3400;
      } else if (mode === 'iceland_bluelagoon' || mode === 'iceland_geysir' || mode === 'iceland_landmanna') {
        // 《蓝湖地热晨雾》《地热喷泉》《兰曼纳劳卡彩虹山》Warm mineral steam pad
        this.synth.playSingingBowl(216, 7.0);
        delay = 4200;
      } else if (mode === 'iceland_lava' || mode === 'iceland_eyjafjall' || mode === 'iceland_westman') {
        // 《熔岩荒原之夜》《埃亚菲亚德拉火山灰》Bowed cello / volcanic resonance
        const f = ambient[Math.floor(Math.random() * 4)];
        this.synth.playCelloNote(f, 4.8);
        delay = 3800;
      } else {
        // 《极夜守望者》《极昼不落太阳》《极北安魂曲》《世界的尽头》《斯奈山半岛》
        const f = ambient[Math.floor(Math.random() * ambient.length)];
        this.synth.playCelloNote(f * 0.5, 5.8);
        delay = 4500;
      }
    }

    /* ============================================================
       8. 🇮🇪 IRELAND (爱尔兰)
       ============================================================ */
    else if (mode.startsWith('celtic')) {
      const dorian = [50, 53, 57, 60, 62, 64, 65, 69, 72].map(midiToFreq);

      if (mode === 'celtic_whistle' || mode === 'celtic_shannon') {
        // 《丹格尔半岛牧歌》《香侬河晚霞》Irish whistle pastoral air
        const f = dorian[Math.floor(Math.random() * 4) + 4];
        this.synth.playChineseFlute(f, 3.6);
        delay = 3400;
      } else {
        // Flowing Celtic harp arpeggios
        const rootIdx = Math.floor(Math.random() * 3);
        const arp = [dorian[rootIdx], dorian[rootIdx + 2], dorian[rootIdx + 4], dorian[rootIdx + 6]];
        this.synth.playCelticHarpArpeggio(arp);
        delay = 3400;
      }
    }

    /* ============================================================
       9. 🇮🇳 INDIA (印度)
       ============================================================ */
    else if (mode.startsWith('india')) {
      const bhairav = [48, 49, 52, 53, 55, 56, 59, 60, 64].map(midiToFreq);

      if (mode === 'india_tanpura' || mode === 'india_himalaya' || mode === 'india_source') {
        // 《Tanpura 恒河嗡鸣》《喜马拉雅冥想》《恒河源头雪水》Tibetan Singing Bowl
        const bowlPitches = [180, 216, 264, 432];
        const pitch = bowlPitches[Math.floor(Math.random() * bowlPitches.length)];
        this.synth.playSingingBowl(pitch, 8.0);
        delay = 5200;
      } else if (mode === 'india_aarti') {
        // 《瓦拉纳西古刹夜祭》Temple bell & brass ring
        this.synth.playBronzeTempleBell(144, 7.5);
        delay = 4600;
      } else if (mode === 'india_kerala') {
        // 《喀拉拉热带流泉》Bansuri flute
        const f = bhairav[Math.floor(Math.random() * 4) + 4];
        this.synth.playChineseFlute(f, 4.0);
        delay = 3800;
      } else {
        // Sitar Meend bends & Jawari buzz
        const f = bhairav[Math.floor(Math.random() * bhairav.length)];
        this.synth.playSitarNote(f, 3.8, Math.random() > 0.4);
        delay = 3400;
      }
    }

    /* ============================================================
       10. 🇧🇷 BRAZIL (巴西)
       ============================================================ */
    else if (mode.startsWith('brazil')) {
      const bossaChords = [
        [220.0, 261.63, 329.63, 392.0], // Am7
        [146.83, 220.0, 261.63, 349.23], // Dm7
        [196.0, 246.94, 293.66, 349.23], // G7
        [130.81, 196.0, 246.94, 329.63], // Cmaj7
        [164.81, 220.0, 261.63, 329.63]  // Em7
      ];
      const chord = bossaChords[Math.floor(Math.random() * bossaChords.length)];
      this.synth.playBossaNovaChord(chord);
      delay = 2900;
    }

    /* ============================================================
       11. 🇲🇦 MOROCCO (摩洛哥)
       ============================================================ */
    else if (mode.startsWith('morocco')) {
      const hijaz = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25];

      if (mode === 'morocco_atlas' || mode === 'morocco_oasis') {
        // 《阿特拉斯山谷风啸》《沙漠绿洲》Nomad Nay flute
        const f = hijaz[Math.floor(Math.random() * hijaz.length)];
        this.synth.playArabicNayFlute(f, 4.2);
        delay = 3800;
      } else {
        // Sahara caravan Oud microtonal phrasing
        const f = hijaz[Math.floor(Math.random() * (hijaz.length - 1))];
        this.synth.playSitarNote(f * 0.75, 3.2, false);
        delay = 3200;
      }
    }

    /* ============================================================
       12. 🇺🇸 USA (美国)
       ============================================================ */
    else if (mode.startsWith('usa')) {
      const blues = [164.81, 196.0, 220.0, 233.08, 246.94, 293.66, 329.63];

      if (mode === 'usa_delta') {
        // 《密西西比河畔夜曲》Delta blues harmonica reed bend
        const f = blues[Math.floor(Math.random() * blues.length)];
        this.synth.playHarmonicaNote(f, 2.8);
        delay = 3200;
      } else if (mode === 'usa_canyon' || mode === 'usa_yellowstone') {
        // 《大峡谷回音》《黄石森林》Native American cedar wood flute echo
        const f = [220.0, 246.94, 293.66, 329.63, 392.0][Math.floor(Math.random() * 5)];
        this.synth.playNativeAmericanFlute(f, 4.0);
        delay = 3800;
      } else {
        // Bottleneck blues guitar slide
        const f = blues[Math.floor(Math.random() * blues.length)];
        this.synth.playBluesGuitarSlide(f, 3.2, Math.random() > 0.3);
        delay = 3000;
      }
    }

    /* ============================================================
       13. 🇩🇪 GERMANY (德国)
       ============================================================ */
    else if (mode.startsWith('germany')) {
      if (mode === 'germany_rhine' || mode === 'germany_heidelberg' || mode === 'germany_lullaby') {
        // 《莱茵河之恋》《海德堡哲人小道》《勃拉姆斯摇篮曲》Romantic felt piano
        const pianoNotes = [196.0, 246.94, 293.66, 329.63, 392.0];
        const f = pianoNotes[Math.floor(Math.random() * pianoNotes.length)];
        this.synth.playFeltPianoNote(f, 3.8);
        delay = 3400;
      } else {
        // Bach Cello Suite No. 1 arpeggiated motif
        const celloNotes = [98.0, 146.83, 246.94, 220.0, 196.0, 164.81, 130.81];
        const f = celloNotes[Math.floor(Math.random() * celloNotes.length)];
        this.synth.playCelloNote(f, 4.2);
        delay = 3600;
      }
    }

    /* ============================================================
       14. 🇬🇷 GREECE (希腊)
       ============================================================ */
    else if (mode.startsWith('greece')) {
      const greek = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];

      if (mode === 'greece_santorini' || mode === 'greece_mykonos') {
        // 《圣托里尼落日》《米克诺斯风车》Aegean Bouzouki rapid tremolo
        const f = greek[Math.floor(Math.random() * (greek.length - 2))];
        this.synth.playBouzoukiTremolo(f, 2.2);
        delay = 2700;
      } else if (mode === 'greece_delphi') {
        // 《德尔斐神谕之风》Ancient microtonal reed flute
        const f = greek[Math.floor(Math.random() * greek.length)];
        this.synth.playArabicNayFlute(f, 3.8);
        delay = 3500;
      } else {
        const f = greek[Math.floor(Math.random() * (greek.length - 2))];
        this.synth.playBouzoukiTremolo(f, 2.0);
        delay = 3000;
      }
    }

    /* ============================================================
       15. 🇳🇴 NORWAY (挪威)
       ============================================================ */
    else if (mode.startsWith('norway')) {
      const fjordScale = [55, 57, 59, 62, 64, 66, 67, 71].map(midiToFreq);

      if (mode === 'norway_aurora') {
        // 《斯瓦尔巴北极光》Crystalline bell tones
        this.synth.playWindChimes();
        delay = 3200;
      } else if (mode === 'norway_lofoten' || mode === 'norway_tromso') {
        // 《罗弗敦群岛渔火》《特罗姆瑟极夜》Midnight blue ambient Nordic pad
        const f = fjordScale[Math.floor(Math.random() * fjordScale.length)];
        this.synth.playCelloNote(f * 0.5, 5.0);
        delay = 4400;
      } else {
        // Hardanger fiddle with understring sympathetic drone
        const f = fjordScale[Math.floor(Math.random() * fjordScale.length)];
        this.synth.playHardangerFiddle(f, 3.8);
        delay = 3500;
      }
    }

    /* ============================================================
       16. 🇪🇬 EGYPT (埃及)
       ============================================================ */
    else if (mode.startsWith('egypt')) {
      const hijaz = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25];

      if (mode === 'egypt_pyramid') {
        // 《金字塔月光》Ancient Egyptian Qanun rapid plucked zither
        this.synth.playQanunArpeggio([hijaz[0], hijaz[1], hijaz[2], hijaz[3], hijaz[4]]);
        delay = 3000;
      } else if (mode === 'egypt_temple' || mode === 'egypt_siwa') {
        // 《卢克索神庙回响》《锡瓦绿洲》Nocturnal Ney flute prayer
        const f = hijaz[Math.floor(Math.random() * hijaz.length)];
        this.synth.playArabicNayFlute(f, 4.2);
        delay = 3800;
      } else if (mode === 'egypt_kings') {
        // 《帝王谷千年微尘》Ancient ritual bronze horn & bell
        this.synth.playBronzeTempleBell(125, 8.0);
        delay = 5000;
      } else {
        const f = hijaz[Math.floor(Math.random() * hijaz.length)];
        this.synth.playSitarNote(f * 0.75, 3.2, false);
        delay = 3200;
      }
    }

    this.phraseTimer = setTimeout(() => {
      this.runLoop();
    }, delay);
  }
}
