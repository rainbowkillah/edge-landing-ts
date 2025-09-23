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
  :root { 
    --bg: #0a0a0f;
    --bg-secondary: #12141c;
    --bg-tertiary: #1a1d29;
    --fg: #f8fafc;
    --fg-secondary: #e2e8f0;
    --fg-muted: #94a3b8;
    --border: #334155;
    --border-light: #475569;
    --accent: #3b82f6;
    --accent-light: #60a5fa;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-accent: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font: 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--fg);
    background: var(--bg);
    overflow-x: hidden;
  }
  
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    position: relative;
    background: radial-gradient(ellipse at top, var(--bg-secondary) 0%, var(--bg) 100%);
  }
  
  .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 60% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 4xl;
  }
  
  h1 {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 800;
    margin: 0 0 1.5rem;
    background: linear-gradient(135deg, var(--fg) 0%, var(--accent-light) 50%, var(--fg-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }
  
  .hero-subtitle {
    font-size: clamp(1.125rem, 2vw, 1.375rem);
    color: var(--fg-muted);
    max-width: 42rem;
    margin: 0 auto 3rem;
    line-height: 1.7;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    justify-content: center;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--fg-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent-light);
  }
  
  .main-content {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .section-title {
    font-size: clamp(1.875rem, 4vw, 2.5rem);
    font-weight: 700;
    text-align: center;
    margin: 0 0 3rem;
    background: linear-gradient(135deg, var(--fg) 0%, var(--accent-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }
  
  .feature-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-accent);
  }
  
  .feature-card:hover {
    border-color: var(--border-light);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
  
  .feature-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .feature-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
  }
  
  .feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--fg);
  }
  
  .form-grid {
    display: grid;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    align-items: end;
  }
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--fg-secondary);
    margin-bottom: 0.25rem;
  }
  
  input, textarea {
    font: inherit;
    padding: 0.875rem 1rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--bg-tertiary);
    color: var(--fg);
    transition: all 0.2s ease;
    outline: none;
  }
  
  input:focus, textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  input::placeholder, textarea::placeholder {
    color: var(--fg-muted);
  }
  
  button {
    font: inherit;
    font-weight: 600;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 12px;
    background: var(--gradient-primary);
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    position: relative;
    overflow: hidden;
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  
  button:active {
    transform: translateY(0);
  }
  
  button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  button:hover::before {
    left: 100%;
  }
  
  .status-message {
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    min-height: 1.5rem;
    display: flex;
    align-items: center;
  }
  
  .status-success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  .status-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .status-info {
    background: rgba(59, 130, 246, 0.1);
    color: var(--accent-light);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .hero {
      padding: 2rem 1rem;
      min-height: 80vh;
    }
    
    .main-content {
      padding: 2rem 1rem;
    }
  }
  
  .loading {
    opacity: 0.6;
    pointer-events: none;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .feature-card {
    animation: fadeInUp 0.6s ease forwards;
  }
  
  .feature-card:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .feature-card:nth-child(3) {
    animation-delay: 0.2s;
  }
</style>
<div class="hero">
  <div class="hero-content">
    <h1>${title}</h1>
    <p class="hero-subtitle">Edge-native landing page running on Cloudflare Workers with KV, Durable Objects, R2, and D1. Fast, global, and delightfully modern.</p>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Page Visits</div>
        <div class="stat-value" id="visits">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Feature Flag</div>
        <div class="stat-value" id="flag">—</div>
      </div>
    </div>
  </div>
</div>

<div class="main-content">
  <h2 class="section-title">Cloudflare Features Demo</h2>
  
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-header">
        <div class="feature-icon">📧</div>
        <h3 class="feature-title">Newsletter Signup</h3>
      </div>
      <p style="color: var(--fg-muted); margin-bottom: 1.5rem;">Join our newsletter using D1 database storage</p>
      <form id="signup" class="form-grid">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input name="email" id="email" type="email" placeholder="you@example.com" required />
        </div>
        <button type="submit">Subscribe</button>
      </form>
      <div class="status-message" id="signup-msg"></div>
    </div>

    <div class="feature-card">
      <div class="feature-header">
        <div class="feature-icon">🎛️</div>
        <h3 class="feature-title">Feature Flags</h3>
      </div>
      <p style="color: var(--fg-muted); margin-bottom: 1.5rem;">Manage feature flags using KV store</p>
      <form id="set-flag" class="form-grid">
        <div class="form-group">
          <label for="flag-key">Flag Key</label>
          <input name="key" id="flag-key" placeholder="feature:beta" value="feature:beta" required />
        </div>
        <div class="form-group">
          <label for="flag-value">Flag Value</label>
          <input name="value" id="flag-value" placeholder="on/off/json" value="on" required />
        </div>
        <button type="submit">Update Flag</button>
      </form>
      <div class="status-message" id="flag-msg"></div>
    </div>

    <div class="feature-card">
      <div class="feature-header">
        <div class="feature-icon">☁️</div>
        <h3 class="feature-title">Cloud Storage</h3>
      </div>
      <p style="color: var(--fg-muted); margin-bottom: 1.5rem;">Upload messages to R2 bucket storage</p>
      <form id="to-r2" class="form-grid">
        <div class="form-group">
          <label for="file-key">File Path</label>
          <input name="key" id="file-key" placeholder="messages/hello.txt" value="messages/hello.txt" required />
        </div>
        <div class="form-group">
          <label for="file-content">Content</label>
          <textarea name="content" id="file-content" placeholder="Any text…" rows="4">Hello from ${title}!</textarea>
        </div>
        <button type="submit">Upload to R2</button>
      </form>
      <div class="status-message" id="r2-msg"></div>
    </div>
  </div>
</div>

<script type="module">
  const $ = (s) => document.querySelector(s);
  
  // Helper function to show status messages with appropriate styling
  const showStatus = (element, message, type = 'info') => {
    if (!element) return;
    element.textContent = message;
    element.className = 'status-message status-' + type;
  };
  
  // Helper function to set loading state
  const setLoading = (button, isLoading) => {
    if (isLoading) {
      button.classList.add('loading');
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.classList.remove('loading');
      button.textContent = button.dataset.originalText || button.textContent;
    }
  };

  // Load page visits (Durable Object)
  (async () => {
    try {
      const response = await fetch('/api/visits', {method: 'POST'});
      const data = await response.json();
      $('#visits').textContent = data.count?.toLocaleString() || '0';
    } catch (error) {
      $('#visits').textContent = 'Error';
    }
  })();

  // Load feature flag value (KV)
  (async () => {
    try {
      const response = await fetch('/api/flag?key=feature:beta');
      const data = await response.json();
      $('#flag').textContent = data.value || 'null';
    } catch (error) {
      $('#flag').textContent = 'Error';
    }
  })();

  // Newsletter signup (D1)
  $('#signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    const msgEl = $('#signup-msg');
    
    try {
      setLoading(button, true);
      
      const email = new FormData(e.target).get('email');
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({email})
      });
      
      const result = await response.json();
      
      if (result.ok) {
        showStatus(msgEl, '✅ Successfully subscribed to newsletter!', 'success');
        e.target.reset();
      } else {
        showStatus(msgEl, '❌ Error: ' + result.error, 'error');
      }
    } catch (error) {
      showStatus(msgEl, '❌ Network error: ' + error.message, 'error');
    } finally {
      setLoading(button, false);
    }
  });

  // Feature flags management (KV)
  $('#set-flag').addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    const msgEl = $('#flag-msg');
    
    try {
      setLoading(button, true);
      
      const formData = new FormData(e.target);
      const response = await fetch('/api/flag', {
        method: 'PUT',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          key: formData.get('key'),
          value: formData.get('value')
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        showStatus(msgEl, '✅ Flag "' + result.key + '" set to "' + result.value + '"', 'success');
        // Update the flag display in the hero section
        if (result.key === 'feature:beta') {
          $('#flag').textContent = result.value;
        }
      } else {
        showStatus(msgEl, '❌ Failed to update flag', 'error');
      }
    } catch (error) {
      showStatus(msgEl, '❌ Network error: ' + error.message, 'error');
    } finally {
      setLoading(button, false);
    }
  });

  // R2 file upload
  $('#to-r2').addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button');
    const msgEl = $('#r2-msg');
    
    try {
      setLoading(button, true);
      
      const formData = new FormData(e.target);
      const response = await fetch('/api/r2', {
        method: 'PUT',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          key: formData.get('key'),
          content: formData.get('content')
        })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        showStatus(msgEl, '✅ File "' + result.key + '" uploaded successfully!', 'success');
      } else {
        showStatus(msgEl, '❌ Upload failed: ' + result.error, 'error');
      }
    } catch (error) {
      showStatus(msgEl, '❌ Network error: ' + error.message, 'error');
    } finally {
      setLoading(button, false);
    }
  });
  
  // Add smooth scroll behavior for better UX
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href'))?.scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
</script>
<script type="text/javascript" src="https://res.public.onecdn.static.microsoft/customerconnect/v1/7dttl/init.js" id="chatbot" environmentId="6c9a37bc-a1b7-e14e-8f55-85f46c310501" crossorigin="anonymous"></script>
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
        const { key, value } = await req.json() as { key: string; value: string };
        await env.LANDING_KV.put(key, String(value));
        return json({ ok: true, key, value });
      }
    }

    if (url.pathname === "/api/signup" && req.method === "POST") {
      const { email } = await req.json() as { email: string };
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid email" }, 400);
      try {
        await env.LANDING_DB.prepare(`INSERT INTO subscribers (email, created_at) VALUES (?1, datetime('now'))`).bind(email).run();
        return json({ ok: true });
      } catch (e:any) {
        return json({ ok: false, error: e.message ?? String(e) }, 500);
      }
    }

    if (url.pathname === "/api/r2" && req.method === "PUT") {
      const { key, content } = await req.json() as { key: string; content: string };
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
