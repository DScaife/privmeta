import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] || "out");
const port = Number(process.argv[3] || 3102);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const relative = pathname.replace(/^\/+/, "");
  const candidates = relative
    ? [path.join(root, relative), path.join(root, `${relative}.html`), path.join(root, relative, "index.html")]
    : [path.join(root, "index.html")];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) continue;
    if (existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

const server = createServer((request, response) => {
  const filePath = resolveRequest(request.url);
  if (!filePath) {
    const notFound = path.join(root, "404.html");
    if (existsSync(notFound)) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(notFound).pipe(response);
    } else {
      response.writeHead(404).end("Not found");
    }
    return;
  }
  response.setHeader("Content-Type", contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static benchmark server listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
