import { AudioEngine } from './audio/AudioEngine.js';
import { MasterStemPlayer } from './audio/MasterStemPlayer.js';
import { COUNTRIES } from './audio/CountryPresets.js';
import { CREDITS, CREDIT_CATEGORIES } from './audio/Credits.js';
import { Visualizer } from './ui/Visualizer.js';
import { NoiseVisualizer } from './ui/NoiseVisualizer.js';

// Audio Engines
const engine = new AudioEngine();
const masterStemPlayer = new MasterStemPlayer(engine);

let currentCountry = COUNTRIES[0];
let currentTrackIdx = Math.floor(Math.random() * COUNTRIES[0].tracks.length);
let isPlaying = false;
let visualizer = null;
let noiseVisualizer = null;
let lastNoiseVal = 50;

// DOM Elements
const canvas = document.getElementById('visualizerCanvas');
const deviceStage = document.getElementById('deviceStage');
const btnToggleSim = document.getElementById('btnToggleSim');
const simModeText = document.getElementById('simModeText');
const btnLanTest = document.getElementById('btnLanTest');

// Dynamic Island
const dynamicIsland = document.getElementById('dynamicIsland');
const islandFlag = document.getElementById('islandFlag');

// Hero Center
const titleDisplay = document.getElementById('titleDisplay');
const subDisplay = document.getElementById('subDisplay');
const trackBadge = document.getElementById('trackBadge');
const btnOpenTrackSheet = document.getElementById('btnOpenTrackSheet');
const btnPrevTrack = document.getElementById('btnPrevTrack');
const btnNextTrack = document.getElementById('btnNextTrack');
const btnShuffle = document.getElementById('btnShuffle');
const btnDrawerShuffle = document.getElementById('btnDrawerShuffle');
const shuffleModeLabel = document.getElementById('shuffleModeLabel');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');

let isShuffleMode = false;
let shuffleQueue = [];
let shuffleQueueIdx = 0;

// Tracklist Sheet Exploration
const trackSheet = document.getElementById('trackSheet');
const btnCloseTrackSheet = document.getElementById('btnCloseTrackSheet');
const sheetTrackTitle = document.getElementById('sheetTrackTitle');
const sheetTrackSub = document.getElementById('sheetTrackSub');
const sheetTrackFlag = document.getElementById('sheetTrackFlag');
const sheetTrackCount = document.getElementById('sheetTrackCount');
const sheetTrackList = document.getElementById('sheetTrackList');

// Country Trigger Bar & Sheet Exploration
const btnOpenCountrySheet = document.getElementById('btnOpenCountrySheet');
const countrySheet = document.getElementById('countrySheet');
const btnCloseCountrySheet = document.getElementById('btnCloseCountrySheet');
const sheetCountryGrid = document.getElementById('sheetCountryGrid');
const regionTabs = document.getElementById('regionTabs');
const barFlag = document.getElementById('barFlag');
const barCountryName = document.getElementById('barCountryName');
const barCountrySub = document.getElementById('barCountrySub');
let currentRegion = 'all';

// Credits & Attribution Sheet
const btnOpenCredits = document.getElementById('btnOpenCredits');
const btnOpenCreditsTrack = document.getElementById('btnOpenCreditsTrack');
const creditsSheet = document.getElementById('creditsSheet');
const btnCloseCredits = document.getElementById('btnCloseCredits');
const creditsList = document.getElementById('creditsList');

// Architectural Zen White Noise Soundscape Deck Elements
const noiseDeck = document.getElementById('noiseDeck');
const noiseWaveCanvas = document.getElementById('noiseWaveCanvas');
const btnMuteToggle = document.getElementById('btnMuteToggle');
const noiseGlyph = document.getElementById('noiseGlyph');
const noiseLabel = document.getElementById('noiseLabel');
const noiseLevelFill = document.getElementById('noiseLevelFill');
const noiseFaderThumb = document.getElementById('noiseFaderThumb');
const noisePulseBars = document.getElementById('noisePulseBars');
const sliderNoise = document.getElementById('sliderNoise');
const pctNoise = document.getElementById('pctNoise');
const presetNoiseBtns = document.querySelectorAll('.noise-preset-btn');
const countryPills = document.getElementById('countryPills');

// Quick Actions & Modals
const btnTimerModal = document.getElementById('btnTimerModal');
const timerSliderPopup = document.getElementById('timerSliderPopup');
const dockTimerText = document.getElementById('dockTimerText');
const statusClock = document.getElementById('statusClock');

function getNatureGlyph(audioUrl) {
  if (!audioUrl) return '🌧️';
  if (audioUrl.includes('rain')) return '🌧️';
  if (audioUrl.includes('wind')) return '💨';
  if (audioUrl.includes('stream')) return '🌊';
  if (audioUrl.includes('fire')) return '🔥';
  if (audioUrl.includes('thunder')) return '⚡';
  return '🍃';
}

function applyNoiseVolume(val, updateInput = true) {
  val = Math.max(0, Math.min(100, Math.round(val)));
  if (updateInput && sliderNoise) sliderNoise.value = val;
  if (pctNoise) pctNoise.textContent = `${val}%`;
  if (noiseLevelFill) noiseLevelFill.style.width = `${val}%`;
  if (noiseFaderThumb) noiseFaderThumb.style.left = `${val}%`;

  const frac = val / 100;
  masterStemPlayer.setNatureVolume(frac);
  if (noiseVisualizer) {
    noiseVisualizer.setVolume(frac);
  }

  if (noiseDeck) {
    noiseDeck.classList.toggle('active', val > 0 && isPlaying);
  }

  // Update preset pills active state
  presetNoiseBtns.forEach(btn => {
    const pVal = parseInt(btn.dataset.val, 10);
    btn.classList.toggle('active', pVal === val);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const initialTrack = currentCountry.tracks[currentTrackIdx] || currentCountry.tracks[0];
  visualizer = new Visualizer(canvas, engine);
  visualizer.setTrackInfo(currentCountry, initialTrack);
  visualizer.start();

  if (noiseWaveCanvas) {
    noiseVisualizer = new NoiseVisualizer(noiseWaveCanvas, engine);
    noiseVisualizer.setVolume(0.5);
    noiseVisualizer.start();
  }

  updateClock();
  setInterval(updateClock, 1000);

  updateUIForCountry(currentCountry, currentTrackIdx);
  renderCountryPills();
  renderRegionTabs();
  bindEvents();

  // Set initial white noise level
  const initialNoise = sliderNoise ? parseInt(sliderNoise.value, 10) : 50;
  applyNoiseVolume(initialNoise, true);
  masterStemPlayer.setMusicVolume(0.85);

  // Auto-advance: when a track ends, randomly play another from the same country
  masterStemPlayer.onTrackEnded = () => {
    const tracks = currentCountry.tracks;
    if (tracks.length <= 1) {
      // Only one track — replay it
      applyCurrentAudio();
      return;
    }
    // Pick a random different track
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * tracks.length);
    } while (nextIdx === currentTrackIdx);
    currentTrackIdx = nextIdx;
    updateUIForCountry(currentCountry, currentTrackIdx);
    applyCurrentAudio();
  };
});

function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  if (statusClock) statusClock.textContent = `${hours}:${minutes}`;
}

function bindEvents() {
  // Master Play / Pause (Central Constellation Orb & Dynamic Island)
  playBtn.addEventListener('click', togglePlayback);
  if (dynamicIsland) {
    dynamicIsland.addEventListener('click', togglePlayback);
  }
  if (canvas) {
    canvas.addEventListener('click', togglePlayback);
  }

  // Track Switching Controls
  btnPrevTrack.addEventListener('click', (e) => {
    e.stopPropagation();
    switchTrack(-1);
  });
  btnNextTrack.addEventListener('click', (e) => {
    e.stopPropagation();
    switchTrack(1);
  });
  const handleShuffle = (e) => {
    if (e) e.stopPropagation();
    toggleShuffleMode();
  };
  if (btnShuffle) btnShuffle.addEventListener('click', handleShuffle);
  if (btnDrawerShuffle) btnDrawerShuffle.addEventListener('click', handleShuffle);

  // Tactile Horizontal Swipe on Dial Container to Switch Tracks
  const heroCenter = document.querySelector('.zen-hero-center');
  if (heroCenter) {
    let touchStartX = 0;
    let touchStartY = 0;
    heroCenter.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    heroCenter.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
        if (diffX < 0) {
          switchTrack(1);
        } else {
          switchTrack(-1);
        }
      }
    }, { passive: true });
  }

  // Interactive White Noise Slider & Visualizer Controls
  if (sliderNoise) {
    sliderNoise.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      applyNoiseVolume(val, false);
    });
  }

  // Quick Preset Buttons (0%, 30%, 70%, 100%)
  presetNoiseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(btn.dataset.val, 10);
      applyNoiseVolume(val, true);
    });
  });

  // Mute / Restore Toggle on Soundscape Info
  if (btnMuteToggle) {
    btnMuteToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = sliderNoise ? parseInt(sliderNoise.value, 10) : 50;
      if (current > 0) {
        lastNoiseVal = current;
        applyNoiseVolume(0, true);
      } else {
        applyNoiseVolume(lastNoiseVal || 70, true);
      }
    });
  }

  // Simulator Toggle
  btnToggleSim.addEventListener('click', () => {
    const isFullscreen = deviceStage.classList.toggle('fullscreen-mode');
    btnToggleSim.classList.toggle('active', !isFullscreen);
    simModeText.textContent = isFullscreen ? '全屏显示' : 'iPhone 16 Pro 模拟器';
    if (visualizer) visualizer.resize();
    if (noiseVisualizer) noiseVisualizer.resize();
  });

  // LAN Tooltip
  btnLanTest.addEventListener('click', () => {
    const host = window.location.host;
    const isLocal = host.startsWith('localhost') || host.startsWith('127.');
    const lanAddr = isLocal ? '<电脑局域网IP>:3000' : host;
    alert(`【真机局域网预览方法】\n\n1. 确保您的手机和本电脑连接同一个 Wi-Fi。\n2. 在手机浏览器中输入本机地址：\n   http://${lanAddr}\n${isLocal ? '   （在电脑上运行 ipconfig 查看 IPv4 地址）\n' : ''}3. 点击浏览器底部分享按钮，选择「添加到主屏幕」，即可全屏纯净体验！`);
  });

  // Random Country
  btnRandom.addEventListener('click', () => {
    const others = COUNTRIES.filter(c => c.id !== currentCountry.id);
    const chosen = others[Math.floor(Math.random() * others.length)];
    selectCountry(chosen);
  });

  // Master Tracklist Exploration Sheet
  if (btnOpenTrackSheet) {
    btnOpenTrackSheet.addEventListener('click', (e) => {
      e.stopPropagation();
      trackSheet.classList.add('open');
      renderTrackSheet();
    });
  }
  if (btnCloseTrackSheet) {
    btnCloseTrackSheet.addEventListener('click', () => trackSheet.classList.remove('open'));
  }
  if (trackSheet) {
    trackSheet.addEventListener('click', (e) => {
      if (e.target === trackSheet) trackSheet.classList.remove('open');
    });
  }

  // Country Exploration Bottom Sheet
  btnOpenCountrySheet.addEventListener('click', () => {
    countrySheet.classList.add('open');
    renderSheetCountryGrid();
  });
  btnCloseCountrySheet.addEventListener('click', () => countrySheet.classList.remove('open'));
  countrySheet.addEventListener('click', (e) => {
    if (e.target === countrySheet) countrySheet.classList.remove('open');
  });

  // Region Segmented Filter Tabs (event delegation: tabs are re-rendered from data)
  regionTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.sheet-tab');
    if (!tab) return;
    regionTabs.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentRegion = tab.dataset.region;
    renderSheetCountryGrid();
  });

  // Credits & Attribution Sheet
  const openCreditsSheet = () => {
    creditsSheet.classList.add('open');
    renderCreditsSheet();
  };
  if (btnOpenCredits) {
    btnOpenCredits.addEventListener('click', (e) => {
      e.stopPropagation();
      openCreditsSheet();
    });
  }
  if (btnOpenCreditsTrack) {
    btnOpenCreditsTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      openCreditsSheet();
    });
  }
  if (btnCloseCredits) {
    btnCloseCredits.addEventListener('click', () => creditsSheet.classList.remove('open'));
  }
  if (creditsSheet) {
    creditsSheet.addEventListener('click', (e) => {
      if (e.target === creditsSheet) creditsSheet.classList.remove('open');
    });
  }

  // Clicking a credit entry jumps straight to that song / soundscape
  // (clicks on the Commons / license links open in a new tab instead)
  if (creditsList) {
    creditsList.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const item = e.target.closest('.credits-item');
      if (!item) return;
      jumpToCreditTrack(item.dataset.file);
    });
  }

  // Sleep Timer: vertical slider popup with tick presets
  if (btnTimerModal && timerSliderPopup) {
    btnTimerModal.addEventListener('click', (e) => {
      e.stopPropagation();
      timerSliderPopup.classList.toggle('open');
    });
    timerSliderPopup.querySelectorAll('.timer-tick').forEach(tick => {
      tick.addEventListener('click', (e) => {
        e.stopPropagation();
        const min = parseInt(tick.dataset.min, 10);
        timerSliderPopup.querySelectorAll('.timer-tick').forEach(t => t.classList.remove('active'));
        tick.classList.add('active');
        if (min === 0) {
          engine.cancelTimer();
          if (dockTimerText) dockTimerText.textContent = '定时';
        } else {
          if (dockTimerText) dockTimerText.textContent = `${min}分`;
          engine.setTimer(
            min,
            (rem) => {
              const m = Math.floor(rem / 60);
              const s = rem % 60;
              if (dockTimerText) dockTimerText.textContent = s ? `${m}:${s.toString().padStart(2, '0')}` : `${m}分`;
            },
            () => {
              pausePlayback();
              timerSliderPopup.querySelectorAll('.timer-tick').forEach(t => t.classList.remove('active'));
              const offTick = timerSliderPopup.querySelector('.timer-tick[data-min="0"]');
              if (offTick) offTick.classList.add('active');
              if (dockTimerText) dockTimerText.textContent = '定时';
            }
          );
        }
        timerSliderPopup.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (timerSliderPopup.classList.contains('open')
        && !timerSliderPopup.contains(e.target)
        && !btnTimerModal.contains(e.target)) {
        timerSliderPopup.classList.remove('open');
      }
    });
  }
}

function generateShuffleQueue(tracks, currentIdx = 0) {
  const indices = tracks.map((_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Put currentIdx first if present
  const curPos = indices.indexOf(currentIdx);
  if (curPos !== -1) {
    indices.splice(curPos, 1);
    indices.unshift(currentIdx);
  }
  return indices;
}

function toggleShuffleMode() {
  isShuffleMode = !isShuffleMode;
  if (btnShuffle) btnShuffle.classList.toggle('active', isShuffleMode);
  if (btnDrawerShuffle) btnDrawerShuffle.classList.toggle('active', isShuffleMode);

  const tracks = currentCountry.tracks;
  if (isShuffleMode) {
    shuffleQueue = generateShuffleQueue(tracks, currentTrackIdx);
    // If more than 1 track, immediately jump to a new random track in the shuffled deck!
    if (tracks.length > 1) {
      shuffleQueueIdx = 1;
      currentTrackIdx = shuffleQueue[shuffleQueueIdx];
      updateUIForCountry(currentCountry, currentTrackIdx);
      if (isPlaying) {
        applyCurrentAudio();
      }
      return;
    }
  }
  updateUIForCountry(currentCountry, currentTrackIdx);
}

function switchTrack(direction) {
  const tracks = currentCountry.tracks;
  if (isShuffleMode) {
    if (!shuffleQueue.length || shuffleQueue.length !== tracks.length) {
      shuffleQueue = generateShuffleQueue(tracks, currentTrackIdx);
      shuffleQueueIdx = 0;
    }
    shuffleQueueIdx = (shuffleQueueIdx + direction + shuffleQueue.length) % shuffleQueue.length;
    currentTrackIdx = shuffleQueue[shuffleQueueIdx];
  } else {
    currentTrackIdx = (currentTrackIdx + direction + tracks.length) % tracks.length;
  }

  // Visualizer luminous acoustic wavefront burst
  if (visualizer) {
    visualizer.triggerTrackChangeWave();
  }

  updateUIForCountry(currentCountry, currentTrackIdx);

  if (isPlaying) {
    applyCurrentAudio();
  }
}

function selectTrack(trackIdx) {
  if (currentTrackIdx === trackIdx) return;
  currentTrackIdx = trackIdx;

  if (isShuffleMode) {
    if (!shuffleQueue.length || shuffleQueue.length !== currentCountry.tracks.length) {
      shuffleQueue = generateShuffleQueue(currentCountry.tracks, currentTrackIdx);
    }
    const foundIdx = shuffleQueue.indexOf(trackIdx);
    if (foundIdx !== -1) {
      shuffleQueueIdx = foundIdx;
    }
  }

  if (visualizer) {
    visualizer.triggerTrackChangeWave();
  }

  updateUIForCountry(currentCountry, currentTrackIdx);

  if (isPlaying) {
    applyCurrentAudio();
  }
}

async function togglePlayback() {
  await engine.resume();
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

async function startPlayback() {
  isPlaying = true;
  engine.isPlaying = true;
  if (visualizer) visualizer.setPlaying(true);
  if (noiseVisualizer) noiseVisualizer.setPlaying(true);
  if (noiseDeck) noiseDeck.classList.toggle('active', parseInt(sliderNoise.value, 10) > 0);
  playBtn.classList.add('playing');
  playIcon.textContent = '⏸';
  dynamicIsland.classList.add('playing');

  const currentNoise = parseInt(sliderNoise.value, 10) / 100;
  masterStemPlayer.setNatureVolume(currentNoise);
  masterStemPlayer.setMusicVolume(0.85);

  await applyCurrentAudio();
}

async function applyCurrentAudio() {
  const track = currentCountry.tracks[currentTrackIdx];
  if (!track) return;

  // 100% Pure Studio Master Audio Playback
  await masterStemPlayer.playTrack(track.file, currentCountry.natureAudio);
}

function pausePlayback() {
  isPlaying = false;
  engine.isPlaying = false;
  if (visualizer) visualizer.setPlaying(false);
  if (noiseVisualizer) noiseVisualizer.setPlaying(false);
  if (noiseDeck) noiseDeck.classList.remove('active');
  playBtn.classList.remove('playing');
  playIcon.textContent = '▶';
  dynamicIsland.classList.remove('playing');

  masterStemPlayer.pause();
}

function selectCountry(country) {
  if (currentCountry.id === country.id) return;
  currentCountry = country;
  const randomStart = Math.floor(Math.random() * country.tracks.length);
  currentTrackIdx = randomStart;

  if (isShuffleMode) {
    shuffleQueue = generateShuffleQueue(country.tracks, randomStart);
    shuffleQueueIdx = 0;
  }

  if (visualizer) {
    visualizer.triggerTrackChangeWave();
  }

  updateUIForCountry(country, randomStart);
  renderCountryPills();

  if (isPlaying) {
    applyCurrentAudio();
  }
}

function parseTrackTitle(rawTitle) {
  if (!rawTitle) return { title: '', subtitle: '' };
  const match = rawTitle.match(/^《([^》]+)》\s*(.*)$/);
  if (match) {
    return {
      title: match[1].trim(),
      subtitle: match[2].trim()
    };
  }
  return {
    title: rawTitle.replace(/《|》/g, '').trim(),
    subtitle: ''
  };
}

function updateUIForCountry(country, trackIdx = 0) {
  const tracks = country.tracks;
  const currentTrack = tracks[trackIdx] || tracks[0];
  const { title: mainTitle, subtitle: trackSub } = parseTrackTitle(currentTrack.title);

  if (titleDisplay) titleDisplay.textContent = mainTitle;
  if (subDisplay) subDisplay.textContent = trackSub || country.natureLabel || '原声实录';

  const trackNumStr = (trackIdx + 1).toString().padStart(2, '0');
  const totalNumStr = tracks.length.toString().padStart(2, '0');
  if (trackBadge) {
    trackBadge.textContent = isShuffleMode
      ? `🔀 ${trackIdx + 1}/${tracks.length}`
      : `${trackNumStr} / ${totalNumStr}`;
  }

  if (shuffleModeLabel) {
    shuffleModeLabel.textContent = isShuffleMode ? '随机播放' : '顺序播放';
  }
  if (btnShuffle) {
    btnShuffle.classList.toggle('active', isShuffleMode);
  }
  if (btnDrawerShuffle) {
    btnDrawerShuffle.classList.toggle('active', isShuffleMode);
  }

  islandFlag.textContent = country.flag;

  // Soft crossfade transition on central typography
  if (titleDisplay) {
    titleDisplay.classList.remove('track-fade-anim');
    void titleDisplay.offsetWidth; // Trigger reflow
    titleDisplay.classList.add('track-fade-anim');
  }
  if (subDisplay) {
    subDisplay.classList.remove('track-fade-anim');
    void subDisplay.offsetWidth;
    subDisplay.classList.add('track-fade-anim');
  }

  // Update Acoustic Radial Mandala in Visualizer
  if (visualizer) {
    visualizer.setTrackInfo(country, currentTrack);
  }

  // Update Country Trigger Bar
  if (barFlag) barFlag.textContent = country.flag;
  if (barCountryName) barCountryName.textContent = `${country.nameZh} · ${country.nameEn}`;
  if (barCountrySub) barCountrySub.textContent = country.subtitle ? country.subtitle.split(' · ')[0] : (country.natureLabel || '声景探索');

  // Update White Noise Soundscape Label & Glyph
  if (noiseLabel) noiseLabel.textContent = country.natureLabel || '自然白噪音';
  if (noiseGlyph) noiseGlyph.textContent = getNatureGlyph(country.natureAudio);

  // Refresh sheets if open
  renderSheetCountryGrid();
  renderTrackSheet();
}

function renderTrackSheet() {
  if (!sheetTrackList) return;
  const country = currentCountry;
  const tracks = country.tracks;

  if (sheetTrackTitle) sheetTrackTitle.textContent = `${country.nameZh} · 纯音母带全集`;
  if (sheetTrackFlag) sheetTrackFlag.textContent = country.flag;
  if (sheetTrackCount) sheetTrackCount.textContent = `${tracks.length} 首`;
  if (sheetTrackSub) sheetTrackSub.textContent = `${country.subtitle} · 空间声学母带 · 点击即切`;

  sheetTrackList.innerHTML = tracks.map((t, idx) => {
    const isActive = idx === currentTrackIdx;
    const numStr = (idx + 1).toString().padStart(2, '0');
    const { title: itemTitle, subtitle: itemSub } = parseTrackTitle(t.title);
    return `
      <div class="sheet-track-item ${isActive ? 'active' : ''}" data-track-idx="${idx}">
        <div class="sheet-track-left">
          <span class="sheet-track-num">${numStr}</span>
          <div class="sheet-track-details">
            <span class="sheet-track-name">${itemTitle}</span>
            <span class="sheet-track-meta">${itemSub || (country.nameZh + ' · ' + (country.natureLabel || '原声录制'))}</span>
          </div>
        </div>
        <div class="sheet-track-right">
          <div class="track-wave-bars" title="正在播放">
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
          </div>
          <span class="sheet-track-badge">${isActive ? '正在聆听' : '母带'}</span>
        </div>
      </div>
    `;
  }).join('');

  sheetTrackList.querySelectorAll('.sheet-track-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.trackIdx, 10);
      selectTrack(idx);
    });
  });

  // Keep active track in view if sheet is visible
  if (trackSheet && trackSheet.classList.contains('open')) {
    const activeItem = sheetTrackList.querySelector('.sheet-track-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function renderCountryPills() {
  if (!countryPills) return;
  countryPills.innerHTML = COUNTRIES.map(c => {
    const isActive = c.id === currentCountry.id;
    return `
      <div class="zen-pill ${isActive ? 'active' : ''}" data-country-id="${c.id}">
        <span>${c.flag}</span>
        <span>${c.nameZh}</span>
      </div>
    `;
  }).join('');

  countryPills.querySelectorAll('.zen-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const target = COUNTRIES.find(c => c.id === pill.dataset.countryId);
      if (target) {
        selectCountry(target);
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });

  // Auto-scroll active pill into view
  const activePill = countryPills.querySelector('.zen-pill.active');
  if (activePill) {
    activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function licenseUrl(license) {
  const l = (license || '').toLowerCase();
  if (l.includes('cc0')) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (l.includes('public domain') || l.includes('pdm')) return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const m = l.match(/cc\s*by(-sa)?\s*([0-9.]+)(?:\s*(us|de|fr|ch))?/);
  if (m) {
    const type = m[1] ? m[1].slice(1) : 'by';
    const port = m[3] ? `/${m[3]}` : '';
    return `https://creativecommons.org/licenses/${type}/${m[2]}${port}/`;
  }
  return 'https://commons.wikimedia.org/';
}

function renderCreditsSheet() {
  if (!creditsList) return;
  const cats = CREDIT_CATEGORIES.filter(c => CREDITS.some(e => e.cat === c.id));
  creditsList.innerHTML = cats.map(c => {
    const items = CREDITS.filter(e => e.cat === c.id);
    return `
      <div class="credits-group-head">
        <span class="credits-group-title">${c.label} · ${items.length} 个文件</span>
        <span class="credits-group-note">${c.note}</span>
      </div>
      ${items.map(e => `
        <div class="credits-item" data-file="${e.file}" title="跳转到这首作品">
          <div class="credits-item-info">
            <a class="credits-item-name" href="${e.url}" target="_blank" rel="noopener noreferrer" title="在 Wikimedia Commons 查看原件与作者">${e.name}</a>
            <span class="credits-item-artist">${e.artist || '作者不详（公有领域）'}${e.nature ? ' · 自然声' : ''}</span>
          </div>
          <span class="credits-item-jump">▶</span>
          <a class="credits-item-license" href="${licenseUrl(e.license)}" target="_blank" rel="noopener noreferrer" title="查看许可全文">${e.license}</a>
        </div>
      `).join('')}
    `;
  }).join('');
}

async function jumpToCreditTrack(file) {
  if (!file || !creditsSheet) return;

  // Music entry -> the track using this file (prefer the current country)
  let target = null;
  const order = [currentCountry, ...COUNTRIES.filter(c => c.id !== currentCountry.id)];
  for (const c of order) {
    const idx = c.tracks.findIndex(t => (t.file || '').endsWith('/' + file));
    if (idx !== -1) {
      target = { country: c, trackIdx: idx };
      break;
    }
  }
  // Nature entry -> the first country whose soundscape uses this file
  if (!target) {
    const host = COUNTRIES.find(c => (c.natureAudio || '').endsWith('/' + file));
    if (host) target = { country: host, trackIdx: 0 };
  }
  if (!target) return;

  currentCountry = target.country;
  currentTrackIdx = target.trackIdx;
  if (isShuffleMode) {
    shuffleQueue = generateShuffleQueue(target.country.tracks, target.trackIdx);
    shuffleQueueIdx = Math.max(0, shuffleQueue.indexOf(target.trackIdx));
  }

  if (visualizer) visualizer.triggerTrackChangeWave();
  updateUIForCountry(target.country, target.trackIdx);
  renderCountryPills();
  creditsSheet.classList.remove('open');
  countrySheet.classList.remove('open');

  if (!isPlaying) {
    await engine.resume();
    await startPlayback();
  } else {
    await applyCurrentAudio();
  }
}

function renderRegionTabs() {
  if (!regionTabs) return;
  const REGION_LABELS = {
    all: '全部',
    asia: '亚洲',
    europe: '欧洲',
    americas: '美洲',
    mideast_africa: '中东/非洲'
  };
  // Only render tabs for regions that actually have countries, plus the "all" tab
  const regions = [...new Set(COUNTRIES.map(c => c.region))];
  const tabs = ['all', ...regions].map(key => {
    const count = key === 'all' ? COUNTRIES.length : COUNTRIES.filter(c => c.region === key).length;
    const isActive = key === currentRegion ? 'active' : '';
    return `<button class="sheet-tab ${isActive}" data-region="${key}">${REGION_LABELS[key] || key} (${count})</button>`;
  });
  regionTabs.innerHTML = tabs.join('');
}

function renderSheetCountryGrid() {
  if (!sheetCountryGrid) return;

  const sheetCountrySub = document.getElementById('sheetCountrySub');
  if (sheetCountrySub) {
    const totalTracks = COUNTRIES.reduce((sum, c) => sum + c.tracks.length, 0);
    sheetCountrySub.textContent = `${COUNTRIES.length} 个世界国度 · ${totalTracks} 首精选文化母带`;
  }

  const filtered = currentRegion === 'all'
    ? COUNTRIES
    : COUNTRIES.filter(c => c.region === currentRegion);

  sheetCountryGrid.innerHTML = filtered.map(c => {
    const isActive = c.id === currentCountry.id;
    return `
      <div class="sheet-country-card ${isActive ? 'active' : ''}" data-country-id="${c.id}">
        <div class="card-top">
          <span class="card-flag">${c.flag}</span>
          <span class="card-count-badge">${c.tracks.length} 首母带</span>
        </div>
        <div class="card-info">
          <span class="card-name-zh">${c.nameZh}</span>
          <span class="card-name-en">${c.nameEn}</span>
        </div>
        <span class="card-sub">${c.subtitle}</span>
      </div>
    `;
  }).join('');

  sheetCountryGrid.querySelectorAll('.sheet-country-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = COUNTRIES.find(c => c.id === card.dataset.countryId);
      if (target) {
        selectCountry(target);
        countrySheet.classList.remove('open');
      }
    });
  });
}
