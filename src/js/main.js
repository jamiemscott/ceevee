/* ─── Elements ─── */
const stage      = document.getElementById('cine-stage');
const frame      = document.getElementById('cine-frame');
const wrap       = document.getElementById('cine-wrap');
const video      = document.getElementById('cine-video');
const overlay    = document.getElementById('expand-overlay');
const heroSig    = document.getElementById('hero-sig');
const scrollHint = document.getElementById('scroll-hint');
const skipBtn    = document.getElementById('cine-skip');
const cdCountdown= document.getElementById('cine-countdown');
const cdNum      = document.getElementById('cd-num');
const cdFlash    = document.getElementById('cd-flash');
const cdSweep    = document.getElementById('cd-sweep');

/* ─── Film grain — runs from the start, over both countdown and video ─── */
const grain = document.createElement('canvas');
grain.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:7;opacity:0.11;pointer-events:none;transition:opacity 0.5s ease';
wrap.insertBefore(grain, wrap.querySelector('.cine-interference'));

const gCtx = grain.getContext('2d');
let grainRunning = true;

(function drawGrain() {
  if (!grainRunning) return;
  const w = grain.offsetWidth || 320, h = grain.offsetHeight || 240;
  const gw = w >> 1, gh = h >> 1;
  if (grain.width !== gw || grain.height !== gh) { grain.width = gw; grain.height = gh; }
  const img = gCtx.createImageData(gw, gh);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 220;
  }
  gCtx.putImageData(img, 0, 0);
  requestAnimationFrame(drawGrain);
})();

/* ─── Countdown ─── */
let count = 5;

function restartSweep() {
  cdSweep.style.animation = 'none';
  void cdSweep.offsetHeight;
  cdSweep.style.animation = 'cdSweep 1s linear forwards';
}
restartSweep();

function flashFrame(cb) {
  cdFlash.style.opacity = '1';
  setTimeout(() => { cdFlash.style.opacity = '0'; if (cb) cb(); }, 55);
}

const cdInterval = setInterval(() => {
  count--;

  if (count <= 0) {
    clearInterval(cdInterval);
    flashFrame(() => {
      setTimeout(() => {
        /* hard cut — countdown disappears, video begins in the same frame */
        cdCountdown.style.display = 'none';
        video.play();
      }, 80);
    });
    return;
  }

  flashFrame(() => { cdNum.textContent = count; });
  restartSweep();
}, 1000);

/* ─── Gate weave jitter ─── */
let jitterActive = true;
function scheduleJitter() {
  if (!jitterActive) return;
  const delay = 800 + Math.random() * 2400;
  setTimeout(() => {
    if (!jitterActive) return;
    const px = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2 | 0);
    frame.style.translate = `0 ${px}px`;
    setTimeout(() => { frame.style.translate = ''; scheduleJitter(); }, 65 + Math.random() * 80);
  }, delay);
}
scheduleJitter();

/* ─── Cue marks near end of reel ─── */
video.addEventListener('loadedmetadata', () => {
  const cueTrigger = Math.max(0, video.duration - 8);
  setTimeout(() => {
    if (expanded) return;
    ['.cine-mark--tr', '.cine-mark--br'].forEach(sel => {
      const el = wrap.querySelector(sel);
      el.style.animation = 'cueBlip 0.8s steps(1) 5';
    });
  }, cueTrigger * 1000);
});

/* ─── Expansion ─── */
let expanded = false;

function expand() {
  if (expanded) return;
  expanded = true;
  jitterActive = false;
  grainRunning = false;

  const rect   = wrap.getBoundingClientRect();
  const scaleX = window.innerWidth  / rect.width;
  const scaleY = window.innerHeight / rect.height;
  const scale  = Math.max(scaleX, scaleY) * 1.008;

  stage.classList.add('expand');
  wrap.style.transition = 'transform 3.2s cubic-bezier(0.76, 0, 0.24, 1)';
  wrap.style.transform  = `scale(${scale})`;

  skipBtn.style.opacity = '0';
  skipBtn.style.pointerEvents = 'none';

  setTimeout(() => { overlay.style.opacity = '1'; }, 400);
  setTimeout(() => { heroSig.classList.add('visible'); }, 1800);
  setTimeout(() => { scrollHint.classList.add('show'); }, 2800);
  setTimeout(() => {
    frame.style.translate = '';
    video.loop = true;
    video.play();
  }, 3400);
}

video.addEventListener('ended', expand);
skipBtn.addEventListener('click', expand);
document.addEventListener('keydown', e => {
  if (!expanded && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown')) {
    e.preventDefault();
    expand();
  }
});
