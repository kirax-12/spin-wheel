/* Spin Wheel — roda pengacak nama.
   Canvas + requestAnimationFrame, tanpa library. */

"use strict";

const MAX_NAMES = 24;
const DEFAULT_NAMES = ["Andi", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gilang", "Hana"];

const PALETTE = [
  "#FFD23F", "#FF90E8", "#7AB8FF", "#4ADE80", "#FF7A45",
  "#FF6B5E", "#C39BFF", "#3ED6C5", "#B5E048", "#FFB25E",
];

const textarea = document.getElementById("names-input");
const countBadge = document.getElementById("name-count");
const warnEl = document.getElementById("names-warn");
const spinBtn = document.getElementById("btn-spin");
const spinHint = document.getElementById("spin-hint");
const shuffleBtn = document.getElementById("btn-shuffle");
const resetBtn = document.getElementById("btn-reset");
const winnerBox = document.getElementById("winner");
const winnerNameEl = document.getElementById("winner-name");
const removeWinnerBtn = document.getElementById("btn-remove-winner");
const spinAgainBtn = document.getElementById("btn-spin-again");

const wheelCanvas = document.getElementById("wheel");
const wctx = wheelCanvas.getContext("2d");
const SIZE = 520;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;

const confettiCanvas = document.getElementById("confetti");
const cctx = confettiCanvas.getContext("2d");

let rotation = 0;          // radian, posisi roda sekarang
let spinning = false;
let lastWinnerIndex = -1;  // index di daftar nama aktif
let lastWinnerName = "";
let audioCtx = null;

/* ---------- daftar nama ---------- */

function parseNames() {
  return textarea.value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function activeNames() {
  return parseNames().slice(0, MAX_NAMES);
}

function refreshMeta() {
  const all = parseNames();
  const names = activeNames();
  countBadge.textContent = names.length + " nama";

  if (all.length > MAX_NAMES) {
    warnEl.hidden = false;
    warnEl.textContent =
      "Kamu ngisi " + all.length + " nama — rodanya cuma muat " + MAX_NAMES +
      ". Yang dipakai " + MAX_NAMES + " nama pertama, sisanya diabaikan dulu ya.";
  } else {
    warnEl.hidden = true;
  }

  const enough = names.length >= 2;
  spinHint.hidden = enough;
  spinBtn.disabled = !enough || spinning;
  return names;
}

/* ---------- gambar roda ---------- */

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  wheelCanvas.width = SIZE * dpr;
  wheelCanvas.height = SIZE * dpr;
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function truncate(text, maxChars) {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
}

function drawWheel() {
  const names = activeNames();
  const n = names.length;
  wctx.clearRect(0, 0, SIZE, SIZE);

  // ring luar
  wctx.beginPath();
  wctx.arc(CENTER, CENTER, RADIUS + 3, 0, Math.PI * 2);
  wctx.fillStyle = "#111111";
  wctx.fill();

  if (n === 0) {
    wctx.beginPath();
    wctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    wctx.fillStyle = "#ffffff";
    wctx.fill();
    wctx.fillStyle = "#55534e";
    wctx.font = "700 20px 'Space Grotesk', sans-serif";
    wctx.textAlign = "center";
    wctx.textBaseline = "middle";
    wctx.fillText("rodanya masih kosong", CENTER, CENTER - 12);
    wctx.font = "400 15px 'Space Mono', monospace";
    wctx.fillText("isi nama di samping →", CENTER, CENTER + 18);
    return;
  }

  const seg = (Math.PI * 2) / n;
  const maxChars = n <= 8 ? 16 : n <= 12 ? 13 : n <= 16 ? 11 : 9;
  const fontSize = n <= 6 ? 22 : n <= 10 ? 19 : n <= 14 ? 16 : n <= 18 ? 14 : 12;

  for (let i = 0; i < n; i++) {
    const start = rotation + i * seg;
    const end = start + seg;

    wctx.beginPath();
    wctx.moveTo(CENTER, CENTER);
    wctx.arc(CENTER, CENTER, RADIUS, start, end);
    wctx.closePath();
    wctx.fillStyle = PALETTE[i % PALETTE.length];
    wctx.fill();
    wctx.lineWidth = 2;
    wctx.strokeStyle = "#111111";
    wctx.stroke();

    // label di sepanjang segmen, dibaca dari tengah ke luar
    wctx.save();
    wctx.translate(CENTER, CENTER);
    wctx.rotate(start + seg / 2);
    wctx.textAlign = "right";
    wctx.textBaseline = "middle";
    wctx.fillStyle = "#111111";
    wctx.font = "700 " + fontSize + "px 'Space Grotesk', sans-serif";
    wctx.fillText(truncate(names[i], maxChars), RADIUS - 52, 0);
    wctx.restore();
  }

  // lingkaran tengah (di bawah hub HTML, buat jaga-jaga)
  wctx.beginPath();
  wctx.arc(CENTER, CENTER, 47, 0, Math.PI * 2);
  wctx.fillStyle = "#FFD23F";
  wctx.fill();
  wctx.lineWidth = 2;
  wctx.strokeStyle = "#111111";
  wctx.stroke();
}

function pointerIndex() {
  const names = activeNames();
  const n = names.length;
  if (n === 0) return -1;
  const seg = (Math.PI * 2) / n;
  const pointerAngle = -Math.PI / 2; // jarum di atas
  let rel = (pointerAngle - rotation) % (Math.PI * 2);
  if (rel < 0) rel += Math.PI * 2;
  return Math.floor(rel / seg) % n;
}

/* ---------- suara ---------- */

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function tick() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1500, t);
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

function winJingle() {
  if (!audioCtx) return;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const t = audioCtx.currentTime + i * 0.11;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

/* ---------- putaran ---------- */

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function setControlsLocked(locked) {
  spinning = locked;
  textarea.disabled = locked;
  shuffleBtn.disabled = locked;
  resetBtn.disabled = locked;
  spinAgainBtn.disabled = locked;
  removeWinnerBtn.disabled = locked;
  refreshMeta();
  spinBtn.textContent = locked ? "MUTER…" : "PUTAR! →";
}

function spin() {
  const names = refreshMeta();
  if (spinning || names.length < 2) return;

  ensureAudio();
  winnerBox.hidden = true;
  setControlsLocked(true);

  const duration = 5000 + Math.random() * 3000; // 5–8 detik
  const extraTurns = (5 + Math.random() * 2) * Math.PI * 2 + Math.random() * Math.PI * 2;
  const startRotation = rotation;
  const startTime = performance.now();
  let lastTickIndex = pointerIndex();

  function frame(now) {
    const elapsed = now - startTime;
    const p = Math.min(elapsed / duration, 1);
    rotation = startRotation + extraTurns * easeOutCubic(p);
    drawWheel();

    const idx = pointerIndex();
    if (idx !== lastTickIndex) {
      lastTickIndex = idx;
      if (p < 0.985) tick();
    }

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      rotation = rotation % (Math.PI * 2);
      drawWheel();
      finishSpin();
    }
  }
  requestAnimationFrame(frame);
}

function finishSpin() {
  const names = activeNames();
  const idx = pointerIndex();
  setControlsLocked(false);
  if (idx < 0) return;

  lastWinnerIndex = idx;
  lastWinnerName = names[idx];
  winnerNameEl.textContent = lastWinnerName;
  winnerBox.hidden = false;
  winJingle();
  burstConfetti();
  winnerBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ---------- confetti ---------- */

let confettiParticles = [];
let confettiRunning = false;

function sizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function burstConfetti() {
  sizeConfettiCanvas();
  const rect = wheelCanvas.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < 150; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    confettiParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      life: 1,
      decay: 0.004 + Math.random() * 0.005,
    });
  }

  if (!confettiRunning) {
    confettiRunning = true;
    requestAnimationFrame(confettiFrame);
  }
}

function confettiFrame() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < confettiCanvas.height + 30);

  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.16;      // gravitasi
    p.vx *= 0.99;      // hambatan udara
    p.rot += p.vrot;
    p.life -= p.decay;

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.globalAlpha = Math.max(p.life, 0);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cctx.restore();
  }

  if (confettiParticles.length > 0) {
    requestAnimationFrame(confettiFrame);
  } else {
    confettiRunning = false;
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

/* ---------- aksi-aksi ---------- */

function shuffleNames() {
  const names = parseNames();
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  textarea.value = names.join("\n");
  winnerBox.hidden = true;
  rotation = 0;
  refreshMeta();
  drawWheel();
}

function removeWinner() {
  if (lastWinnerIndex < 0) return;
  const names = activeNames();
  if (lastWinnerIndex >= names.length) return;
  names.splice(lastWinnerIndex, 1);
  textarea.value = names.join("\n");
  lastWinnerIndex = -1;
  lastWinnerName = "";
  winnerBox.hidden = true;
  refreshMeta();
  drawWheel();
}

textarea.addEventListener("input", () => {
  if (spinning) return;
  winnerBox.hidden = true;
  refreshMeta();
  drawWheel();
});

spinBtn.addEventListener("click", spin);
spinAgainBtn.addEventListener("click", spin);
shuffleBtn.addEventListener("click", shuffleNames);
removeWinnerBtn.addEventListener("click", removeWinner);
resetBtn.addEventListener("click", () => {
  textarea.value = DEFAULT_NAMES.join("\n");
  winnerBox.hidden = true;
  rotation = 0;
  refreshMeta();
  drawWheel();
});

window.addEventListener("resize", sizeConfettiCanvas);

/* ---------- mulai ---------- */

fitCanvas();
sizeConfettiCanvas();
refreshMeta();
drawWheel();
