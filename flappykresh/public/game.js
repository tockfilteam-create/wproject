// =====================
// TELEGRAM
// =====================
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || null;
const API_URL = "https://ТВОЙ_RENDER_URL.onrender.com";

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =====================
// IMAGES
// =====================
const playerImg = new Image();
playerImg.src = "player.png";

const bgImg = new Image();
bgImg.src = "background.png";

const coinImg = new Image();
coinImg.src = "coin.png";

// =====================
// STATES
// =====================
const STATE_START = "start";
const STATE_PLAY = "play";
const STATE_PAUSE = "pause";
const STATE_GAMEOVER = "gameover";
const STATE_SHOP = "shop";

let gameState = STATE_START;
let prevState = STATE_START;

// =====================
// PLAYER
// =====================
let bird = {
  x: 80,
  y: 200,
  size: 32,
  velocity: 0
};

const gravity = 0.5;
const jumpPower = -8;

// =====================
// PIPES
// =====================
let pipes = [];
const pipeWidth = 60;
const pipeGap = 160;
const pipeSpeed = 2;
let pipeTimer = 0;

// =====================
// DATA
// =====================
let score = 0;
let coins = 0;

// =====================
// SHOP
// =====================
const shopItems = [
  { title: "Картинка в видео", price: 100 },
  { title: "5 секунд в видео", price: 300 },
  { title: "Любой челлендж", price: 500 },
  { title: "Управляй мной", price: 700 },
  { title: "Участие в видео", price: 1000 },
  { title: "Ваша идея видео", price: 5000 }
];

// =====================
// SERVER
// =====================
async function loadCoins() {
  if (!userId) return;
  const res = await fetch(`${API_URL}/coins/${userId}`);
  const data = await res.json();
  coins = data.coins || 0;
}

async function saveCoins() {
  if (!userId) return;
  fetch(`${API_URL}/coins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, coins })
  });
}

loadCoins();

// =====================
// INPUT (ТОЛЬКО TOUCH)
// =====================
canvas.addEventListener("touchstart", handleInput, { passive: false });

function handleInput(e) {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;

  // SHOP BUTTON
  if (x < 100 && y < 50 && gameState !== STATE_SHOP) {
    prevState = gameState;
    gameState = STATE_SHOP;
    return;
  }

  // PAUSE
  if (gameState === STATE_PLAY && x > canvas.width - 60 && y < 50) {
    gameState = STATE_PAUSE;
    return;
  }

  if (gameState === STATE_PAUSE) {
    gameState = STATE_PLAY;
    return;
  }

  // SHOP SCREEN
  if (gameState === STATE_SHOP) {
    if (x < 100 && y < 50) {
      gameState = prevState;
      return;
    }

    shopItems.forEach((item, i) => {
      const sx = 30 + (i % 2) * 170;
      const sy = 140 + Math.floor(i / 2) * 120;

      if (x > sx && x < sx + 140 && y > sy && y < sy + 90) {
        if (coins >= item.price) {
          coins -= item.price;
          saveCoins();

          tg.sendData(JSON.stringify({
            type: "purchase",
            item: item.title,
            price: item.price
          }));
        }
      }
    });
    return;
  }

  if (gameState === STATE_START) {
    gameState = STATE_PLAY;
    return;
  }

  if (gameState === STATE_GAMEOVER) {
    restartGame();
    return;
  }

  if (gameState === STATE_PLAY) {
    bird.velocity = jumpPower;
  }
}

// =====================
// GAME
// =====================
function restartGame() {
  bird.y = 200;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  gameState = STATE_PLAY;
}

// =====================
// PIPES
// =====================
function createPipe() {
  const topHeight = Math.random() * 200 + 50;
  pipes.push({

x: canvas.width,
    top: topHeight,
    bottom: canvas.height - topHeight - pipeGap,
    passed: false
  });
}

// =====================
// UPDATE
// =====================
function update() {
  if (gameState !== STATE_PLAY) return;

  bird.velocity += gravity;
  bird.y += bird.velocity;

  if (bird.y < 0 || bird.y + bird.size > canvas.height) {
    gameState = STATE_GAMEOVER;
  }

  pipeTimer++;
  if (pipeTimer > 100) {
    createPipe();
    pipeTimer = 0;
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.size > pipe.x &&
      (bird.y < pipe.top ||
        bird.y + bird.size > canvas.height - pipe.bottom)
    ) {
      gameState = STATE_GAMEOVER;
    }

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      score++;
      coins++;
      saveCoins();
      pipe.passed = true;
    }
  });

  pipes = pipes.filter(p => p.x + pipeWidth > 0);
}

// =====================
// DRAW
// =====================
function darkOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFD700";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, pipeWidth, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, pipeWidth, p.bottom);
  });

  ctx.drawImage(playerImg, bird.x, bird.y, bird.size, bird.size);

  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.fillText("МАГАЗИН", 20, 30);
  ctx.fillText("||", canvas.width - 40, 30);
  ctx.fillText(`Счёт: ${score}`, 20, 60);
  ctx.drawImage(coinImg, 20, 75, 16, 16);
  ctx.fillText(coins, 42, 88);

  if (gameState === STATE_START) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("FLAPPYKRESH", canvas.width / 2 - 120, canvas.height / 2);
  }

  if (gameState === STATE_PAUSE) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("ПАУЗА", canvas.width / 2 - 60, canvas.height / 2);
  }

  if (gameState === STATE_GAMEOVER) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("ТЫ ПРОИГРАЛ", canvas.width / 2 - 110, canvas.height / 2);
  }

  if (gameState === STATE_SHOP) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "26px Arial";
    ctx.fillText("МАГАЗИН", canvas.width / 2 - 70, 60);
    ctx.fillText("НАЗАД", 20, 30);

    shopItems.forEach((item, i) => {
      const x = 30 + (i % 2) * 170;
      const y = 140 + Math.floor(i / 2) * 120;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, 140, 90);
      ctx.fillStyle = "#000";
      ctx.fillText(item.title, x + 10, y + 30);
      ctx.drawImage(coinImg, x + 10, y + 50, 16, 16);
      ctx.fillText(item.price, x + 30, y + 63);
    });
  }
}

// =====================
// LOOP
// =====================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();