/**
 * Tailwind の CSS をビルドして public/index.html に埋め込む。
 *
 * public/index.html は「手で編集する唯一のソース」であり、同時に配信物でもある。
 * そのため生成CSSはマーカーで囲んだ <style> の中だけに書き戻し、
 * クラス名の走査時にはその部分を取り除いたコピー(.tmp/scan.html)を使う。
 * こうしないと、生成済みCSSに含まれる文字列を Tailwind がクラス名として拾ってしまう。
 *
 * 使い方: npm run build
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const HTML_PATH = join(root, 'public', 'index.html');
const CSS_INPUT = join(root, 'src', 'app.css');
const TMP_DIR = join(root, '.tmp');
const SCAN_PATH = join(TMP_DIR, 'scan.html');
const CSS_OUTPUT = join(TMP_DIR, 'app.css');

const START = '<!-- tailwind:start -->';
const END = '<!-- tailwind:end -->';
// マーカーとその中身をまとめて掴む。中身が空でも一致する。
const BLOCK = new RegExp(`${START}[\\s\\S]*?${END}`);

const html = await readFile(HTML_PATH, 'utf8');

if (!BLOCK.test(html)) {
    throw new Error(`${HTML_PATH} に ${START} / ${END} のマーカーが見つかりません。`);
}

await mkdir(TMP_DIR, { recursive: true });
await writeFile(SCAN_PATH, html.replace(BLOCK, ''), 'utf8');

await execFileAsync(process.execPath, [
    require.resolve('tailwindcss/lib/cli.js'),
    '--input', CSS_INPUT,
    '--output', CSS_OUTPUT,
    '--minify',
]);

const css = (await readFile(CSS_OUTPUT, 'utf8')).trim();
const block = [
    START,
    '    <!-- このCSSは npm run build が生成します。直接編集しても次のビルドで消えます。 -->',
    `    <style>${css}</style>`,
    `    ${END}`,
].join('\n');

await writeFile(HTML_PATH, html.replace(BLOCK, block), 'utf8');

console.log(`Tailwind CSS を ${(css.length / 1024).toFixed(1)} KiB で public/index.html に埋め込みました。`);
