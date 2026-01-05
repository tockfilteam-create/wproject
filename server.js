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
   STATIC FILES
====================== */

app.use(express.static(path.join(__dirname, "public")));

/* ======================
   MAIN PAGE
====================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ======================
   API: SAVE SCORE
====================== */

app.post("/score", (req, res) => {
  const { userId, score } = req.body;

  if (!userId || score == null) {
    return res.status(400).json({ ok: false });
  }

  if (!users[userId] || score > users[userId]) {
    users[userId] = score;
    saveUsers();

    sendTelegram(
      `🎮 <b>NEW SCORE</b>\n👤 ${userId}\n🔥 ${score}`
    );
  }

  res.json({ ok: true });
});

/* ======================
   START SERVER
====================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT,  () => {
  console.log("SERVER WORKS ON PORT", PORT);
});
