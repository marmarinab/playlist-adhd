export async function getBotResponse(message) {
  try {
    const res = await fetch("/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("Local AI недоступен, использую mock:", err);
    return "⚠️ AI временно недоступен";
  }
}
