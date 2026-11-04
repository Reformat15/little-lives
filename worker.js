// Little Lives V5 Gemini backend for Cloudflare Workers.
// Store GEMINI_API_KEY as an encrypted Worker Secret; never in GitHub.
const MODEL = 'gemini-2.5-flash';
const NAMES = ['Dad', 'Mom', 'Alex', 'Mia'];
const ROOMS = ['living', 'kitchen', 'bedroom', 'bathroom'];
const ACTIONS = ['Eating', 'Sleeping', 'Relaxing', 'Cooking', 'Bathing', 'Talking', 'Playing', 'Reading'];
const reply = (data, status, headers) => new Response(JSON.stringify(data), { status, headers });
const short = (v, max) => String(v ?? '').slice(0, max);
const number = v => Math.max(0, Math.min(100, Number(v) || 0));

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://reformat15.github.io';
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      'Vary': 'Origin'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: origin === allowed ? 204 : 403, headers });
    if (request.method === 'GET') return reply({ app: 'Little Lives AI V5', status: 'online', geminiConfigured: Boolean(env.GEMINI_API_KEY) }, 200, headers);
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, headers);
    if (origin !== allowed) return reply({ error: 'Origin not allowed' }, 403, headers);
    if (!env.GEMINI_API_KEY) return reply({ error: 'Gemini API key not configured' }, 503, headers);
    const len = Number(request.headers.get('Content-Length') || 0);
    if (len > 12000) return reply({ error: 'Request too large' }, 413, headers);
    let data;
    try { data = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400, headers); }
    if (JSON.stringify(data).length > 12000) return reply({ error: 'Request too large' }, 413, headers);
    const family = (Array.isArray(data.family) ? data.family : []).slice(0, 4).map(p => ({
      name: short(p.name, 20), trait: short(p.trait, 80), room: short(p.room, 20),
      action: short(p.action, 40), hunger: number(p.hunger), energy: number(p.energy), happiness: number(p.happiness)
    })).filter(p => NAMES.includes(p.name));
    if (family.length !== 4 || new Set(family.map(p => p.name)).size !== 4) return reply({ error: 'Four unique family members required' }, 400, headers);
    const history = (Array.isArray(data.history) ? data.history : []).slice(-12).map(h => ({ speaker: short(h.speaker, 20), text: short(h.text, 160) }));
    const prompt = `You direct a wholesome, believable four-person family life simulation. Write a coherent conversation, NOT unrelated one-liners.
Characters: Dad is patient, practical and gently funny; Mom is caring, creative and thoughtful; Alex is a curious older child who likes science and games; Mia is an imaginative younger child who likes stories.
Family state: ${JSON.stringify(family)}
Recent spoken history: ${JSON.stringify(history)}
Time: ${short(data.time, 15)}
Write one natural scene of 4 to 6 sequential dialogue turns, using at least 3 different family members. Every turn after the first MUST directly answer, react to, or build on a previous turn. Prefer continuing an unanswered question from the most recent history. Vary who initiates and who responds. Keep it family friendly, age appropriate, casual, emotionally coherent, and non-repetitive. Short lines, under 120 characters each. Make everyone meet in one sensible room when talking, and reflect hunger/energy if relevant. Use activities from the allowed list.
Return a JSON object with a single field "turns": an array of objects with fields "character", "room", "action", "dialogue". character: Dad/Mom/Alex/Mia; room: living/kitchen/bedroom/bathroom; action: Eating/Sleeping/Relaxing/Cooking/Bathing/Talking/Playing/Reading.`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 1100 }
        })
      });
      if (!res.ok) {
        console.error('Gemini HTTP status', res.status);
        return reply({ error: 'Gemini request failed', status: res.status }, 502, headers);
      }
      const result = await res.json();
      const raw = result.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      const parsed = JSON.parse(raw);
      const turns = (Array.isArray(parsed.turns) ? parsed.turns : []).slice(0, 6)
        .filter(t => NAMES.includes(t.character) && ROOMS.includes(t.room) && ACTIONS.includes(t.action) && typeof t.dialogue === 'string' && t.dialogue.trim())
        .map(t => ({ character: t.character, room: t.room, action: t.action, dialogue: t.dialogue.slice(0, 160) }));
      if (turns.length < 3 || new Set(turns.map(t => t.character)).size < 3) return reply({ error: 'Gemini did not return a connected group conversation' }, 502, headers);
      return reply({ turns }, 200, headers);
    } catch (error) {
      console.error('Gemini processing error', error.message);
      return reply({ error: 'AI processing failed' }, 502, headers);
    }
  }
};
