/**
 * Edge-optimized landing page Worker
 * - Strong SEO, OG/Twitter cards, and accessibility
 * - Security headers with CSP nonces
 * - Simple A/B testing for hero copy
 * - Keeps existing KV/R2/D1/DO demos and APIs
 */

export interface Env {
  LANDING_KV: KVNamespace;
  LANDING_BUCKET: R2Bucket;
  LANDING_DB: D1Database;
  VISIT_COUNTER: DurableObjectNamespace;
  SITE_TITLE: string;
  CF_ANALYTICS_TOKEN?: string; // Cloudflare Web Analytics beacon token (public)
  TURNSTILE_SITE_KEY?: string; // Public site key for Turnstile
  TURNSTILE_SECRET?: string;   // Secret for server-side Turnstile verification
  ASSETS: { fetch(req: Request): Promise<Response> };
}

/** Render the landing page HTML with SEO and CSP. */
function PAGE_HTML(opts: {
  title: string;
  description: string;
  url: string;
  nonce: string;
  variant: 'A' | 'B';
  analyticsToken?: string;
  turnstileSiteKey?: string;
}) {
  const { title, description, url, nonce, variant, analyticsToken, turnstileSiteKey } = opts;
  const tagline = variant === 'A'
    ? 'Build and ship insanely fast landing pages on the Edge.'
    : 'The edge-native landing page: instant loads, global reach, zero servers.';

  // Minimal inline CSS tokens and utilities
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeAttr(url)}" />

    <!-- Open Graph / Twitter -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeAttr(url)}" />
    <meta property="og:image" content="${escapeAttr(url.replace(/\/$/, '') + '/og.svg')}" />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Accessible, responsive base styles -->
    <style nonce="${nonce}">
      :root{
        --bg:#0b0b10; --fg:#f1f3f5; --muted:#a9b2bc; --panel:#12131a; --border:#1f2230;
        --ring: conic-gradient(from 180deg, #fe5f55, #ffbf69, #2ec4b6, #9b5de5, #fe5f55);
        --radius:14px;
      }
      *,*::before,*::after{ box-sizing:border-box }
      html:focus-within{ scroll-behavior:smooth }
      body{ margin:0; font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif; background:var(--bg); color:var(--fg) }
      a{ color:inherit }
      .skip{ position:absolute; left:-999px; top:auto; width:1px; height:1px; overflow:hidden }
      .skip:focus{ left:1rem; top:1rem; width:auto; height:auto; background:#000; color:#fff; padding:.5rem .75rem; border-radius:8px }
      header{ display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1rem 1.25rem }
      .brand{ font-weight:700 }
      .cta{ display:inline-block; background:#fff; color:#000; border-radius:999px; padding:.5rem 1rem; text-decoration:none }
      main{ display:block }
      .hero{ min-height: 86vh; display:grid; place-items:center; text-align:center; padding:3rem 1rem; position:relative; overflow:hidden }
      .ring{ position:absolute; inset:-30%; background:var(--ring); filter:blur(60px) saturate(1.2) opacity(.20); transform:translateZ(0); animation:spin 40s linear infinite }
      @keyframes spin{ from{ transform:rotate(0deg)} to{ transform:rotate(360deg)} }
      h1{ font-size: clamp(2rem, 5vw, 4rem); margin:0 0 .5rem }
      p.lead{ color:var(--muted); max-width: 62ch; margin: 0 auto 2rem }
      button,input,textarea{ font:inherit }
      input,textarea{ background:#0e0f16; color:var(--fg); border:1px solid var(--border); border-radius:10px; padding:.75rem .9rem }
      button{ background:linear-gradient(90deg,#fe5f55,#ffbf69,#2ec4b6,#9b5de5); color:#000; border:none; border-radius:999px; padding:.75rem 1.1rem; font-weight:700; cursor:pointer }
      .row{ display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap }
      .card{ background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); padding:1rem; max-width:720px; margin:1rem auto }
      .muted{ color:var(--muted) }
      .mono{ font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace }
      .grid{ display:grid; gap:.75rem; grid-template-columns:1fr }
      @media (min-width:720px){ .grid{ grid-template-columns: 1fr 1fr } }
      .pill{ border:1px solid #2a2e3f; border-radius:999px; padding:.5rem .9rem; background:#12131a }
      .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0 }
      footer{ color:var(--muted); text-align:center; padding:2rem 1rem }
    </style>

    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />

    <script type="application/ld+json" nonce="${nonce}">
      ${escapeHtml(JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: title,
        url,
      }))}
    </script>
    ${analyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${escapeAttr(analyticsToken)}"}'></script>` : ''}
    ${turnstileSiteKey ? `<script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>` : ''}
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <header>
      <div class="brand">${escapeHtml(title)}</div>
      <nav><a class="cta" href="#join">Join the crew</a></nav>
    </header>

    <main id="main">
      <section class="hero" aria-label="Hero">
        <div class="ring"></div>
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p class="lead">${escapeHtml(tagline)}</p>
          <div class="row" aria-live="polite">
            <span class="pill">Visits: <b id="visits">—</b></span>
            <span class="pill">Feature flag: <b id="flag">—</b></span>
          </div>
        </div>
      </section>

      <section class="card" aria-label="Join the crew">
        <h2>Join the crew</h2>
        <form id="join" class="grid">
          <div class="grid">
            <div>
              <label class="sr-only" for="first_name">First name</label>
              <input id="first_name" name="first_name" placeholder="First name" required />
            </div>
            <div>
              <label class="sr-only" for="last_name">Last name</label>
              <input id="last_name" name="last_name" placeholder="Last name" />
            </div>
          </div>
          <label class="sr-only" for="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
          <label class="sr-only" for="mobile">Mobile</label>
          <input id="mobile" name="mobile" type="tel" placeholder="Mobile (optional)" autocomplete="tel" />
          <div class="row" style="justify-content:flex-start">
            <label><input type="checkbox" name="opt_email" /> Email updates</label>
            <label><input type="checkbox" name="opt_sms" /> Text me updates</label>
          </div>
          ${turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${escapeAttr(turnstileSiteKey)}" data-theme="dark" data-appearance="interaction-only"></div>` : ''}
          <button type="submit">Join now</button>
        </form>
        <p class="muted" id="signup-msg" aria-live="polite"></p>
      </section>

      <section class="card" aria-label="Feature flags">
        <h2>Feature flags (KV)</h2>
        <form id="set-flag" class="grid">
          <label class="sr-only" for="kv-key">Flag key</label>
          <input id="kv-key" name="key" placeholder="feature:beta" value="feature:beta" required />
          <label class="sr-only" for="kv-value">Flag value</label>
          <input id="kv-value" name="value" placeholder="on/off/json" value="on" required />
          <button type="submit">Set flag</button>
        </form>
        <p class="muted mono" id="flag-msg" aria-live="polite"></p>
      </section>

      <section class="card" aria-label="R2 upload">
        <h2>Drop a message to R2</h2>
        <form id="to-r2" class="grid">
          <label class="sr-only" for="r2-key">Object key</label>
          <input id="r2-key" name="key" placeholder="messages/hello.txt" value="messages/hello.txt" required />
          <label class="sr-only" for="r2-content">Content</label>
          <textarea id="r2-content" name="content" placeholder="Any text…" rows="3">Hello from ${escapeHtml(title)}!</textarea>
          <button type="submit">Upload</button>
        </form>
        <p class="muted mono" id="r2-msg" aria-live="polite"></p>
      </section>
    </main>

    <footer>
      <small class="muted">© ${new Date().getFullYear()} ${escapeHtml(title)} · Powered by Cloudflare Workers</small>
    </footer>

    <script type="module" nonce="${nonce}">
      const $ = (s)=>document.querySelector(s);
      // Visits (Durable Object)
      fetch('/api/visits', {method:'POST'}).then(r=>r.json()).then(d=>$('#visits').textContent=d.count).catch(()=>{});
      // Feature flag read (KV)
      fetch('/api/flag?key=feature:beta').then(r=>r.json()).then(d=>$('#flag').textContent=d.value ?? 'null');
      // Join (D1 + Turnstile)
      $('#join').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const f = new FormData(e.target);
        const payload = {
          first_name: f.get('first_name'),
          last_name: f.get('last_name'),
          email: f.get('email'),
          mobile: f.get('mobile'),
          opt_email: !!f.get('opt_email'),
          opt_sms: !!f.get('opt_sms'),
          turnstileToken: (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement)?.value || ''
        };
        const r = await fetch('/api/signup', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)});
        const j = await r.json();
        $('#signup-msg').textContent = j.ok ? 'You\'re in! Check your inbox.' : ('Error: '+ j.error);
        if (j.ok) {
          (e.target as HTMLFormElement).reset();
          try { (window as any).turnstile?.reset(); } catch {}
        }
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
  </body>
</html>`;
}

export default {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Root HTML with CSP nonces, security headers, and A/B test cookie
    if (url.pathname === "/") {
      const origin = url.origin.replace(/\/$/, '');
      const nonce = makeNonce();
      const description = 'Mr. RainbowSmoke — gamer, tech enthusiast, and vlogger. Edge-native playground on Cloudflare Workers.';
      const ab = getCookie(req, 'ab') as 'A'|'B' | null;
      const variant: 'A'|'B' = ab ?? (Math.random() < 0.5 ? 'A' : 'B');
      const enableAnalytics = !!env.CF_ANALYTICS_TOKEN;
      const enableTurnstile = !!env.TURNSTILE_SITE_KEY;

      const html = PAGE_HTML({ title: env.SITE_TITLE, description, url: origin + '/', nonce, variant, analyticsToken: env.CF_ANALYTICS_TOKEN, turnstileSiteKey: env.TURNSTILE_SITE_KEY });
      let res = new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });

      // Set A/B cookie if not present
      if (!ab) {
        res.headers.append('Set-Cookie', `ab=${variant}; Path=/; Max-Age=2592000; SameSite=Lax`);
      }

      // Security headers (CSP with nonce + common hardening)
      const cspParts = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'${enableTurnstile ? ' https://challenges.cloudflare.com' : ''}${enableAnalytics ? ' https://static.cloudflareinsights.com' : ''}`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: blob:",
        `connect-src 'self'${enableAnalytics ? ' https://cloudflareinsights.com' : ''}`,
        "object-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
        ...(enableTurnstile ? ["frame-src https://challenges.cloudflare.com"] : []),
        'upgrade-insecure-requests'
      ];
      const csp = cspParts.join('; ');

      res.headers.set('Content-Security-Policy', csp);
      addCommonSecurityHeaders(res.headers);
      // For HTML we prefer fresh content (forms/flags change often)
      res.headers.set('Cache-Control', 'no-store');

      return res;
    }

    // SEO/aux endpoints
    if (url.pathname === '/robots.txt') {
      const origin = url.origin.replace(/\/$/, '');
      const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
      return hardenedText(body, 'text/plain; charset=utf-8');
    }

    if (url.pathname === '/sitemap.xml') {
      const origin = url.origin.replace(/\/$/, '');
      const now = new Date().toISOString();
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`+
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
        `  <url><loc>${escapeXml(origin + '/')}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`+
        `</urlset>`;
      return hardenedText(xml, 'application/xml; charset=utf-8', { cacheSeconds: 3600 });
    }

    // Serve uploaded favicon assets if present
    if (url.pathname === '/favicon.ico' || url.pathname === '/favicon-16x16.png' || url.pathname === '/favicon-32x32.png' || url.pathname === '/favicon-96x96.png') {
      const assetRes = await env.ASSETS.fetch(req);
      return harden(assetRes);
    }

    // Prefer an uploaded /favicon.svg if present; otherwise, fall back to generated SVG
    if (url.pathname === '/favicon.svg') {
      try {
        const assetRes = await (env as any).ASSETS?.fetch?.(req);
        if (assetRes && assetRes.ok) return harden(assetRes);
      } catch {}
      const svg = faviconSvg();
      return hardenedText(svg, 'image/svg+xml; charset=utf-8', { cacheSeconds: 86400 });
    }

    if (url.pathname === '/og.svg') {
      const title = env.SITE_TITLE;
      const svg = ogSvg(title);
      return hardenedText(svg, 'image/svg+xml; charset=utf-8', { cacheSeconds: 7200 });
    }

    // API routes (unchanged behavior)
    if (url.pathname === "/api/visits" && req.method === "POST") {
      const id = env.VISIT_COUNTER.idFromName("global");
      const stub = env.VISIT_COUNTER.get(id);
      const r = await stub.fetch("https://do/internal/increment");
      return harden(r);
    }

    if (url.pathname === "/api/flag") {
      if (req.method === "GET") {
        const key = url.searchParams.get("key") || "feature:beta";
        const value = await env.LANDING_KV.get(key);
        return harden(json({ key, value }));
      }
      if (req.method === "PUT") {
        const { key, value } = await req.json();
        await env.LANDING_KV.put(key, String(value));
        return harden(json({ ok: true, key, value }));
      }
    }

    if (url.pathname === "/api/signup" && req.method === "POST") {
      const { first_name, last_name, email, mobile, opt_email, opt_sms, turnstileToken } = await req.json() as any;
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return harden(json({ ok: false, error: "invalid email" }, 400));
      if (!first_name) return harden(json({ ok:false, error:"first name required" }, 400));

      // Optional Turnstile verification
      if (env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY) {
        const ip = getIp(req);
        const verified = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET, ip);
        if (!verified) return harden(json({ ok:false, error:"turnstile verification failed" }, 400));
      }

      try {
        await ensureSchema(env);
        const normMobile = normalizePhone(mobile ?? '');
        const stmt = `INSERT INTO subscribers (email, first_name, last_name, mobile, opt_email, opt_sms, created_at)
                      VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
                      ON CONFLICT(email) DO UPDATE SET
                        first_name=excluded.first_name,
                        last_name=excluded.last_name,
                        mobile=excluded.mobile,
                        opt_email=excluded.opt_email,
                        opt_sms=excluded.opt_sms`;
        await env.LANDING_DB.prepare(stmt)
          .bind(String(email), String(first_name ?? ''), String(last_name ?? ''), normMobile, opt_email ? 1 : 0, opt_sms ? 1 : 0)
          .run();
        return harden(json({ ok: true }));
      } catch (e:any) {
        return harden(json({ ok: false, error: e.message ?? String(e) }, 500));
      }
    }

    if (url.pathname === "/api/r2" && req.method === "PUT") {
      const { key, content } = await req.json();
      if (!key) return harden(json({ ok:false, error:"missing key" }, 400));
      await env.LANDING_BUCKET.put(key, new Blob([content ?? ""]));
      return harden(json({ ok:true, key }));
    }

    return harden(new Response("Not found", { status: 404 }));
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

/** Durable Object: visit counter */
export class VisitCounter {
  state: DurableObjectState;
  constructor(state: DurableObjectState, _env: Env) { this.state = state; }
  async fetch(_req: Request) {
    const count = await this.state.storage.get<number>("count") ?? 0;
    const next = count + 1;
    await this.state.storage.put("count", next);
    return new Response(JSON.stringify({ count: next }), { headers: { "content-type": "application/json" } });
  }
}

// ---------- Helpers ----------

function makeNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  // base64
  return btoa(s);
}

function addCommonSecurityHeaders(h: Headers) {
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
}

function harden(res: Response): Response {
  const headers = new Headers(res.headers);
  addCommonSecurityHeaders(headers);
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(res.body, { status: res.status, headers });
}

function hardenedText(body: string, contentType: string, opts?: { cacheSeconds?: number }): Response {
  const headers = new Headers({ 'content-type': contentType });
  addCommonSecurityHeaders(headers);
  if (opts?.cacheSeconds) headers.set('Cache-Control', `public, max-age=${opts.cacheSeconds}, s-maxage=${opts.cacheSeconds}`);
  return new Response(body, { headers });
}

async function ensureSchema(env: Env) {
  await env.LANDING_DB.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      mobile TEXT,
      opt_email INTEGER DEFAULT 0,
      opt_sms INTEGER DEFAULT 0,
      created_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_subscribers_created ON subscribers(created_at);
  `);
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', body: form });
  if (!r.ok) return false;
  const j: any = await r.json();
  return !!j.success;
}

function normalizePhone(s: string): string {
  const only = String(s || '').replace(/\D+/g, '');
  return only;
}

function getIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || null;
}

function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get('Cookie') ?? '';
  const re = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
  const m = cookie.match(re);
  return m ? decodeURIComponent(m[1]) : null;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  map['"'] = '&quot;';
  map['\''] = '&#39;';
  return s.replace(/[&<>"']/g, (ch) => map[ch]!);
}

function escapeAttr(s: string): string { return escapeHtml(s); }
function escapeXml(s: string): string { return escapeHtml(s); }

function ogSvg(title: string): string {
  const t = escapeXml(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop stop-color="#ff004d"/>
      <stop offset="0.2" stop-color="#ffbf69"/>
      <stop offset="0.4" stop-color="#2ec4b6"/>
      <stop offset="0.6" stop-color="#00e5ff"/>
      <stop offset="0.8" stop-color="#9b5de5"/>
      <stop offset="1" stop-color="#ff004d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0b0b10"/>
  <circle cx="1000" cy="-80" r="420" fill="url(#g)" opacity="0.25"/>
  <text x="60" y="330" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="72" fill="#f1f3f5">${t}</text>
  <text x="60" y="390" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="400" font-size="32" fill="#a9b2bc">Gamer · Tech · Vlogger · Edge-native</text>
</svg>`;
}

function faviconSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop stop-color="#ff004d"/>
      <stop offset="0.2" stop-color="#ffbf69"/>
      <stop offset="0.4" stop-color="#2ec4b6"/>
      <stop offset="0.6" stop-color="#00e5ff"/>
      <stop offset="0.8" stop-color="#9b5de5"/>
      <stop offset="1" stop-color="#ff004d"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0b0b10"/>
  <circle cx="48" cy="-4" r="28" fill="url(#g)" opacity="0.45"/>
  <text x="12" y="42" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="800" font-size="28" fill="#f1f3f5">MR</text>
</svg>`;
}
