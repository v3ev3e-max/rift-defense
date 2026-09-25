import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';
const result = await build({ entryPoints: ['src/main.ts'], bundle: true, write: false, format: 'iife', target: 'es2022', minify: true, define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'false' }, loader: { '.css': 'empty' } });
const assets = {};
const mime = { '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collect(path);
    else if (mime[extname(path)] && !(path.includes('/assets/generated/')&&extname(path)==='.png')) assets[path.slice('public'.length)] = `data:${mime[extname(path)]};base64,${readFileSync(path).toString('base64')}`;
  }
}
collect('public/assets');
const script = `window.__RIFT_LOCAL_ASSETS__=${JSON.stringify(assets)};${result.outputFiles[0].text}`.replaceAll('</script', '<\\/script');
const html = readFileSync('index.html', 'utf8')
  .replace(/\s*<link[^>]+rel="(?:icon|manifest)"[^>]*>/g, '')
  .replace('</head>', `<style>${readFileSync('src/style.css', 'utf8').replace(/url\(['"]?(\/assets\/[^)'"]+)['"]?\)/g, (_,url)=>assets[url]?`url(${assets[url]})`:`url(${url})`)}</style></head>`)
  .replace(/<script type="module" src="\/src\/main.ts"><\/script>/, () => `<script>${script}</script>`);
mkdirSync('local-test', { recursive: true });
writeFileSync('local-test/index.html', html);
console.log(`Direct-open test: local-test/index.html (${Object.keys(assets).length} assets embedded)`);
