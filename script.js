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
const SAHIN_AUDIO_SRC = 'data:audio/mp3;base64,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';
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
