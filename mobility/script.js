const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  siteNav.classList.toggle('is-open', !open);
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  });
});

const tabs = [...document.querySelectorAll('[role="tab"]')];

function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else nextIndex = (index + 1) % tabs.length;
    activateTab(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
});

const sourcesButton = document.querySelector('.sources-toggle');
const sourceList = document.getElementById('source-list');

sourcesButton?.addEventListener('click', () => {
  const open = sourcesButton.getAttribute('aria-expanded') === 'true';
  sourcesButton.setAttribute('aria-expanded', String(!open));
  sourceList.hidden = open;
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const backgroundMusic = document.getElementById('background-music');
const musicToggle = document.querySelector('.music-toggle');
const musicLabel = musicToggle?.querySelector('.music-label');
const lyricsPanel = document.getElementById('lyrics-panel');
const lyricsToggle = document.querySelector('.lyrics-toggle');
const lyricsClose = document.querySelector('.lyrics-close');
const lyricsScroll = document.getElementById('lyrics-scroll');
const musicStatus = document.getElementById('music-status');
const lyricEntries = [];
let activeLyricIndex = -1;
let lyricsDismissed = false;
let lyricAnimationFrame = 0;

function lyricLanguage(sectionLanguage, text) {
  if (text.startsWith('🇩🇰')) return 'dk';
  if (text.startsWith('🇸🇪')) return 'se';
  if (text.startsWith('🇳🇴')) return 'no';
  if (text.startsWith('🇫🇮')) return 'fi';
  return sectionLanguage === 'mix' ? 'mix' : sectionLanguage;
}

function renderLyrics() {
  if (!lyricsScroll || !Array.isArray(window.NORDIC_LYRICS)) return;
  window.NORDIC_LYRICS.forEach((section) => {
    const heading = document.createElement('p');
    heading.className = 'lyrics-section';
    heading.textContent = section.title;
    lyricsScroll.appendChild(heading);
    section.lines.forEach((text, lineIndex) => {
      const line = document.createElement('button');
      line.type = 'button';
      line.className = 'lyric-line';
      line.dataset.lang = lyricLanguage(section.lang, text);
      line.textContent = text;
      lyricsScroll.appendChild(line);
      const entry = { element: line, text, sectionStart: lineIndex === 0, start: 0 };
      lyricEntries.push(entry);
      line.addEventListener('click', async () => {
        if (!backgroundMusic) return;
        backgroundMusic.currentTime = entry.start;
        await playBackgroundMusic();
        updateLyrics(entry.start, true);
      });
    });
  });
}

function setLyricsOpen(open) {
  if (!lyricsPanel || !lyricsToggle) return;
  lyricsPanel.hidden = !open;
  lyricsToggle.setAttribute('aria-expanded', String(open));
}

function buildLyricTimeline() {
  if (!backgroundMusic || !Number.isFinite(backgroundMusic.duration) || !lyricEntries.length) return;
  const lead = 3.5;
  const usable = Math.max(1, backgroundMusic.duration - lead - 3);
  const weights = lyricEntries.map(({ text, sectionStart }) => {
    const cleanLength = text.replace(/^🇩🇰 |^🇸🇪 |^🇳🇴 |^🇫🇮 /, '').length;
    return Math.max(1.5, Math.min(3.5, 1.25 + cleanLength / 20)) + (sectionStart ? 0.55 : 0);
  });
  const scale = usable / weights.reduce((sum, value) => sum + value, 0);
  let cursor = lead;
  lyricEntries.forEach((entry, index) => {
    entry.start = cursor;
    cursor += weights[index] * scale;
  });
}

function updateLyrics(time, forceScroll = false) {
  if (!lyricEntries.length) return;
  let nextIndex = 0;
  for (let index = lyricEntries.length - 1; index >= 0; index -= 1) {
    if (time >= lyricEntries[index].start) {
      nextIndex = index;
      break;
    }
  }
  if (nextIndex === activeLyricIndex && !forceScroll) return;
  lyricEntries[activeLyricIndex]?.element.classList.remove('is-current');
  const active = lyricEntries[nextIndex]?.element;
  active?.classList.add('is-current');
  activeLyricIndex = nextIndex;
  if (!lyricsPanel?.hidden && active && lyricsScroll) {
    const targetTop = Math.max(0, active.offsetTop - lyricsScroll.clientHeight * 0.42);
    if (typeof lyricsScroll.scrollTo === 'function') lyricsScroll.scrollTo({ top: targetTop, behavior: 'smooth' });
    else lyricsScroll.scrollTop = targetTop;
  }
}

function syncLyricsContinuously() {
  if (!backgroundMusic || backgroundMusic.paused) return;
  updateLyrics(backgroundMusic.currentTime);
  lyricAnimationFrame = window.requestAnimationFrame(syncLyricsContinuously);
}

function setMusicStatus(message, isError = false) {
  if (!musicStatus) return;
  musicStatus.textContent = message;
  musicStatus.classList.toggle('is-error', isError);
}

renderLyrics();
lyricsToggle?.addEventListener('click', () => {
  const open = lyricsToggle.getAttribute('aria-expanded') !== 'true';
  lyricsDismissed = false;
  setLyricsOpen(open);
  if (open) updateLyrics(backgroundMusic?.currentTime || 0, true);
});
lyricsClose?.addEventListener('click', () => {
  lyricsDismissed = true;
  setLyricsOpen(false);
});

function updateMusicButton(isPlaying) {
  if (!musicToggle || !musicLabel) return;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.title = isPlaying ? '停止播放音樂' : '播放背景音樂';
  musicLabel.textContent = isPlaying ? '停止音樂' : '播放音樂';
}

async function playBackgroundMusic() {
  if (!backgroundMusic) return false;
  backgroundMusic.volume = 0.32;
  try {
    await backgroundMusic.play();
    return true;
  } catch {
    updateMusicButton(false);
    setLyricsOpen(true);
    setMusicStatus('手機瀏覽器已阻擋自動播放，請按上方原生播放鍵。', true);
    return false;
  }
}

musicToggle?.addEventListener('click', async () => {
  if (!backgroundMusic) return;
  if (backgroundMusic.paused) await playBackgroundMusic();
  else {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    updateMusicButton(false);
    updateLyrics(0, true);
  }
});

window.addEventListener('load', playBackgroundMusic, { once: true });
document.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.music-dock, .lyrics-panel') && backgroundMusic?.paused) playBackgroundMusic();
}, { once: true });

backgroundMusic?.addEventListener('loadedmetadata', () => {
  buildLyricTimeline();
  updateLyrics(backgroundMusic.currentTime, true);
  setMusicStatus(`歌曲已就緒 · ${Math.floor(backgroundMusic.duration / 60)}:${String(Math.floor(backgroundMusic.duration % 60)).padStart(2, '0')}`);
});
backgroundMusic?.addEventListener('durationchange', buildLyricTimeline);
backgroundMusic?.addEventListener('timeupdate', () => updateLyrics(backgroundMusic.currentTime));
backgroundMusic?.addEventListener('seeked', () => updateLyrics(backgroundMusic.currentTime, true));
backgroundMusic?.addEventListener('play', () => {
  updateMusicButton(true);
  setMusicStatus('播放中 · 歌詞會隨音樂自動捲動');
  if (!lyricsDismissed) setLyricsOpen(true);
  window.cancelAnimationFrame(lyricAnimationFrame);
  lyricAnimationFrame = window.requestAnimationFrame(syncLyricsContinuously);
});
backgroundMusic?.addEventListener('pause', () => {
  updateMusicButton(false);
  window.cancelAnimationFrame(lyricAnimationFrame);
  if (backgroundMusic.currentTime > 0) setMusicStatus('已暫停 · 按播放鍵可繼續');
});
backgroundMusic?.addEventListener('error', () => {
  updateMusicButton(false);
  setLyricsOpen(true);
  setMusicStatus('音樂載入失敗，請重新整理頁面後再試。', true);
});
