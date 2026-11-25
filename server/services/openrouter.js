const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function askLLM(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = (process.env.OPENROUTER_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing");
  if (models.length === 0) throw new Error("OPENROUTER_MODELS is missing");

  let lastError;

  for (const model of models) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-OpenRouter-Title": "MERN Demo Chat",
        },
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(25000), // give up after 25 seconds
      });

      const data = await res.json();

      if (!res.ok) {
        const err = new Error(
          data?.error?.message || `OpenRouter error ${res.status}`,
        );
        err.status = res.status;
        throw err;
      }

      const reply = data.choices?.[0]?.message?.content;
      if (!reply || !reply.trim()) throw new Error("Empty reply from model");

      return { reply: reply.trim(), model };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err.message}`);
      // Bad key, no credits, or rate limit: other models would fail the same way
      if ([401, 402, 429].includes(err.status)) break;
    }
  }

  throw lastError;
}

module.exports = { askLLM };
