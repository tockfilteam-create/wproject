const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   CONFIG
====================== */

const BOT_TOKEN = "8405263942:AAGBBYHvXtLEddP4GrfNKdNrjqrFWAQt53Y";
const ADMIN_CHAT_ID = "921427881";

/* ======================
   TELEGRAM SEND
====================== */

function sendTelegram(text) {
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  }).catch(err => console.error("TG ERROR:", err));
}

/* ======================
   USERS STORAGE
====================== */

let users = {};

if (fs.existsSync("users.json")) {
  try {
    users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  } catch {
    users = {};
  }
}

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

/* ======================
   STATIC GAME
====================== */

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ======================
   INIT USER
====================== */

app.post("/init", (req, res) => {
  const { user_id, username } = req.body;

  if (!user_id) return res.json({ ok: false });

  if (!users[user_id]) {
    users[user_id] = {
      coins: 0,
      username: username || null
    };
    saveUsers();
  }

  res.json({ ok: true, coins: users[user_id].coins });
});

/* ======================
   ADD COINS
====================== */

app.post("/add-coins", (req, res) => {
  const { user_id, amount } = req.body;
  if (!users[user_id]) return res.json({ ok: false });

  users[user_id].coins += amount;
  saveUsers();

  res.json({ ok: true, coins: users[user_id].coins });
});

/* ======================
   BUY ITEM
====================== */

app.post("/buy", (req, res) => {
  const { user_id, username, item, price } = req.body;
  if (!users[user_id]) return res.json({ ok: false });

  users[user_id].coins -= price;
  users[user_id].username = username || users[user_id].username;
  saveUsers();

  const link = username
    ? `https://t.me/${username}`
    : "❌ нет username";

  sendTelegram(
    `🛒 <b>ПОКУПКА</b>\n` +
    `👤 ${link}\n` +
    `🆔 <code>${user_id}</code>\n` +
    `📦 ${item}\n` +
    `💰 ${price}`
  );

  res.json({ ok: true });
});

/* ======================
   START
====================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER WORKS");
});