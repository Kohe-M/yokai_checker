/**
 * public/index.html の壊れやすいところを機械的に確認する。
 *
 * 単一ファイルにデータもJSもCSSも入っている都合上、壊しても気づきにくい箇所がある。
 * 特に「保存ファイルの互換性」と「Play CDN に戻っていないこと」は目視では見落とすので、
 * CI (npm run check) で毎回確認する。
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML_PATH = join(root, 'public', 'index.html');

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

const html = await readFile(HTML_PATH, 'utf8');

// --- 外部依存 ---------------------------------------------------------------
// Play CDN はブラウザ上でCSSを実行時コンパイルするため、公開物では使わない。
check(!html.includes('cdn.tailwindcss.com'), 'Tailwind の Play CDN への参照が復活しています。');

const externalScripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
check(externalScripts.length === 0, `外部JSを読み込んでいます: ${externalScripts.join(', ')}`);

// --- ビルド済みCSS ----------------------------------------------------------
const styleBlock = html.match(/<!-- tailwind:start -->[\s\S]*?<style>([\s\S]*?)<\/style>[\s\S]*?<!-- tailwind:end -->/);
check(styleBlock !== null, 'tailwind:start / tailwind:end のマーカーか、その中の <style> が見つかりません。');
if (styleBlock) {
    check(styleBlock[1].length > 1000, `埋め込みCSSが短すぎます (${styleBlock[1].length} 文字)。ビルドに失敗している可能性があります。`);
}

// --- 保存ファイルの互換性 ---------------------------------------------------
// これを変えると、ユーザーが過去に保存した進捗ファイルが読めなくなる。
check(
    /const SAVE_FORMAT_VERSION = 'yokai-checker-v2';/.test(html),
    "SAVE_FORMAT_VERSION が 'yokai-checker-v2' から変わっています。過去の保存ファイルが読めなくなります。",
);
check(
    /const yokaiId = \(tribe, name\) => `\$\{tribe\}-\$\{name\}`;/.test(html),
    '妖怪IDの組み立て方が変わっています。過去の保存ファイルが読めなくなります。',
);

// --- 妖怪データ -------------------------------------------------------------
const dataSource = html.match(/const YOKAI_TRIBES = (\[[\s\S]*?\]);/);
check(dataSource !== null, 'YOKAI_TRIBES が見つかりません。');

if (dataSource) {
    // JS のオブジェクトリテラルなので、キーを引用して末尾カンマを外して JSON として読む。
    const json = dataSource[1]
        .replace(/([{,]\s*)(tribe|members):/g, '$1"$2":')
        .replace(/,(\s*[\]}])/g, '$1');

    let tribes;
    try {
        tribes = JSON.parse(json);
    } catch (error) {
        errors.push(`YOKAI_TRIBES を解析できません: ${error.message}`);
    }

    if (tribes) {
        check(tribes.length > 0, '族が1つもありません。');

        const ids = new Set();
        let total = 0;

        for (const { tribe, members } of tribes) {
            check(typeof tribe === 'string' && tribe.length > 0, `族名が空です: ${JSON.stringify(tribe)}`);
            check(Array.isArray(members) && members.length > 0, `${tribe} に妖怪が入っていません。`);

            for (const name of members ?? []) {
                total++;
                check(typeof name === 'string' && name.length > 0, `${tribe} に空の妖怪名があります。`);

                // IDが重複すると、保存・読込でその2体が区別できなくなる。
                const id = `${tribe}-${name}`;
                check(!ids.has(id), `妖怪IDが重複しています: ${id}`);
                ids.add(id);
            }
        }

        console.log(`妖怪データ: ${tribes.length} 族 / ${total} 体`);
    }
}

// --- JS が参照する要素 ------------------------------------------------------
const requiredIds = [
    'yokai-list', 'save-button', 'load-input',
    'progress-text', 'progress-bar', 'progress-bar-track',
    'notification-modal', 'notification-message', 'notification-close',
    'tribe-template', 'yokai-item-template',
];
for (const id of requiredIds) {
    check(html.includes(`id="${id}"`), `id="${id}" の要素がありません。JS から参照されています。`);
}

// --- 結果 -------------------------------------------------------------------
if (errors.length > 0) {
    for (const message of errors) console.error(`✗ ${message}`);
    console.error(`\n${errors.length} 件の問題が見つかりました。`);
    process.exit(1);
}

console.log('チェックはすべて通りました。');
