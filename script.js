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
//  SES — Kendi sesin (base64 gömülü, ekstra dosya yok)
// ═══════════════════════════════════════════════════════════════
const SAHIN_AUDIO_SRC = 'data:audio/m4a;base64,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';

function playSahinSound() {
  try {
    // Her zıplamada yeni Audio objesi — iOS'ta üst üste binme olmaz
    const audio = new Audio(SAHIN_AUDIO_SRC);
    audio.volume = 1.0;
    const p = audio.play();
    if (p) p.catch(() => {});
  } catch(e) {}
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
