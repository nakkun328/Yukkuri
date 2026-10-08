// youtube-strategy 配下の Markdown を markdown-it で1枚の HTML（strategy.html）にまとめる。
// 使い方: npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outFile = path.join(root, 'strategy.html');

// 左のメニューの並び（README の読む順）。ここにないファイルは各グループの後ろに名前順で並ぶ
const groups = [
  { title: 'はじめに', match: (p) => p === 'README.md' },
  { title: '方針', match: (p) => p.startsWith('docs/'),
    order: ['PRODUCTION_GUIDE', 'LONG_TERM_STRATEGY', 'CHANNEL_STRATEGY', 'VIDEO_FORMAT', 'ORIGINALITY'] },
  { title: '動画', match: (p) => p.startsWith('videos/') && !p.includes('/_') },
  { title: '調査', match: (p) => p.startsWith('research/'),
    order: ['YUKKURI_TONE', 'COMPETITORS', 'EVIDENCE', 'RIGHTS', 'GAME_CANDIDATES'] },
  { title: '実験', match: (p) => p.startsWith('experiments/') },
  { title: 'エージェント', match: (p) => p.startsWith('agent/') },
  { title: '候補', match: (p) => p.startsWith('videos/_candidates/') },
  { title: 'アーカイブ（v1）', match: (p) => p.startsWith('videos/_archive-v1/'), collapsed: true },
];

function listMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === 'tools' ? [] : listMarkdown(full);
    return e.name.endsWith('.md') ? [path.relative(root, full).split(path.sep).join('/')] : [];
  });
}

const files = listMarkdown(root).sort();
const docId = (p) => 'd-' + p.replace(/\.md$/, '').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
const fileSet = new Set(files);

// 本文中の `docs/ORIGINALITY.md` のようなパスを、該当する文書へのリンクにする
function resolvePath(ref, fromFile) {
  const clean = ref.replace(/^\.\//, '').replace(/^youtube-strategy\//, '').replace(/#.*$/, '');
  const candidates = [clean, path.posix.join(path.posix.dirname(fromFile), clean)];
  for (const c of candidates) {
    const n = path.posix.normalize(c);
    if (fileSet.has(n)) return n;
    const dir = n.replace(/\/$/, '');
    for (const name of ['idea.md', 'README.md']) if (fileSet.has(`${dir}/${name}`)) return `${dir}/${name}`;
  }
  if (!clean.includes('/')) {
    const hits = files.filter((f) => path.posix.basename(f) === clean);
    if (hits.length === 1) return hits[0];
  }
  return null;
}

function slugify(text) {
  return text.trim().toLowerCase().replace(/[\s　]+/g, '-').replace(/[^\p{L}\p{N}\-]/gu, '');
}

function makeRenderer(file) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: true });
  const prefix = docId(file);
  const used = new Map();

  md.core.ruler.push('heading_ids', (state) => {
    const toks = state.tokens;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== 'heading_open') continue;
      const base = `${prefix}--${slugify(toks[i + 1].content) || 'h'}`;
      const n = used.get(base) || 0;
      used.set(base, n + 1);
      toks[i].attrSet('id', n ? `${base}-${n}` : base);
    }
  });

  const defaultCode = md.renderer.rules.code_inline;
  md.renderer.rules.code_inline = (tokens, idx, opts, env, self) => {
    const html = defaultCode(tokens, idx, opts, env, self);
    const target = /[./]/.test(tokens[idx].content) ? resolvePath(tokens[idx].content, file) : null;
    return target ? `<a class="doclink" href="#${docId(target)}">${html}</a>` : html;
  };

  const defaultLinkOpen = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    const href = tokens[idx].attrGet('href') || '';
    if (/^https?:/.test(href)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    } else {
      const target = resolvePath(href, file);
      if (target) tokens[idx].attrSet('href', `#${docId(target)}`);
    }
    return defaultLinkOpen(tokens, idx, opts, env, self);
  };

  // 横に長い表はスクロールできるように包む
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';

  return md;
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const docs = files.map((file) => {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  const title = (src.match(/^#\s+(.+)$/m) || [, file])[1].trim();
  return { file, id: docId(file), title, html: makeRenderer(file).render(src) };
});

const rank = (g, d) => {
  const i = (g.order || []).findIndex((k) => d.file.includes(k));
  return i === -1 ? 999 : i;
};
const placed = new Set();
const nav = groups.map((g) => {
  const items = docs.filter((d) => !placed.has(d.file) && g.match(d.file))
    .sort((a, b) => rank(g, a) - rank(g, b) || a.file.localeCompare(b.file));
  items.forEach((d) => placed.add(d.file));
  if (!items.length) return '';
  const links = items.map((d) =>
    `<li><a href="#${d.id}" data-doc="${d.id}"><span class="t">${escapeHtml(d.title)}</span><span class="p">${escapeHtml(d.file)}</span></a></li>`).join('');
  return `<details${g.collapsed ? '' : ' open'}><summary>${escapeHtml(g.title)}</summary><ul>${links}</ul></details>`;
}).join('\n');
const leftovers = docs.filter((d) => !placed.has(d.file));
if (leftovers.length) console.warn('メニューに入らなかった文書:', leftovers.map((d) => d.file));

const builtAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
const articles = docs.map((d) =>
  `<article id="${d.id}" hidden><div class="src">${escapeHtml(d.file)}</div>\n${d.html}</article>`).join('\n');

const page = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ゆっくり実況 戦略ノート</title>
<style>
:root {
  --bg: #fbfaf7; --panel: #f2efe8; --text: #24221f; --muted: #6d675e; --line: #ddd7cc;
  --accent: #b4462f; --accent-soft: #f6e3dc; --code: #ece8df; --head: #f0ece4;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #1b1a18; --panel: #232220; --text: #e9e5dd; --muted: #a39d92; --line: #3a3733;
    --accent: #e98a6f; --accent-soft: #3a2a24; --code: #2c2a27; --head: #2a2825;
  }
}
:root[data-theme="dark"] {
  --bg: #1b1a18; --panel: #232220; --text: #e9e5dd; --muted: #a39d92; --line: #3a3733;
  --accent: #e98a6f; --accent-soft: #3a2a24; --code: #2c2a27; --head: #2a2825;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg); color: var(--text);
  font: 16px/1.8 "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", "Meiryo", system-ui, sans-serif;
  display: grid; grid-template-columns: 300px minmax(0, 1fr); min-height: 100vh;
}
nav {
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
  background: var(--panel); border-right: 1px solid var(--line); padding: 20px 14px 40px;
}
nav h1 { font-size: 15px; margin: 0 6px 4px; }
nav .built { font-size: 12px; color: var(--muted); margin: 0 6px 14px; }
nav input {
  width: 100%; padding: 8px 10px; margin-bottom: 12px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--bg); color: var(--text); font: inherit; font-size: 14px;
}
nav details { margin-bottom: 8px; }
nav summary { cursor: pointer; font-size: 13px; font-weight: 700; color: var(--muted); padding: 4px 6px; }
nav ul { list-style: none; margin: 2px 0 0; padding: 0; }
nav li a {
  display: block; padding: 6px 8px; border-radius: 8px; color: var(--text); text-decoration: none; line-height: 1.4;
}
nav li a:hover { background: var(--accent-soft); }
nav li a.active { background: var(--accent-soft); color: var(--accent); font-weight: 700; }
nav .t { display: block; font-size: 14px; }
nav .p { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }
main { padding: 32px 40px 80px; min-width: 0; }
article { max-width: 920px; margin: 0 auto; }
.src { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
h1, h2, h3, h4 { line-height: 1.4; scroll-margin-top: 16px; }
h1 { font-size: 28px; margin: 0 0 20px; }
h2 { font-size: 21px; margin: 40px 0 12px; padding-bottom: 6px; border-bottom: 2px solid var(--line); }
h3 { font-size: 18px; margin: 28px 0 8px; }
a { color: var(--accent); }
strong { color: var(--accent); }
code { background: var(--code); padding: 1px 6px; border-radius: 5px; font-size: 0.88em; }
a.doclink { text-decoration: none; }
a.doclink code { border: 1px solid var(--accent); }
pre { background: var(--code); padding: 14px; border-radius: 8px; overflow-x: auto; }
pre code { padding: 0; background: none; }
blockquote { margin: 16px 0; padding: 8px 16px; border-left: 4px solid var(--accent); background: var(--panel); border-radius: 0 8px 8px 0; }
blockquote p { margin: 4px 0; }
.table-wrap { overflow-x: auto; margin: 16px 0; border: 1px solid var(--line); border-radius: 8px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 1.6; }
th, td { padding: 8px 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
th { background: var(--head); white-space: nowrap; }
tr:last-child td { border-bottom: none; }
li { margin: 2px 0; }
hr { border: none; border-top: 1px solid var(--line); margin: 32px 0; }
.menu-btn { display: none; }
@media (max-width: 800px) {
  body { display: block; }
  .menu-btn {
    display: flex; align-items: center; gap: 8px; position: sticky; top: 0; z-index: 11;
    width: 100%; height: 48px; padding: 0 16px; border: none; border-bottom: 1px solid var(--line);
    background: var(--panel); color: var(--text); font: inherit; font-size: 14px; text-align: left;
  }
  .menu-btn .cur { color: var(--muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  nav {
    position: fixed; top: 48px; bottom: 0; left: 0; width: 82%; height: auto; z-index: 10;
    transform: translateX(-100%); transition: transform .2s;
  }
  body.menu-open nav { transform: none; box-shadow: 0 0 0 100vmax rgba(0,0,0,.35); }
  main { padding: 20px 16px 60px; }
  h1, h2, h3, h4 { scroll-margin-top: 60px; }
  h1 { font-size: 23px; }
}
</style>
</head>
<body>
<button class="menu-btn" type="button" aria-label="目次を開く"><span>☰ 目次</span><span class="cur"></span></button>
<nav>
  <h1>ゆっくり実況 戦略ノート</h1>
  <div class="built">生成: ${escapeHtml(builtAt)}（markdown-it）</div>
  <input type="search" placeholder="文書を絞り込む" aria-label="文書を絞り込む">
${nav}
</nav>
<main>
${articles}
</main>
<script>
(() => {
  const articles = [...document.querySelectorAll('article')];
  const links = [...document.querySelectorAll('nav li a')];
  function show() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const el = hash && document.getElementById(hash);
    const art = (el && el.closest('article')) || articles[0];
    articles.forEach((a) => { a.hidden = a !== art; });
    links.forEach((l) => l.classList.toggle('active', l.dataset.doc === art.id));
    const t = art.querySelector('h1')?.textContent || '';
    document.title = t + ' | ゆっくり実況 戦略ノート';
    document.querySelector('.menu-btn .cur').textContent = t;
    if (el && el !== art) el.scrollIntoView(); else window.scrollTo(0, 0);
    document.body.classList.remove('menu-open');
  }
  window.addEventListener('hashchange', show);
  show();
  document.querySelector('.menu-btn').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  document.querySelector('nav input').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    links.forEach((l) => { l.parentElement.hidden = q && !l.textContent.toLowerCase().includes(q); });
    if (q) document.querySelectorAll('nav details').forEach((d) => { d.open = true; });
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(outFile, page);
console.log(`${docs.length} 件の文書を ${path.relative(process.cwd(), outFile)} に書き出しました`);
