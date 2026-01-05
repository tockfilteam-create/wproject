// =====================
// TELEGRAM
// =====================
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const USER_ID = tg.initDataUnsafe?.user?.id;
const USERNAME = tg.initDataUnsafe?.user?.username || "unknown";

if (!USER_ID) {
  alert("Ошибка Telegram user_id");
}

// =====================
// SERVER
// =====================
const SERVER_URL = "https://wproject.onrender.com";

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
  size: 36,
  velocity: 0
};

const gravity = 0.5;
const jumpPower = -8;

// =====================
// PIPES
// =====================
let pipes = [];
const pipeWidth = 60;
const pipeGap = 170;
const pipeSpeed = 2;
let pipeTimer = 0;

// =====================
// DATA
// =====================
let score = 0;
let coins = 0;
let buyMessage= "";
let buyMessageTimer = 0;
let bestScore = 0;
let scroreSent = false;

// =====================
// LOAD USER DATA
// =====================
fetch(`${SERVER_URL}/init`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: USER_ID })
});

fetch(`${SERVER_URL}/user/${USER_ID}`)
  .then(r => r.json())
  .then(data => {
    coins = data.coins || 0;
    bestScore = data.bestScore || 0;
  });

// =====================
// SHOP
// =====================
const shopItems = [
  { title: "Картинка\nв видео", price: 100 },
  { title: "5 секунд\nв видео", price: 500 },
  { title: "Управляй\nмной", price: 1000 },
  { title: "Челлендж", price: 700 },
  { title: "участие\nв видео", price: 5000 },
  { title: "Ваша идея\nвидео", price: 1500 }
];

// =====================
// INPUT (ТОЛЬКО TOUCH)
// =====================
canvas.addEventListener("touchstart", handleInput, { passive: false });

function handleInput(e) {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  // SHOP
  if (x < 120 && y < 50 && gameState !== STATE_SHOP) {
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

  if (gameState === STATE_SHOP) {
    if (x < 100 && y < 50) {
      gameState = prevState;
      return;
    }

    shopItems.forEach((item, i) => {
      const cx = 20 + (i % 2) * (canvas.width / 2);
      const cy = 120 + Math.floor(i / 2) * 120;

      if (x > cx && x < cx + 160 && y > cy && y < cy + 90) {
        if (coins >= item.price) {
          coins -= item.price;

          fetch(`${SERVER_URL}/buy`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: USER_ID,
    username: USERNAME,
    item: item.title,
    price: item.price
  })
});

buyMessage = `Ты купил:\n${item.title}`;
buyMessageTimer = 220;
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
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  scoreSent= false;
  gameState = STATE_PLAY;
}

// =====================
// PIPES
// ======================
function createPipe() {
  const topHeight = Math.random() * (canvas.height / 2) + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
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

    fetch (`${SERVER_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:USER_ID,
        score: score
      })
    });
  }

  pipeTimer++;
  if (pipeTimer > 110) {
    createPipe();
    pipeTimer = 0;
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    if (
      bird.x < pipe.x + pipeWidth &&
      bird.x + bird.size > pipe.x &&
      (bird.y < pipe.top ||
        bird.y + bird.size > pipe.top + pipeGap)
    ) {
      gameState = STATE_GAMEOVER;
    }

    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      score++;
      coins++;

      fetch(`${SERVER_URL}/add-coins`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: USER_ID,
    username: USERNAME,
    amount: 1
  })
});
    }
  });

  pipes = pipes.filter(p => p.x + pipeWidth > 0);
}

// =====================
// DRAW
// =====================
function drawMultiline(text, x, y) {
  text.split("\n").forEach((line, i) => {
    ctx.fillText(line, x, y + i * 18);
  });
}

function darkOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  pipes.forEach(pipe => {
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height);
  });

  ctx.drawImage(playerImg, bird.x, bird.y, bird.size, bird.size);

  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.fillText("МАГАЗИН", 20, 30);
  ctx.fillText("||", canvas.width - 40, 30);

  ctx.fillText(`Счёт: ${score}`, 20, 60);
  ctx.fillText(`Лучший: ${bestScore}`, 20, 80);
  ctx.drawImage(coinImg, 45, 90, 18, 18);
  ctx.fillText(coins, 45, 90);

  if (gameState === STATE_START) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText("FLAPPYKRESH", canvas.width / 2 - 90, canvas.height / 2);
    ctx.font = "18px Arial";
    ctx.fillText("Тапни чтобы начать", canvas.width / 2 - 90, canvas.height / 2 + 40);
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
    ctx.font = "30px Arial";
    ctx.fillText("ТЫ ПРОИГРАЛ", canvas.width / 2 - 100, canvas.height / 2);
  }

  if (score > bestScore) {
    bestScore = score;
  }

  if (gameState === STATE_SHOP) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "26px Arial";
    ctx.fillText("МАГАЗИН", canvas.width / 2 - 60, 70);
    ctx.font = "16px Arial";
    ctx.fillText("НАЗАД", 20, 30);

    shopItems.forEach((item, i) => {
      const x = 20 + (i % 2) * (canvas.width / 2);
      const y = 120 + Math.floor(i / 2) * 120;

      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, 160, 90);

      ctx.fillStyle = "#000";
      drawMultiline(item.title, x + 10, y + 25);
      ctx.drawImage(coinImg, x + 10, y + 60, 16, 16);
      ctx.fillText(item.price, x + 30, y + 73);

    if (buyMessageTimer > 0 ) {
      darkOverlay();
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial";
      drawMultiline(buyMessage, canvas.width / 2 - 100, canvas.height / 2);
      buyMessageTimer--;
    }
    
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