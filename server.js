const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// TELEGRAM BOT
// =====================
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

// =====================
// USERS STORAGE (FILE)
// =====================
let users = {};

if (fs.existsSync("users.json")) {
  try {
    users = JSON.parse(fs.readFileSync("users.json", "utf8"));
  } catch (e) {
    users = {};
  }
}

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// =====================
// INIT USER
// =====================
app.post("/init", (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "no user_id" });

  if (!users[user_id]) {
    users[user_id] = { coins: 0 };
    saveUsers();
  }

  res.json({ ok: true, coins: users[user_id].coins });
});

// =====================
// GET USER (для загрузки)
// =====================
app.get("/user/:id", (req, res) => {
  const id = req.params.id;
  if (!users[id]) {
    users[id] = { coins: 0 };
    saveUsers();
  }
  res.json(users[id]);
});

// =====================
// ADD COINS
// =====================
app.post("/add-coins", (req, res) => {
  const { user_id, amount } = req.body;
  if (!user_id || !amount) {
    return res.status(400).json({ error: "bad data" });
  }

  if (!users[user_id]) {
    users[user_id] = { coins: 0 };
  }

  users[user_id].coins += amount;
  saveUsers();

  res.json({ ok: true, coins: users[user_id].coins });
});

// =====================
// BUY ITEM
// =====================
app.post("/buy", (req, res) => {
  const { user_id, item, price } = req.body;

  if (!user_id || !item || !price) {
    return res.status(400).json({ error: "bad data" });
  }

  if (!users[user_id]) {
    users[user_id] = { coins: 0 };
  }

  if (users[user_id].coins < price) {
    return res.status(400).json({ error: "not enough coins" });
  }

  users[user_id].coins -= price;
  saveUsers();

  // 🔔 УВЕДОМЛЕНИЕ ТЕБЕ
  sendTelegram(
    `🛒 <b>Новая покупка</b>\n\n` +
    `👤 User ID: <code>${user_id}</code>\n` +
    `📦 Товар: <b>${item}</b>\n` +
    `💰 Цена: <b>${price}</b> монет\n` +
    `💳 Остаток: ${users[user_id].coins}`
  );

  res.json({ ok: true, coins: users[user_id].coins });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER STARTED ON PORT", PORT);
});
