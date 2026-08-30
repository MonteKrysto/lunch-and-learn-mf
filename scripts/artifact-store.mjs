// A ~40-line stand-in for S3 / Azure Blob Storage behind a CDN.
// Serves the .artifact-store/ folder with CORS. That folder IS the deployment:
// teams "deploy" by copying files in (make publish app=uikit); nothing runs.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../.artifact-store', import.meta.url));
const PORT = 4400;
const TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.html': 'text/html',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^[/\\]+/, '');
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT)) {
    res.statusCode = 403;
    return res.end('forbidden');
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  // The one CDN rule of module federation: the manifest must never be long-cached
  // (it's how a reload discovers a new release); hashed chunks are immutable.
  res.setHeader(
    'Cache-Control',
    path.endsWith('mf-manifest.json') ? 'no-cache' : 'public, max-age=31536000, immutable',
  );
  try {
    const body = await readFile(file);
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end(`not in the store: ${path}`);
  }
}).listen(PORT, () => {
  console.log(`artifact store (pretend S3/Blob + CDN) on http://localhost:${PORT}`);
  console.log(`serving: .artifact-store/  — publish with: make publish app=uikit`);
});
