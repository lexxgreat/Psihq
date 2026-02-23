// Vercel Serverless Function — бэкенд для Миры
// Ключ API хранится в переменной окружения MISTRAL_API_KEY
// Получить бесплатно: https://console.mistral.ai

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { system, messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const mistralMessages = [
    { role: "system", content: system || "" },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: max_tokens || 1000,
        temperature: 0.85,
        messages: mistralMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mistral API error:", data);
      return res.status(response.status).json({ error: data.message || "API error" });
    }

    const text = data.choices?.[0]?.message?.content || null;
    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
