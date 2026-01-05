// =====================
// TELEGRAM SAFE INIT
// =====================
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const tgUser = tg?.initDataUnsafe?.user || {};
const USER_ID = String(tgUser.id || "guest");
const USERNAME = tgUser.username || "guest";

// =====================
// SERVER
// =====================
const SERVER_URL = "https://wproject.onrender.com";

// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

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

// =====================
// PLAYER
// =====================
let bird = {
  x: 80,
  y: canvas.height / 2,
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
// LOAD COINS FROM SERVER (ВАЖНО)
// =====================
fetch(`${SERVER_URL}/user/${USER_ID}`)
  .then(r => r.json())
  .then(data => {
    if (typeof data.coins === "number") {
      coins = data.coins;
    }
  })
  .catch(() => {
    coins = 0;
  });

// =====================
// SHOP
// =====================
const shopItems = [
  { title: "5 секунд в видео", price: 100 },
  { title: "Участие в видео", price: 300 },
  { title: "Управляю мной", price: 500 },
  { title: "Челлендж", price: 700 },
  { title: "Выбор наказания", price: 1000 },
  { title: "VIP участие", price: 1500 }
];

// =====================
// INPUT
// =====================
canvas.addEventListener("click", input);
canvas.addEventListener("touchstart", input);

function input(e) {
  if (gameState === STATE_PLAY) {
    bird.velocity = jumpPower;
  }

  if (gameState === STATE_START) {
    gameState = STATE_PLAY;
  }

  if (gameState === STATE_GAMEOVER) {
    restartGame();
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
  pipeTimer = 0;
  gameState = STATE_PLAY;
}

// =====================
// PIPES
// =====================
function createPipe() {
  const topHeight = Math.random() * (canvas.height / 2) + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    passed: false
  });
}

// =====================
// UPDATE (ANTI-CRASH)
// =====================
function update() {
  if (gameState !== STATE_PLAY) return;

  bird.velocity += gravity;
  bird.y += bird.velocity;

  if (bird.y < 0 || bird.y + bird.size > canvas.height) {
    gameState = STATE_GAMEOVER;
  }

  pipeTimer++;
  if (pipeTimer > 110) {
    createPipe();
    pipeTimer = 0;
  }

  for (let pipe of pipes) {
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

      // SAFE FETCH (НЕ МОЖЕТ УРОНИТЬ ИГРУ)
      fetch(`${SERVER_URL}/add-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          username: USERNAME,
          amount: 1
        })
      }).catch(() => {});
    }
  }

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
  ctx.drawImage(coinImg, 20, 70, 18, 18);
  ctx.fillText(coins, 45, 85);

  if (gameState === STATE_START) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText("FLAPPYKRESH", 90, 300);
    ctx.font = "18px Arial";
    ctx.fillText("Тапни чтобы начать", 90, 340);
  }

  if (gameState === STATE_GAMEOVER) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.fillText("ТЫ ПРОИГРАЛ", 90, 320);
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

loop()