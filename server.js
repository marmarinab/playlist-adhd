import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ Разрешаем фронту стучаться (localhost:5173)
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

// 📌 Прокси-эндпоинт
app.post("/api/gpt", async (req, res) => {
  try {
    const response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res
        .status(response.status)
        .json({ error: `Yandex API error: ${errText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Ошибка при запросе:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Запуск сервера
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅ Proxy server running at http://localhost:${PORT}`)
);
