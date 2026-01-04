const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// ===== DATABASE =====
const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item TEXT,
    price INTEGER,
    date TEXT
  )
`);

// ===== ROUTES =====

// проверка сервера
app.get("/", (req, res) => {
  res.send("SERVER WORKS");
});

// получить баланс
app.get("/balance/:userId", (req, res) => {
  const { userId } = req.params;

  db.get(
    "SELECT coins FROM users WHERE user_id = ?",
    [userId],
    (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO users (user_id, coins) VALUES (?, 0)",
          [userId]
        );
        return res.json({ coins: 0 });
      }
      res.json({ coins: row.coins });
    }
  );
});

// добавить монеты
app.post("/add-coins", (req, res) => {
  const { userId, amount } = req.body;

  db.run(
    `
    INSERT INTO users (user_id, coins)
    VALUES (?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET coins = coins + ?
    `,
    [userId, amount, amount]
  );

  res.json({ ok: true });
});

// покупка
app.post("/purchase", (req, res) => {
  const { userId, item, price } = req.body;

  db.get(
    "SELECT coins FROM users WHERE user_id = ?",
    [userId],
    (err, row) => {
      if (!row || row.coins < price) {
        return res.status(400).json({ error: "NO_COINS" });
      }

      db.run(
        "UPDATE users SET coins = coins - ? WHERE user_id = ?",
        [price, userId]
      );

      db.run(
        "INSERT INTO purchases (user_id, item, price, date) VALUES (?, ?, ?, ?)",
        [userId, item, price, new Date().toISOString()]
      );

      console.log("ПОКУПКА:", userId, item, price);

      res.json({ ok: true });
    }
  );
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER STARTED ON PORT", PORT);
});