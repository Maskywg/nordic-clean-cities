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

function updateMusicButton(isPlaying) {
  if (!musicToggle || !musicLabel) return;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.title = isPlaying ? '暫停背景音樂' : '播放背景音樂';
  musicLabel.textContent = isPlaying ? '音樂播放中' : '播放音樂';
}

async function playBackgroundMusic() {
  if (!backgroundMusic) return false;
  backgroundMusic.volume = 0.32;
  try {
    await backgroundMusic.play();
    updateMusicButton(true);
    return true;
  } catch {
    updateMusicButton(false);
    return false;
  }
}

musicToggle?.addEventListener('click', async () => {
  if (!backgroundMusic) return;
  if (backgroundMusic.paused) await playBackgroundMusic();
  else {
    backgroundMusic.pause();
    updateMusicButton(false);
  }
});

window.addEventListener('load', playBackgroundMusic, { once: true });
document.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.music-toggle') && backgroundMusic?.paused) playBackgroundMusic();
}, { once: true });
