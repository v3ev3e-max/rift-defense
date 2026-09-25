import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const files = readdirSync("dist", { recursive: true, withFileTypes: true })
  .filter((f) => f.isFile() && f.name !== "sw.js")
  .map((f) => `${f.parentPath}/${f.name}`.replaceAll("\\", "/"));
const hash = createHash("sha256");
for (const f of files) hash.update(readFileSync(f));
const version = hash.digest("hex").slice(0, 12);
const urls = files.map(
  (f) =>
    "./" +
    f
      .split("/dist/")
      .pop()
      .replace(/^dist\//, ""),
);
const coreUrls=urls.filter(url=>url==='./index.html'||/^\.\/assets\/(?:index|GameConfig|phaser)-[^/]+\.(?:js|css)$/.test(url));
writeFileSync(
  "dist/sw.js",
  `const CACHE='rift-${version}';
const FILES=${JSON.stringify(coreUrls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('rift-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));return;}
 // These are same-origin immutable static files. Vite's preview server varies
 // on Origin, but install-time requests and module loads send different Origin headers.
 event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 })));
});\n`,
);
console.log(`PWA core cache: ${coreUrls.length} files; ${urls.length-coreUrls.length} assets cached on demand / ${version}`);
