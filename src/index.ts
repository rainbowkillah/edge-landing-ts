/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  LANDING_KV: KVNamespace;
  LANDING_BUCKET: R2Bucket;
  LANDING_DB: D1Database;
  VISIT_COUNTER: DurableObjectNamespace;
  SITE_TITLE: string;
}

const PAGE_HTML = (title: string) => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  :root { --bg:#0b0b10; --fg:#f1f3f5; --muted:#a9b2bc; --acc: conic-gradient(from 180deg, #fe5f55, #ffbf69, #2ec4b6, #9b5de5, #fe5f55); }
  body { margin:0; font:16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; color:var(--fg); background:var(--bg); }
  .hero { min-height: 90vh; display:grid; place-items:center; text-align:center; padding:3rem 1rem; position:relative; overflow:hidden; }
  .ring { position:absolute; inset:-30%; background:var(--acc); filter: blur(60px) saturate(1.2) opacity(.20); }
  h1 { font-size: clamp(2rem, 5vw, 4rem); margin:0 0 .5rem; }
  p.lead { color:var(--muted); max-width: 54ch; margin: 0 auto 2rem; }
  button, input, textarea { font:inherit; }
  .row { display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap; }
  .card { background:#12131a; border:1px solid #1f2230; border-radius:14px; padding:1rem; max-width:720px; margin:1rem auto; }
  .muted { color:var(--muted); }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .grid { display:grid; gap:.75rem; grid-template-columns: 1fr; }
  @media (min-width:720px){ .grid { grid-template-columns: 1fr 1fr; } }
  .pill { border:1px solid #2a2e3f; border-radius:999px; padding:.5rem .9rem; background:#12131a; }
</style>
<div class="hero">
  <div class="ring"></div>
  <div>
    <h1>${title}</h1>
    <p class="lead">Edge-native landing page running on Cloudflare Workers with KV, Durable Objects, R2, and D1. Fast, global, delightfully weird.</p>
    <div class="row">
      <span class="pill">Visits: <b id="visits">—</b></span>
      <span class="pill">Feature flag: <b id="flag">—</b></span>
    </div>
  </div>
</div>

<div class="card">
  <h2>Newsletter signup (D1)</h2>
  <form id="signup" class="grid">
    <input name="email" type="email" placeholder="you@example.com" required />
    <button type="submit">Sign up</button>
  </form>
  <p class="muted" id="signup-msg"></p>
</div>

<div class="card">
  <h2>Feature flags (KV)</h2>
  <form id="set-flag" class="grid">
    <input name="key" placeholder="feature:beta" value="feature:beta" required />
    <input name="value" placeholder="on/off/json" value="on" required />
    <button type="submit">Set flag</button>
  </form>
  <p class="muted mono" id="flag-msg"></p>
</div>

<div class="card">
  <h2>Drop a message to R2</h2>
  <form id="to-r2" class="grid">
    <input name="key" placeholder="messages/hello.txt" value="messages/hello.txt" required />
    <textarea name="content" placeholder="Any text…" rows="3">Hello from ${title}!</textarea>
    <button type="submit">Upload</button>
  </form>
  <p class="muted mono" id="r2-msg"></p>
</div>

<script type="module">
  const $ = (s)=>document.querySelector(s);

  // Visits (Durable Object)
  fetch('/api/visits', {method:'POST'}).then(r=>r.json()).then(d=>$('#visits').textContent=d.count).catch(()=>{});

  // Feature flag read (KV)
  fetch('/api/flag?key=feature:beta').then(r=>r.json()).then(d=>$('#flag').textContent=d.value ?? 'null');

  // Signup (D1)
  $('#signup').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    const r = await fetch('/api/signup', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email})});
    const j = await r.json();
    $('#signup-msg').textContent = j.ok ? 'Signed up!' : ('Error: '+ j.error);
    e.target.reset();
  });

  // Set KV flag
  $('#set-flag').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const r = await fetch('/api/flag', {method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify({key: fd.get('key'), value: fd.get('value')})});
    const j = await r.json();
    $('#flag-msg').textContent = JSON.stringify(j);
  });

  // Write to R2
  $('#to-r2').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const r = await fetch('/api/r2', {method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify({key: fd.get('key'), content: fd.get('content')})});
    const j = await r.json();
    $('#r2-msg').textContent = JSON.stringify(j);
  });
</script>
</html>`;

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Routes
    if (url.pathname === "/") return new Response(PAGE_HTML(env.SITE_TITLE), { headers: { "content-type": "text/html; charset=utf-8" } });

    if (url.pathname === "/api/visits" && req.method === "POST") {
      const id = env.VISIT_COUNTER.idFromName("global");
      const stub = env.VISIT_COUNTER.get(id);
      const r = await stub.fetch("https://do/internal/increment");
      return r;
    }

    if (url.pathname === "/api/flag") {
      if (req.method === "GET") {
        const key = url.searchParams.get("key") || "feature:beta";
        const value = await env.LANDING_KV.get(key);
        return json({ key, value });
      }
      if (req.method === "PUT") {
        const { key, value } = await req.json();
        await env.LANDING_KV.put(key, String(value));
        return json({ ok: true, key, value });
      }
    }

    if (url.pathname === "/api/signup" && req.method === "POST") {
      const { email } = await req.json();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid email" }, 400);
      try {
        await env.LANDING_DB.prepare(`INSERT INTO subscribers (email, created_at) VALUES (?1, datetime('now'))`).bind(email).run();
        return json({ ok: true });
      } catch (e:any) {
        return json({ ok: false, error: e.message ?? String(e) }, 500);
      }
    }

    if (url.pathname === "/api/r2" && req.method === "PUT") {
      const { key, content } = await req.json();
      if (!key) return json({ ok:false, error:"missing key" }, 400);
      await env.LANDING_BUCKET.put(key, new Blob([content ?? ""]));
      return json({ ok:true, key });
    }

    return new Response("Not found", { status: 404 });
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

/** Durable Object: visit counter */
export class VisitCounter {
  state: DurableObjectState;
  constructor(state: DurableObjectState, env: Env) { this.state = state; }
  async fetch(_req: Request) {
    const count = await this.state.storage.get<number>("count") ?? 0;
    const next = count + 1;
    await this.state.storage.put("count", next);
    return new Response(JSON.stringify({ count: next }), { headers: { "content-type": "application/json" } });
  }
}
