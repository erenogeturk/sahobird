// ═══════════════════════════════════════════════════════════════
//  SAHO BIRD — Flappy Bird Clone
//  Oyuncu sprite: piksel-art kafa görseli (base64 ile gömülü)
// ═══════════════════════════════════════════════════════════════

// ── Canvas kurulumu ──
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Oyun alanı sabit mantıksal boyut, sonra scale edilir
const LOGICAL_W = 400;
const LOGICAL_H = 600;

// Responsive ölçekleme
let scale = 1;
function resizeCanvas() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  scale = Math.min(maxW / LOGICAL_W, maxH / LOGICAL_H);
  canvas.width  = LOGICAL_W * scale;
  canvas.height = LOGICAL_H * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ═══════════════════════════════════════════════════════════════
//  SPRITE — Piksel-art kafa görseli base64 olarak gömülü
//  (Kullanıcının yüklediği PNG dosyası buraya yerleştirilmeli)
//  Aşağıdaki kod görseli Image objesi olarak yükler.
// ═══════════════════════════════════════════════════════════════
const playerImg = new Image();
playerImg.src = 'sprite.png';

let spriteLoaded = false;
let processedSprite = null; // Arka planı temizlenmiş sprite

playerImg.onload = () => {
  // Görseli offscreen canvas'a çiz, beyaz/açık pikselleri şeffaf yap
  const offscreen = document.createElement('canvas');
  offscreen.width  = playerImg.width;
  offscreen.height = playerImg.height;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(playerImg, 0, 0);

  const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Beyaz veya çok açık gri pikselleri şeffaf yap
    // Eşik: RGB değerlerinin hepsi 230'un üzerindeyse şeffaf
    if (r > 230 && g > 230 && b > 230) {
      data[i + 3] = 0; // Alpha = 0 (tamamen şeffaf)
    }
    // Hafif gri/beyaz geçişleri için yumuşak alpha
    else if (r > 200 && g > 200 && b > 200) {
      const brightness = (r + g + b) / 3;
      data[i + 3] = Math.floor(255 - ((brightness - 200) / 55 * 255));
    }
  }

  offCtx.putImageData(imageData, 0, 0);

  // İşlenmiş görseli Image'e dönüştür
  processedSprite = new Image();
  processedSprite.src = offscreen.toDataURL();
  processedSprite.onload = () => { spriteLoaded = true; };
};

playerImg.onerror = () => { spriteLoaded = false; };

// ═══════════════════════════════════════════════════════════════
//  SES — SpeechSynthesis API ile "ŞAHİN" sesi
// ═══════════════════════════════════════════════════════════════
let voices = [];
let sahinVoice = null;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  // Türkçe erkek sesi ara, yoksa ilk sesi kullan
  sahinVoice = voices.find(v => v.lang === 'tr-TR') || voices[0] || null;
}

// Tarayıcılar voices'ı async yükler
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function playSahinSound() {
  // Önceki sesi kes — sürekli tıklamada üst üste binmesin
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance('şaayiiin');
  utterance.lang  = 'tr-TR';
  utterance.pitch = 1.9;       // Yüksek, sinir bozucu pitch
  utterance.rate  = 1.4;       // Hızlı
  utterance.volume = 1.0;

  if (sahinVoice) utterance.voice = sahinVoice;

  window.speechSynthesis.speak(utterance);
}

// ═══════════════════════════════════════════════════════════════
//  OYUN SABİTLERİ
// ═══════════════════════════════════════════════════════════════
const GRAVITY       = 0.5;     // Piksel/frame² yerçekimi
const FLAP_FORCE    = -9.5;    // Zıplama kuvveti (yukarı = negatif)
const PIPE_SPEED    = 2.8;     // Boru hareket hızı
const PIPE_GAP      = 150;     // Borular arası boşluk yüksekliği
const PIPE_INTERVAL = 1600;    // Yeni boru üretme süresi (ms)
const PIPE_WIDTH    = 58;      // Boru genişliği
const GROUND_H      = 80;      // Zemin yüksekliği

// Oyuncu boyutu
const PLAYER_W = 52;
const PLAYER_H = 48;

// Renk paleti
const COLORS = {
  sky:         '#70c5ce',
  skyGrad1:    '#5ab4c2',
  skyGrad2:    '#a8dfea',
  pipeBody:    '#4caf50',
  pipeDark:    '#388e3c',
  pipeLight:   '#81c784',
  pipeCap:     '#2e7d32',
  pipeCapLine: '#1b5e20',
  ground:      '#ded895',
  groundDark:  '#c8c278',
  groundDirt:  '#a0522d',
  cloud:       '#ffffff',
  scoreText:   '#ffffff',
  scoreShadow: '#333333',
};

// ═══════════════════════════════════════════════════════════════
//  OYUN DURUMU
// ═══════════════════════════════════════════════════════════════
const STATE = { START: 0, PLAYING: 1, DEAD: 2 };

let gameState;
let score, bestScore;
let player, pipes, clouds;
let lastPipeTime, frameCount;
let groundOffset; // Zemin kaydırma animasyonu

function initGame() {
  gameState = STATE.START;
  score     = 0;
  bestScore = parseInt(localStorage.getItem('sahobird_best') || '0');

  // Oyuncu başlangıç konumu
  player = {
    x:        100,
    y:        LOGICAL_H / 2,
    vy:       0,
    rotation: 0,   // görsel eğim açısı (radyan)
    alive:    true,
  };

  pipes       = [];
  clouds      = generateInitialClouds();
  lastPipeTime = 0;
  frameCount   = 0;
  groundOffset = 0;
}

// ═══════════════════════════════════════════════════════════════
//  BULUTLAR
// ═══════════════════════════════════════════════════════════════
function generateInitialClouds() {
  const arr = [];
  for (let i = 0; i < 5; i++) {
    arr.push({
      x:    Math.random() * LOGICAL_W,
      y:    20 + Math.random() * 140,
      w:    50 + Math.random() * 60,
      h:    20 + Math.random() * 20,
      speed: 0.3 + Math.random() * 0.3,
    });
  }
  return arr;
}

// ═══════════════════════════════════════════════════════════════
//  BORU ÜRETİMİ
// ═══════════════════════════════════════════════════════════════
function spawnPipe() {
  const minY  = 60;
  const maxY  = LOGICAL_H - GROUND_H - PIPE_GAP - 60;
  const gapY  = minY + Math.random() * (maxY - minY); // Boşluğun üst noktası

  pipes.push({
    x:       LOGICAL_W + 10,
    gapTop:  gapY,              // Üst borunun alt kenarı
    gapBot:  gapY + PIPE_GAP,  // Alt borunun üst kenarı
    scored:  false,             // Bu boru için skor verildi mi
  });
}

// ═══════════════════════════════════════════════════════════════
//  ÇİZİM FONKSİYONLARI
// ═══════════════════════════════════════════════════════════════

/** Arka plan gökyüzü gradyanı */
function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, 0, LOGICAL_H - GROUND_H);
  grd.addColorStop(0, COLORS.skyGrad1);
  grd.addColorStop(1, COLORS.skyGrad2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H - GROUND_H);
}

/** Piksel-art bulut */
function drawCloud(c) {
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  // Ana gövde
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sol yumru
  ctx.beginPath();
  ctx.ellipse(c.x - c.w * 0.28, c.y + 4, c.w * 0.28, c.h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sağ yumru
  ctx.beginPath();
  ctx.ellipse(c.x + c.w * 0.28, c.y + 4, c.w * 0.28, c.h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  // Üst yumru
  ctx.beginPath();
  ctx.ellipse(c.x + c.w * 0.08, c.y - c.h * 0.3, c.w * 0.22, c.h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Piksel-art boru (üst veya alt) */
function drawPipe(x, y, height, isTop) {
  // Gövde — koyu yeşil zemin
  ctx.fillStyle = COLORS.pipeBody;
  ctx.fillRect(x, y, PIPE_WIDTH, height);

  // Sol gölge şeridi
  ctx.fillStyle = COLORS.pipeDark;
  ctx.fillRect(x, y, 8, height);

  // Sağ parlak şerit
  ctx.fillStyle = COLORS.pipeLight;
  ctx.fillRect(x + PIPE_WIDTH - 6, y, 6, height);

  // Kapak (boru ağzı)
  const capH = 22;
  const capX = x - 5;
  const capW = PIPE_WIDTH + 10;
  let   capY = isTop ? y + height - capH : y;

  ctx.fillStyle = COLORS.pipeBody;
  ctx.fillRect(capX, capY, capW, capH);

  // Kapak koyu kenar
  ctx.fillStyle = COLORS.pipeDark;
  ctx.fillRect(capX, capY, 8, capH);
  ctx.fillStyle = COLORS.pipeLight;
  ctx.fillRect(capX + capW - 6, capY, 6, capH);

  // Kapak üst/alt çizgi
  ctx.fillStyle = COLORS.pipeCapLine;
  if (isTop) {
    ctx.fillRect(capX, capY + capH - 3, capW, 3);
  } else {
    ctx.fillRect(capX, capY, capW, 3);
  }
}

/** Zemin */
function drawGround() {
  const gy = LOGICAL_H - GROUND_H;

  // Toprak katmanı
  ctx.fillStyle = COLORS.groundDirt;
  ctx.fillRect(0, gy + 18, LOGICAL_W, GROUND_H - 18);

  // Çim katmanı
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, gy, LOGICAL_W, 20);

  // Çim detay çizgileri (kaydırmalı)
  ctx.fillStyle = COLORS.groundDark;
  const stripeW = 24;
  const offset  = Math.floor(groundOffset) % stripeW;
  for (let sx = -stripeW + offset; sx < LOGICAL_W; sx += stripeW) {
    ctx.fillRect(sx, gy, 12, 8);
  }

  // Toprak-çim sınır çizgisi
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, gy + 18, LOGICAL_W, 2);
}

/** Oyuncu (piksel-art sprite veya fallback) */
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Düşerken eğilme, zıplarken düzelme
  ctx.rotate(player.rotation);

  if (spriteLoaded && processedSprite) {
    // Arka planı temizlenmiş piksel-art görsel
    ctx.drawImage(processedSprite, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H);
  } else {
    // Fallback: basit piksel-art kuş çizimi
    drawFallbackBird();
  }

  ctx.restore();
}

/** Sprite yüklenemezse çizilecek fallback kuş */
function drawFallbackBird() {
  const w = PLAYER_W, h = PLAYER_H;
  // Gövde
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Göz
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(w * 0.2, -h * 0.1, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(w * 0.22, -h * 0.1, 4, 0, Math.PI * 2);
  ctx.fill();
  // Gaga
  ctx.fillStyle = '#e87722';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, 0);
  ctx.lineTo(w * 0.65, h * 0.08);
  ctx.lineTo(w * 0.42, h * 0.16);
  ctx.fill();
}

/** HUD — Skor ve en yüksek skor */
function drawHUD() {
  // Güncel skor
  ctx.font         = 'bold 36px "Courier New"';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = COLORS.scoreShadow;
  ctx.fillText(score, LOGICAL_W / 2 + 2, 58);
  ctx.fillStyle    = COLORS.scoreText;
  ctx.fillText(score, LOGICAL_W / 2, 56);

  // En yüksek skor
  ctx.font      = 'bold 14px "Courier New"';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('EN İYİ: ' + bestScore, LOGICAL_W / 2, 78);
}

/** Başlangıç ekranı */
function drawStartScreen() {
  // Yarı saydam overlay
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Başlık kutusu
  const bx = 40, by = 140, bw = LOGICAL_W - 80, bh = 90;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth   = 3;
  roundRect(bx, by, bw, bh, 12);
  ctx.stroke();

  // SAHO BIRD yazısı
  ctx.font      = 'bold 38px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur  = 16;
  ctx.fillText('SAHO BIRD', LOGICAL_W / 2, by + 44);
  ctx.shadowBlur = 0;

  // Alt yazı
  ctx.font      = 'bold 13px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Flappy Bird · Saho Edition', LOGICAL_W / 2, by + 72);

  // Tıkla butonu (titreşimli)
  const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.08);
  ctx.save();
  ctx.translate(LOGICAL_W / 2, 310);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(-100, -22, 200, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 2;
  roundRect(-100, -22, 200, 44, 10);
  ctx.stroke();
  ctx.font      = 'bold 16px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('▶  TIKLA / SPACE', 0, 7);
  ctx.restore();

  // En yüksek skor
  if (bestScore > 0) {
    ctx.font      = '13px "Courier New"';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('En Yüksek Skor: ' + bestScore, LOGICAL_W / 2, 375);
  }

  // Kontroller bilgisi
  ctx.font      = '11px "Courier New"';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Tıkla / Dokun / Space → Zıpla', LOGICAL_W / 2, 410);
  ctx.fillText('(Ve "ŞAHİN" sesini duy!)', LOGICAL_W / 2, 428);
}

/** Game Over ekranı */
function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Panel
  const bx = 44, by = 160, bw = LOGICAL_W - 88, bh = 220;
  ctx.fillStyle = 'rgba(20,20,20,0.85)';
  roundRect(bx, by, bw, bh, 14);
  ctx.fill();
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth   = 3;
  roundRect(bx, by, bw, bh, 14);
  ctx.stroke();

  // OYUN BİTTİ
  ctx.font        = 'bold 30px "Courier New"';
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur  = 20;
  ctx.fillText('OYUN BİTTİ', LOGICAL_W / 2, by + 46);
  ctx.shadowBlur  = 0;

  // Skor çizgisi
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(bx + 20, by + 60, bw - 40, 1);

  // Güncel skor
  ctx.font      = '14px "Courier New"';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('SKOR', LOGICAL_W / 2, by + 90);
  ctx.font      = 'bold 42px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(score, LOGICAL_W / 2, by + 130);

  // En yüksek skor
  ctx.font      = '13px "Courier New"';
  ctx.fillStyle = score >= bestScore ? '#ffd700' : 'rgba(255,255,255,0.5)';
  if (score >= bestScore && score > 0) {
    ctx.fillText('🏆 YENİ REKOR! EN İYİ: ' + bestScore, LOGICAL_W / 2, by + 158);
  } else {
    ctx.fillText('EN YÜKSEK SKOR: ' + bestScore, LOGICAL_W / 2, by + 158);
  }

  // Tekrar Oyna butonu
  const pulse = 0.92 + 0.08 * Math.sin(frameCount * 0.1);
  ctx.save();
  ctx.translate(LOGICAL_W / 2, by + 198);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#4caf50';
  roundRect(-88, -20, 176, 40, 8);
  ctx.fill();
  ctx.font      = 'bold 15px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('▶  TEKRAR OYNA', 0, 6);
  ctx.restore();
}

/** Yardımcı: yuvarlatılmış dikdörtgen path */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
//  OYUN MANTIĞI — GÜNCELLEME
// ═══════════════════════════════════════════════════════════════

function updatePlayer() {
  // Yerçekimi uygula
  player.vy += GRAVITY;
  player.y  += player.vy;

  // Görsel eğim: yukarı giderken düzelir, düşerken eğilir
  const targetRot = Math.max(-0.5, Math.min(1.2, player.vy * 0.06));
  player.rotation += (targetRot - player.rotation) * 0.15;

  // Zemine çarpma kontrolü
  if (player.y + PLAYER_H / 2 >= LOGICAL_H - GROUND_H) {
    player.y = LOGICAL_H - GROUND_H - PLAYER_H / 2;
    killPlayer();
    return;
  }

  // Tavan kontrolü
  if (player.y - PLAYER_H / 2 <= 0) {
    player.y  = PLAYER_H / 2;
    player.vy = 0;
  }
}

function updatePipes(now) {
  // Yeni boru üret
  if (now - lastPipeTime > PIPE_INTERVAL) {
    spawnPipe();
    lastPipeTime = now;
  }

  // Boruları güncelle
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= PIPE_SPEED;

    // Skor: oyuncu boruyu geçti mi?
    if (!p.scored && p.x + PIPE_WIDTH < player.x - PLAYER_W / 2) {
      p.scored = true;
      score++;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('sahobird_best', bestScore);
      }
    }

    // Ekrandan çıkan boruları sil
    if (p.x + PIPE_WIDTH + 20 < 0) {
      pipes.splice(i, 1);
    }
  }
}

function updateClouds() {
  for (const c of clouds) {
    c.x -= c.speed;
    if (c.x + c.w < 0) {
      // Sağdan yeniden gir
      c.x = LOGICAL_W + c.w;
      c.y = 20 + Math.random() * 140;
    }
  }
}

/** Çarpışma kontrolü — AABB + tolerans */
function checkCollisions() {
  const px = player.x - PLAYER_W * 0.38;
  const py = player.y - PLAYER_H * 0.42;
  const pw = PLAYER_W * 0.76;
  const ph = PLAYER_H * 0.84;

  for (const pipe of pipes) {
    const capExt = 5; // Kapaklı boru genişliği ek payı

    // Üst boru çarpışması
    if (
      px + pw > pipe.x - capExt &&
      px      < pipe.x + PIPE_WIDTH + capExt &&
      py      < pipe.gapTop
    ) {
      killPlayer();
      return;
    }

    // Alt boru çarpışması
    if (
      px + pw > pipe.x - capExt &&
      px      < pipe.x + PIPE_WIDTH + capExt &&
      py + ph > pipe.gapBot
    ) {
      killPlayer();
      return;
    }
  }
}

function killPlayer() {
  if (!player.alive) return;
  player.alive = false;
  gameState    = STATE.DEAD;
  // Ses sistemi: ölüm anında bir son "şaayin" (opsiyonel)
  // playSahinSound();
}

// ═══════════════════════════════════════════════════════════════
//  ZIPLAMA
// ═══════════════════════════════════════════════════════════════
function flap() {
  if (gameState === STATE.START) {
    // Oyunu başlat
    gameState    = STATE.PLAYING;
    lastPipeTime = performance.now();
    player.vy    = FLAP_FORCE;
    playSahinSound();
    return;
  }

  if (gameState === STATE.PLAYING && player.alive) {
    player.vy = FLAP_FORCE;
    playSahinSound();
    return;
  }

  if (gameState === STATE.DEAD) {
    // Tekrar oyna
    initGame();
    gameState    = STATE.PLAYING;
    lastPipeTime = performance.now();
    player.vy    = FLAP_FORCE;
    playSahinSound();
  }
}

// ═══════════════════════════════════════════════════════════════
//  ANA OYUN DÖNGÜSÜ
// ═══════════════════════════════════════════════════════════════
function gameLoop(now) {
  frameCount++;

  // ── Güncelleme ──
  if (gameState === STATE.PLAYING) {
    updatePlayer();
    updatePipes(now);
    updateClouds();
    groundOffset += PIPE_SPEED;
    checkCollisions();
  } else if (gameState === STATE.START) {
    // Başlangıç animasyonu — karakter hafif sallanır
    player.y  = LOGICAL_H / 2 + Math.sin(frameCount * 0.05) * 8;
    updateClouds();
  } else if (gameState === STATE.DEAD) {
    // Ölüm animasyonu — karakter düşmeye devam eder
    if (player.y < LOGICAL_H - GROUND_H - PLAYER_H / 2) {
      player.vy       += GRAVITY * 1.5;
      player.y        += player.vy;
      player.rotation += 0.12;
    }
    updateClouds();
  }

  // ── Çizim ──
  drawBackground();

  // Bulutlar
  for (const c of clouds) drawCloud(c);

  // Borular
  for (const p of pipes) {
    // Üst boru
    drawPipe(p.x, 0, p.gapTop, true);
    // Alt boru
    drawPipe(p.x, p.gapBot, LOGICAL_H - GROUND_H - p.gapBot, false);
  }

  // Zemin
  drawGround();

  // Oyuncu
  drawPlayer();

  // HUD (sadece oynama ve ölüm anında)
  if (gameState === STATE.PLAYING || gameState === STATE.DEAD) {
    drawHUD();
  }

  // Ekranlar
  if (gameState === STATE.START) drawStartScreen();
  if (gameState === STATE.DEAD)  drawGameOverScreen();

  requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════
//  GİRİŞ ALGILAMA
// ═══════════════════════════════════════════════════════════════

// Klavye
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    flap();
  }
});

// Mouse tıklama
canvas.addEventListener('click', e => {
  e.preventDefault();
  flap();
});

// Dokunmatik ekran
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  flap();
}, { passive: false });

// ── Başlat ──
initGame();
requestAnimationFrame(gameLoop);
