const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   TELEGRAM BOT
====================== */

const BOT_TOKEN = "8405263942:AAGBBYHvXtLEddP4GrfNKdNrjqrFWAQt53Y";
const ADMIN_CHAT_ID = "921427881";

function sendTelegram(text) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  }).catch(err => console.error("TG ERROR:", err));
}

/* ======================
   USERS STORAGE
====================== */

const USERS_FILE = path.join(__dirname, "users.json");
let users = {};

if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    users = {};
  }
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUser(id) {
  if (!users[id]) {
    users[id] = {
      coins: 0,
      bestScore: 0
    };
    saveUsers();
  }
  return users[id];
}

/* ======================
   STATIC FILES (GAME)
====================== */

app.use(express.static(path.join(__dirname, "public")));

/* ======================
   MAIN PAGE
====================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ======================
   GET USER DATA
====================== */

app.get("/user/:id", (req, res) => {
  const user = getUser(req.params.id);
  res.json(user);
});

/* ======================
   ADD COINS
====================== */

app.post("/add-coins", (req, res) => {
  const { user_id,username, amount } = req.body;
  if (!user_id, username) return res.json({ ok: false });

  const user = getUser(user_id);
  user.coins += Number(amount) || 0;
  saveUsers();

  res.json({ ok: true, coins: user.coins });
});

/* ======================
   BUY ITEM
====================== */

app.post("/buy", (req, res) => {
  const { user_id,username, item, price } = req.body;
  if (!user_id || !item || !price) return res.json({ ok: false });

  const user = getUser(user_id);
  const userline = username
    ? `👤Пользователь: @${username}`
    : `👤user id: <code>${user_id}</code>`;

  if (user.coins < price) {
    return res.json({ ok: false, error: "NOT_ENOUGH_COINS" });
  }

  user.coins -= price;
  saveUsers();

  sendTelegram(
    `🛒 <b>ПОКУПКА</b>\n` +
    `${userline}\n` +
    `📦 Товар: <b>${item}</b>\n` +
    `💰 Цена: ${price}`
  );

  res.json({ ok: true, coins: user.coins });
});

/* ======================
   SAVE SCORE
====================== */

app.post("/score", (req, res) => {
  const { user_id, score } = req.body;
  if (!user_id || score == null) return res.json({ ok: false });

  const user = getUser(user_id);

  if (score > user.bestScore) {
    user.bestScore = score;
    saveUsers();

    sendTelegram(
      `🎮 <b>НОВЫЙ РЕКОРД</b>\n` +
      `👤 <code>${user_id}</code>\n` +
      `🔥 Score: ${score}`
    );
  }

  res.json({ ok: true });
});

/* ======================
   START SERVER
====================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER WORKS ON PORT", PORT);
});