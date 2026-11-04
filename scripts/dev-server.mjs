import http from 'http';
import { URL, fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-load .env into process.env if present
try {
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch {}

// Map of route patterns to file paths
const routes = [
  { pattern: /^\/api\/auth\/login(?:\?.*)?$/, file: '../api/auth/session.ts' },
  { pattern: /^\/api\/auth\/signup(?:\?.*)?$/, file: '../api/auth/session.ts' },
  { pattern: /^\/api\/auth\/session(?:\?.*)?$/, file: '../api/auth/session.ts' },
  { pattern: /^\/api\/plan(?:\?.*)?$/, file: '../api/auth/session.ts', defaultAction: 'plan' },
  { pattern: /^\/api\/apply(?:\?.*)?$/, file: '../api/apply.ts' },
  { pattern: /^\/api\/candidates\/([^/?]+)(?:\?.*)?$/, file: '../api/candidates/[id].ts', isParam: true },
  { pattern: /^\/api\/candidates(?:\?.*)?$/, file: '../api/candidates/index.ts' },
  { pattern: /^\/api\/jobs(?:\?.*)?$/, file: '../api/jobs.ts' },
  { pattern: /^\/api\/calendar\/events(?:\?.*)?$/, file: '../api/calendar/events.ts' },
  { pattern: /^\/api\/emails\/messages(?:\?.*)?$/, file: '../api/emails/messages.ts' },
  { pattern: /^\/api\/emails(?:\?.*)?$/, file: '../api/emails/messages.ts' },
  { pattern: /^\/api\/emails\/send(?:\?.*)?$/, file: '../api/emails/send.ts' },
  { pattern: /^\/api\/send-email(?:\?.*)?$/, file: '../api/emails/send.ts' },
  { pattern: /^\/api\/screen-candidate(?:\?.*)?$/, file: '../api/screen-candidate.ts' },
  { pattern: /^\/api\/nango\/session(?:\?.*)?$/, file: '../api/nango/session.ts' },
  { pattern: /^\/api\/nango\/status(?:\?.*)?$/, file: '../api/nango/status.ts' },
  { pattern: /^\/api\/integrations(?:\?.*)?$/, file: '../api/nango/check-connection.ts' },
  { pattern: /^\/api\/nango\/check-connection(?:\?.*)?$/, file: '../api/nango/check-connection.ts' },
  { pattern: /^\/api\/clear-all-demo-data(?:\?.*)?$/, file: '../api/clear-all-demo-data.ts' },
];

export function createLocalServer() {
  const server = http.createServer(async (req, res) => {
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost:3000'}`);
    req.query = Object.fromEntries(parsedUrl.searchParams);

    // Read body if method has body
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }
    if (rawBody) {
      try {
        req.body = JSON.parse(rawBody);
      } catch {
        req.body = rawBody;
      }
    } else {
      req.body = {};
    }

    // Match route
    let matched = null;
    let paramValue = null;
    for (const r of routes) {
      const m = req.url.match(r.pattern);
      if (m) {
        matched = r;
        if (r.isParam) {
          paramValue = m[1];
        }
        break;
      }
    }

    if (!matched) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    if (paramValue) {
      req.query.id = paramValue;
    }
    if (matched.defaultAction && !req.query.action) {
      req.query.action = matched.defaultAction;
    }

    try {
      const mod = await import(matched.file);
      await mod.default(req, res);
    } catch (err) {
      console.error(`Error handling ${req.url}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  });

  return server;
}

if (process.argv[1]?.includes('dev-server.mjs')) {
  const port = process.env.PORT || 3000;
  const s = createLocalServer();
  s.listen(port, () => {
    console.log(`HireForce Local API Server listening on http://localhost:${port}`);
  });
}
