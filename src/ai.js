export async function getBotResponse(userMessage) {
  try {
    const response = await fetch("http://localhost:3001/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelUri: "gpt://b1gb6krr62cm50g0u83l/yandexgpt-lite", // ⚠️ замени <catalog-id>
        completionOptions: {
          maxTokens: 150,
          temperature: 0.6,
        },
        messages: [
          { role: "system", text: "Ты — ассистент, который помогает человеку с СДВГ справляться с задачами. \
Делай ответы краткими и практичными. Максимум 5 шагов, каждый шаг — 1 строка. \
Если список длинный, делай продолжение отдельным сообщением." },
          { role: "user", text: userMessage },
        ],
      }),
    });

    const data = await response.json();
    return data.result?.alternatives?.[0]?.message?.text || "🤔 нет ответа";
  } catch (err) {
    console.error("Local AI недоступен, использую mock:", err);
    return "🛑 Ошибка соединения с ЯндексGPT";
  }
}
