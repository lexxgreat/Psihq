// Vercel Serverless Function — бэкенд для Миры
// Ключ API хранится в переменной окружения GEMINI_API_KEY
// Получить бесплатно: https://aistudio.google.com

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { system, messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  // Gemini использует другой формат: role "model" вместо "assistant"
  // и system prompt передаётся отдельно как systemInstruction
  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system || "" }],
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: max_tokens || 1000,
            temperature: 0.85,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "API error" });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return res.status(200).json({ text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
