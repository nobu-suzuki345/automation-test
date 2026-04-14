import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { createServer } from "http";

const PORT = 3333;
const ROOT = ".";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = createServer((req, res) => {
  const url = req.url === "/" ? "/index.html" : req.url!;
  const filePath = join(ROOT, url);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const content = readFileSync(filePath);

  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
