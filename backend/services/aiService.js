/**
 * aiService.js
 * 
 * Multi-provider AI Study Assistant backend service.
 * Supports round-robin key rotation, automatic cooldowns on 429/401,
 * provider fallback (Gemini -> Groq -> OpenRouter), request timeout,
 * and 24-hour question caching.
 */

// Centralized model configurations
const MODEL_CONFIG = {
  gemini: 'gemini-1.5-flash',
  groq: 'openai/gpt-oss-120b',
  openrouter: 'meta-llama/llama-3.2-3b-instruct:free'
};

// Base system prompt tailored for Ethiopian university students
const SYSTEM_PROMPT = `You are the NEx Study Assistant for university students in Ethiopia. Explain step by step in simple English. Use short examples and analogies. If the student writes in Amharic, answer in Amharic. If the question is about a specific course, answer at the level of a first-year or university student for that course. If you are not sure, say so. Never invent facts, references, or formulas. For exams and assignments, help the student understand the method, do not only give the final answer. Refuse harmful or off-topic requests politely.`;

// In-memory 24-hour response cache
const responseCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Helper to extract keys from either singular or plural env names (e.g. GROQ_API_KEY or GROQ_API_KEYS)
function parseKeys(...envVars) {
  for (const envVal of envVars) {
    if (envVal && typeof envVal === 'string') {
      const parsed = envVal.split(',').map(k => k.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  }
  return [];
}

// Provider configurations: all use OpenAI-compatible chat completions format
const PROVIDERS = [
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: MODEL_CONFIG.groq,
    getKeys: () => parseKeys(process.env.GROQ_API_KEYS, process.env.GROQ_API_KEY),
    currentIndex: 0,
    cooldowns: new Map()
  },
  {
    name: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: MODEL_CONFIG.gemini,
    getKeys: () => parseKeys(process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY),
    currentIndex: 0,
    cooldowns: new Map()
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: MODEL_CONFIG.openrouter,
    getKeys: () => parseKeys(process.env.OPENROUTER_API_KEYS, process.env.OPENROUTER_API_KEY),
    currentIndex: 0,
    cooldowns: new Map()
  }
];

const COOLDOWN_DURATION_MS = 60 * 1000; // 60 seconds for rate limit or bad key
const REQUEST_TIMEOUT_MS = 20 * 1000;   // 20 second timeout per call

/**
 * Get the next available key for a provider that is not in cooldown.
 */
function getAvailableKey(provider) {
  const keys = provider.getKeys();
  if (!keys || keys.length === 0) return null;

  const now = Date.now();
  for (let i = 0; i < keys.length; i++) {
    const keyIndex = (provider.currentIndex + i) % keys.length;
    const candidateKey = keys[keyIndex];
    const expiry = provider.cooldowns.get(candidateKey);

    if (!expiry || now >= expiry) {
      provider.cooldowns.delete(candidateKey);
      provider.currentIndex = (keyIndex + 1) % keys.length;
      return candidateKey;
    }
  }
  return null; // All keys currently cooling down
}

/**
 * Put a key on cooldown.
 */
function markKeyCooldown(provider, key, durationMs = COOLDOWN_DURATION_MS) {
  provider.cooldowns.set(key, Date.now() + durationMs);
}

/**
 * Call a single provider with a specific key.
 */
async function callProvider(provider, apiKey, messages) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.7,
        max_tokens: 1200
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      return { ok: false, status, error: errorText };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return { ok: false, status: 500, error: 'Empty content in response' };
    }

    return { ok: true, answer };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: err.name === 'AbortError' ? 408 : 500,
      error: err.message
    };
  }
}

/**
 * Main AI function: Handles caching, message formatting, key rotation, and fallback.
 */
async function askStudyAssistant({ question, context, history = [] }) {
  // 1. Build cache key
  const contextStr = context ? `${context.category || ''}_${context.semester || ''}_${context.course || ''}` : '';
  const cacheKey = `${contextStr}::${question.trim().toLowerCase()}`;

  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { answer: cached.answer, cached: true };
  }

  // 2. Prepare system prompt with optional course context
  let dynamicSystemPrompt = SYSTEM_PROMPT;
  if (context && (context.course || context.category)) {
    dynamicSystemPrompt += `\n\nCurrent Academic Context:\nCategory: ${context.category || 'N/A'}\nSemester: ${context.semester || 'N/A'}\nCourse: ${context.course || 'N/A'}`;
  }

  // 3. Prepare message payload (System + last 6 history messages + current question)
  const messages = [{ role: 'system', content: dynamicSystemPrompt }];

  // Sanitize and format history
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  safeHistory.forEach(msg => {
    if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
      messages.push({ role: msg.role, content: msg.content.substring(0, 1000) });
    }
  });

  messages.push({ role: 'user', content: question.trim() });

  // 4. Try providers in priority order (Groq -> Gemini -> OpenRouter)
  for (const provider of PROVIDERS) {
    const keys = provider.getKeys();
    if (!keys || keys.length === 0) continue;

    // Try keys within this provider
    let attempts = 0;
    while (attempts < keys.length) {
      attempts++;
      const apiKey = getAvailableKey(provider);
      if (!apiKey) break; // All keys for this provider are cooling down

      const result = await callProvider(provider, apiKey, messages);

      if (result.ok) {
        // Success: Cache answer
        responseCache.set(cacheKey, {
          answer: result.answer,
          expiresAt: Date.now() + CACHE_TTL_MS
        });

        return {
          answer: result.answer,
          provider: provider.name,
          cached: false
        };
      }

      // If rate limited or auth rejected, put key in cooldown and try next key
      if (result.status === 429 || result.status === 401 || result.status === 403) {
        markKeyCooldown(provider, apiKey);
      }
      // If server error or timeout, continue to next key or provider
    }
  }

  // If all providers exhausted or in cooldown
  const error = new Error('The AI is busy. Please try again in a few minutes.');
  error.status = 503;
  throw error;
}

module.exports = {
  askStudyAssistant,
  MODEL_CONFIG
};
