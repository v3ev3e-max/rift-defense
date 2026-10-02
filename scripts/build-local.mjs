import { build } from 'esbuild';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync } from 'node:fs';
import { extname } from 'node:path';
const result = await build({ entryPoints: ['src/main.ts'], bundle: true, write: false, format: 'iife', target: 'es2022', minify: true, define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'false', 'import.meta.env.BASE_URL': '"./"' }, loader: { '.css': 'empty' } });
const assets = {};
const mime = { '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) collect(path);
    // Campaign monsters use individual frames; raid summons use their sheet.
    // Do not embed their unused duplicate packaging in the offline document.
    else if (mime[extname(path)] &&
      !/\/monster-actions-v2\/[^/]+\/[^/]+\/sheet\.webp$/.test(path) &&
      !/\/raid-summon-actions-v2\/[^/]+\/[^/]+\/frame_\d+\.webp$/.test(path) &&
      (!(path.includes('/assets/generated/')&&extname(path)==='.png') || /\/attack\/frame_\d+\.png$/.test(path))) assets[path.slice('public'.length)] = `data:${mime[extname(path)]};base64,${readFileSync(path).toString('base64')}`;
  }
}
collect('public/assets');
const marker='<!--RIFT_OFFLINE_SCRIPTS-->';
const html = readFileSync('index.html', 'utf8')
  .replace(/\s*<link[^>]+rel="(?:icon|manifest|preload)"[^>]*>/g, '')
  .replace('</head>', `<style>${readFileSync('src/style.css', 'utf8').replace(/url\(['"]?(\/assets\/[^)'"]+)['"]?\)/g, (_,url)=>assets[url]?`url(${assets[url]})`:`url(${url})`)}</style></head>`)
  .replace(/<script type="module" src="\/src\/main.ts"><\/script>/, marker);
mkdirSync('local-test', { recursive: true });
const parts=html.split(marker);
if(parts.length!==2)throw new Error('Missing offline entry script');
const destination='local-test/index.html';
writeFileSync(destination,parts[0]+'<script>window.__RIFT_LOCAL_ASSETS__={};</script>');
// A single giant JSON string exceeds V8's string limit as the roster grows.
// Bound both build-time strings and browser script blocks, keeping one portable HTML.
let chunk='',chunks=0;
const flush=()=>{if(!chunk)return;appendFileSync(destination,`<script>${chunk.replaceAll('</script','<\\/script')}</script>`);chunk='';chunks++;};
for(const [path,value] of Object.entries(assets)){
 const assignment=`window.__RIFT_LOCAL_ASSETS__[${JSON.stringify(path)}]=${JSON.stringify(value)};`;
 if(chunk.length+assignment.length>4*1024*1024)flush();
 chunk+=assignment;
}
flush();
appendFileSync(destination,`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>${parts[1]}`);
console.log(`Direct-open test: ${destination} (${Object.keys(assets).length} assets embedded in ${chunks} bounded script blocks)`);
