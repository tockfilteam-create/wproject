// =====================
// TELEGRAM
// =====================
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const USER_ID = tg.initDataUnsafe?.user?.id;
if (!USER_ID) {
  alert("Ошибка Telegram user_id");
}

// =====================
// SERVER
// =====================
const SERVER_URL = "https://wproject.onrender.com";

// регистрация юзера
fetch(`${SERVER_URL}/init`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: USER_ID })
});

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
canvas.addEventListener("click", handleInput);
canvas.addEventListener("touchstart", handleInput);

function handleInput(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

  // SHOP BUTTON
  if (x < 100 && y < 50 && gameState !== STATE_SHOP) {
    prevState = gameState;
    gameState = STATE_SHOP;
    return;
  }

  // PAUSE
  if (gameState === STATE_PLAY && x > canvas.width - 50 && y < 50) {
    gameState = STATE_PAUSE;
    return;
  }

  if (gameState === STATE_PAUSE) {
    gameState = STATE_PLAY;
    return;
  }

  if (gameState === STATE_SHOP) {
    if (x < 80 && y < 50) {
      gameState = prevState;
      return;
    }

    shopItems.forEach((item, i) => {
      const cx = 30 + (i % 2) * 170;
      const cy = 140 + Math.floor(i / 2) * 120;

      if (x > cx && x < cx + 140 && y > cy && y < cy + 90) {
        if (coins >= item.price) {
          coins -= item.price;

          fetch(`${SERVER_URL}/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: USER_ID,
              item: item.title,
              price: item.price
            })
          });

          alert("Покупка отправлена");
        } else {
          alert("Не хватает монет");
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
      pipe.passed = true;

      fetch(`${SERVER_URL}/add-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, amount: 1 })
      });
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

  pipes.forEach(pipe => {
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
  });

  ctx.drawImage(playerImg, bird.x, bird.y, bird.size, bird.size);

  ctx.fillStyle = "#000";
  ctx.font = "18px Arial";
  ctx.fillText("МАГАЗИН", 20, 30);
  ctx.fillText("||", canvas.width - 35, 30);

  ctx.fillText(`Score: ${score}`, 20, 60);
  ctx.drawImage(coinImg, 20, 70, 16, 16);
  ctx.fillText(coins, 42, 83);

  if (gameState === STATE_START) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.fillText("FLAPPYKRESH", 70, 280);
    ctx.font = "18px Arial";
    ctx.fillText("Tap to play", 120, 320);
  }

  if (gameState === STATE_PAUSE) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("PAUSE", 120, 300);
  }

  if (gameState === STATE_GAMEOVER) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", 80, 280);
  }

  if (gameState === STATE_SHOP) {
    darkOverlay();
    ctx.fillStyle = "#fff";
    ctx.font = "26px Arial";
    ctx.fillText("МАГАЗИН", 120, 60);
    ctx.font = "16px Arial";
    ctx.fillText("НАЗАД", 20, 30);

    shopItems.forEach((item, i) => {
      const x = 30 + (i % 2) * 170;
      const y = 140 + Math.floor(i / 2) * 120;

      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, 140, 90);

      ctx.fillStyle = "#000";
      ctx.fillText(item.title, x + 10, y + 30);
      ctx.drawImage(coinImg, x + 10, y + 45, 16, 16);
      ctx.fillText(item.price, x + 30, y + 58);
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