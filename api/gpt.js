export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
        },
        body: JSON.stringify({
          modelUri: "gpt://b1gb6krr62cm50g0u83l/yandexgpt-lite",
          completionOptions: {
            stream: false,
            temperature: 0.6,
            maxTokens: 150,
          },
          messages: [
            { role: "system", text: "Ты — ассистент, который помогает человеку с СДВГ справляться с задачами. \
Делай ответы краткими и практичными. Максимум 5 шагов, каждый шаг — 1 строка. \
Если список длинный, делай продолжение отдельным сообщением." },
            { role: "user", text: message },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const reply = data.result?.alternatives?.[0]?.message?.text || "🤔 Нет ответа";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Vercel API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
