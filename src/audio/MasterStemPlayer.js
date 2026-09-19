/**
 * MasterStemPlayer.js
 * Supports dynamic switching between multiple master tracks and nature sounds.
 */

export class MasterStemPlayer {
  constructor(engine) {
    this.engine = engine;
    this.ctx = engine.ctx;
    
    this.musicAudio = new Audio();
    this.musicAudio.loop = false;
    this.musicAudio.crossOrigin = 'anonymous';

    this.natureAudio = new Audio();
    this.natureAudio.loop = true;
    this.natureAudio.crossOrigin = 'anonymous';

    this.musicGain = null;
    this.natureGain = null;
    this.isRouted = false;

    this.musicVolume = 0.75;
    this.natureVolume = 0.65;
    this.isPlaying = false;
    this.currentMusicUrl = null;
    this.currentNatureUrl = null;
    this.onTrackEnded = null;

    this.musicAudio.addEventListener('ended', () => {
      if (this.isPlaying && this.onTrackEnded) {
        this.onTrackEnded();
      }
    });
  }

  setupWebAudioRouting() {
    if (this.isRouted || !this.engine.ctx) return;
    this.ctx = this.engine.ctx;

    try {
      const musicSrc = this.ctx.createMediaElementSource(this.musicAudio);
      const natureSrc = this.ctx.createMediaElementSource(this.natureAudio);

      this.musicGain = this.ctx.createGain();
      this.natureGain = this.ctx.createGain();

      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.natureGain.gain.setValueAtTime(this.natureVolume, this.ctx.currentTime);

      musicSrc.connect(this.musicGain);
      natureSrc.connect(this.natureGain);

      this.musicGain.connect(this.engine.masterGain);
      this.natureGain.connect(this.engine.masterGain);

      // Immersive Spatial Acoustic Reverb Sends (营造当地大自然与殿堂级厅堂临场感)
      if (this.engine.reverbNode) {
        const musicReverbSend = this.ctx.createGain();
        musicReverbSend.gain.setValueAtTime(0.28, this.ctx.currentTime); // 28% wet reverb for music
        this.musicGain.connect(musicReverbSend);
        musicReverbSend.connect(this.engine.reverbNode);

        const natureReverbSend = this.ctx.createGain();
        natureReverbSend.gain.setValueAtTime(0.18, this.ctx.currentTime); // 18% ambient diffusion for nature
        this.natureGain.connect(natureReverbSend);
        natureReverbSend.connect(this.engine.reverbNode);
      }

      // Dedicated High-Resolution Music Pitch Analyser (isolated from nature noise)
      this.musicAnalyser = this.ctx.createAnalyser();
      this.musicAnalyser.fftSize = 2048;
      this.musicAnalyser.smoothingTimeConstant = 0.65;
      this.musicGain.connect(this.musicAnalyser);
      this.engine.musicAnalyser = this.musicAnalyser;

      // Dedicated Nature / White Noise Soundscape Analyser
      this.natureAnalyser = this.ctx.createAnalyser();
      this.natureAnalyser.fftSize = 128;
      this.natureAnalyser.smoothingTimeConstant = 0.75;
      this.natureGain.connect(this.natureAnalyser);
      this.engine.natureAnalyser = this.natureAnalyser;

      this.isRouted = true;
    } catch (e) {
      console.warn('Web Audio routing fallback to direct volume:', e);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    } else {
      this.musicAudio.volume = this.musicVolume;
    }
  }

  setNatureVolume(val) {
    this.natureVolume = Math.max(0, Math.min(1, val));
    if (this.natureGain && this.ctx) {
      this.natureGain.gain.setTargetAtTime(this.natureVolume, this.ctx.currentTime, 0.05);
    } else {
      this.natureAudio.volume = this.natureVolume;
    }
  }

  async playTrack(musicUrl, natureUrl) {
    this.isPlaying = true;
    this.setupWebAudioRouting();

    const safePlay = async (audio) => {
      try {
        await audio.play();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Audio playback error:', err);
        }
      }
    };

    // Update nature audio
    if (natureUrl && this.currentNatureUrl !== natureUrl) {
      this.currentNatureUrl = natureUrl;
      if (this.ctx && this.natureGain && this.isPlaying && !this.natureAudio.paused) {
        // Smooth fade out old nature stem
        const now = this.ctx.currentTime;
        this.natureGain.gain.setValueAtTime(this.natureGain.gain.value, now);
        this.natureGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        setTimeout(() => {
          this.natureAudio.pause();
          this.natureAudio.currentTime = 0;
          this.natureAudio.src = natureUrl;
          this.natureAudio.load();
          safePlay(this.natureAudio).then(() => {
            if (this.ctx && this.natureGain) {
              const resumeNow = this.ctx.currentTime;
              this.natureGain.gain.setValueAtTime(0.001, resumeNow);
              this.natureGain.gain.linearRampToValueAtTime(this.natureVolume, resumeNow + 0.35);
            }
          });
        }, 200);
      } else {
        this.natureAudio.pause();
        this.natureAudio.currentTime = 0;
        this.natureAudio.src = natureUrl;
        this.natureAudio.load();
      }
    }

    // Update music audio with smooth acoustic crossfade
    if (musicUrl) {
      if (this.currentMusicUrl !== musicUrl) {
        this.currentMusicUrl = musicUrl;
        const isCurrentlySinging = this.isPlaying && !this.musicAudio.paused;

        if (this.ctx && this.musicGain && isCurrentlySinging) {
          // Master Console Smooth Crossfade: Ramp down -> switch -> ramp up
          const now = this.ctx.currentTime;
          this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
          this.musicGain.gain.linearRampToValueAtTime(0.001, now + 0.18);

          await new Promise(r => setTimeout(r, 180));

          this.musicAudio.pause();
          this.musicAudio.currentTime = 0;
          this.musicAudio.src = musicUrl;
          this.musicAudio.load();

          await safePlay(this.musicAudio);

          if (this.ctx && this.musicGain) {
            const resumeNow = this.ctx.currentTime;
            this.musicGain.gain.setValueAtTime(0.001, resumeNow);
            this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, resumeNow + 0.32);
          }
          return;
        } else {
          this.musicAudio.pause();
          this.musicAudio.currentTime = 0;
          this.musicAudio.src = musicUrl;
          this.musicAudio.load();
        }
      } else if (this.musicAudio.paused) {
        this.musicAudio.currentTime = 0;
      }
    } else {
      this.stopMusicOnly();
    }

    const promises = [];
    if (this.currentMusicUrl) promises.push(safePlay(this.musicAudio));
    if (this.currentNatureUrl && (!this.ctx || this.natureAudio.paused)) promises.push(safePlay(this.natureAudio));
    await Promise.all(promises);
  }

  stopMusicOnly() {
    this.musicAudio.pause();
    this.musicAudio.currentTime = 0;
    this.currentMusicUrl = null;
  }

  pause() {
    this.isPlaying = false;
    this.musicAudio.pause();
    this.natureAudio.pause();
  }

  stop() {
    this.isPlaying = false;
    this.musicAudio.pause();
    this.musicAudio.currentTime = 0;
    this.natureAudio.pause();
    this.natureAudio.currentTime = 0;
  }
}
