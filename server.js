const express = require("express");
const path = require("path");

const app = express();

// статика (игра)
app.use(express.static(path.join(__dirname, "flappykresh/public")));

// главная страница = игра
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "flappykresh/public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SERVER WORKS ON PORT", PORT);
});