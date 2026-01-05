const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ===== TELEGRAM =====
let tgUserId = null;
if (window.Telegram && Telegram.WebApp) {
  Telegram.WebApp.expand();
  tgUserId = Telegram.WebApp.initDataUnsafe?.user?.id || null;
}

// ===== IMAGES =====
const bgImg = new Image();
bgImg.src = "background.png";

const playerImg = new Image();
playerImg.src = "player.png";

const coinImg = new Image();
coinImg.src = "coin.png";

// ===== GAME STATE =====
const STATE_PLAY = "play";
const STATE_PAUSE = "pause";
const STATE_GAMEOVER = "gameover";
const STATE_SHOP = "shop";
let gameState = STATE_PLAY;

// ===== PLAYER =====
let player = {
  x: 80,
  y: canvas.height / 2,
  w: 40,
  h: 40,
  vy: 0
};

const gravity = 0.6;
const jumpPower = -10;

// ===== SCORE / COINS =====
let score = 0;
let coins = Number(localStorage.getItem("coins")) || 0;

// ===== SHOP =====
const shopItems = [
  { title: "Картинка в видео", price: 100 },
  { title: "5 секунд в видео", price: 300 },
  { title: "Любой челлендж", price: 500 },
  { title: "Управляй мной", price: 700 },
  { title: "Участие в видео", price: 1000 },
  { title: "Ваша идея видео", price: 5000 }
];

// ===== INPUT (ANTI DOUBLE TAP) =====
let canTap = true;
function tap() {
  if (!canTap) return;
  canTap = false;
  setTimeout(() => (canTap = true), 200);

  if (gameState === STATE_PLAY) {
    player.vy = jumpPower;
  }
}

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  tap();
});
canvas.addEventListener("mousedown", tap);

// ===== BUTTON AREAS =====
function isIn(x, y, w, h, mx, my) {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // PAUSE
  if (isIn(canvas.width - 50, 10, 40, 40, mx, my)) {
    if (gameState === STATE_PLAY) gameState = STATE_PAUSE;
    else if (gameState === STATE_PAUSE) gameState = STATE_PLAY;
  }

  // SHOP OPEN
  if (isIn(10, 110, 120, 40, mx, my) && gameState !== STATE_SHOP) {
    gameState = STATE_SHOP;
  }

  // BACK
  if (gameState === STATE_SHOP && isIn(10, 10, 100, 40, mx, my)) {
    gameState = STATE_PLAY;
  }

  // SHOP BUY
  if (gameState === STATE_SHOP) {
    shopItems.forEach((item, i) => {
      const x = 20 + (i % 2) * (canvas.width / 2 - 40);
      const y = 140 + Math.floor(i / 2) * 130;
      const w = canvas.width / 2 - 60;
      const h = 100;

      if (isIn(x, y, w, h, mx, my)) {
        if (coins >= item.price) {
          coins -= item.price;
          localStorage.setItem("coins", coins);
          alert("Покупка успешна");
        } else {
          alert("Не хватает монет");
        }
      }
    });
  }

  // RESTART
  if (gameState === STATE_GAMEOVER) {
    resetGame();
  }
});

// ===== TEXT WRAP =====
function drawMultiline(text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (let w of words) {
    let test = line + w + " ";
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = w + " ";
      yy += lh;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

// ===== RESET =====
function resetGame() {
  player.y = canvas.height / 2;
  player.vy = 0;
  score = 0;
  gameState = STATE_PLAY;
}

// ===== DRAW =====
function draw() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // PLAYER
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // HUD
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(10, 10, 140, 40);
  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.fillText("Счёт: " + score, 20, 35);

  ctx.fillRect(10, 60, 100, 35);
  ctx.drawImage(coinImg, 15, 67, 20, 20);
  ctx.fillText(coins, 40, 85);

  // PAUSE BUTTON
  ctx.fillRect(canvas.width - 50, 10, 40, 40);
  ctx.fillStyle = "#000";
  ctx.

fillText("II", canvas.width - 38, 38);

  // SHOP BTN
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(10, 110, 120, 40);
  ctx.fillStyle = "#000";
  ctx.fillText("МАГАЗИН", 18, 138);

  // STATES
  if (gameState === STATE_PAUSE) {
    overlay("Пауза");
  }

  if (gameState === STATE_GAMEOVER) {
    overlay("Ты проиграл");
  }

  if (gameState === STATE_SHOP) {
    overlay("");

    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText("МАГАЗИН", canvas.width / 2 - 80, 80);

    ctx.font = "18px Arial";
    ctx.fillText("НАЗАД", 20, 35);

    shopItems.forEach((item, i) => {
      const x = 20 + (i % 2) * (canvas.width / 2 - 40);
      const y = 140 + Math.floor(i / 2) * 130;
      const w = canvas.width / 2 - 60;
      const h = 100;

      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = "#000";
      ctx.font = "16px Arial";
      drawMultiline(item.title, x + 10, y + 25, w - 20, 18);

      ctx.drawImage(coinImg, x + 10, y + h - 30, 18, 18);
      ctx.fillText(item.price, x + 35, y + h - 15);
    });
  }
}

// ===== OVERLAY =====
function overlay(text) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "36px Arial";
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2);
}

// ===== UPDATE =====
function update() {
  if (gameState === STATE_PLAY) {
    player.vy += gravity;
    player.y += player.vy;

    if (player.y + player.h > canvas.height) {
      gameState = STATE_GAMEOVER;
      coins += Math.floor(score / 2);
      localStorage.setItem("coins", coins);
    }

    score++;
  }
}

// ===== LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();