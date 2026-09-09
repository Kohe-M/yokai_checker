# 妖怪ウォッチ2 妖怪ゲットチェッカー

妖怪ウォッチ2 の妖怪 398 体（9 族）のゲット状況をチェックしていくツール。
サーバー処理は一切なく、`public/index.html` 1ファイルで完結している。

進捗は JSON ファイル（`yokai_data.json`）としてダウンロード／読込する方式。
ブラウザやサーバーには何も保存しないので、別の端末でも保存ファイルを渡せば続きから使える。

## ローカルで使う

`public/index.html` をブラウザで直接開くだけ。CSS も JS も埋め込み済みなので、
サーバーもネット接続も要らない（フォントだけ Google Fonts から読む）。

## ファイル構成

| パス | 役割 |
| --- | --- |
| `public/index.html` | 本体。HTML・妖怪データ・JS・ビルド済みCSSが全部入っている |
| `src/app.css` | Tailwind の入力CSS。独自スタイルはここに書く |
| `tailwind.config.js` | Tailwind 設定 |
| `scripts/build-css.mjs` | CSSをビルドして `public/index.html` に埋め込む |

## CSSのビルド

`public/index.html` の `<!-- tailwind:start -->` 〜 `<!-- tailwind:end -->` の中身は
**自動生成**なので手で編集しない。Tailwind のクラスを足したり消したりしたら、

```bash
npm install   # 初回のみ
npm run build
```

を実行して埋め込みCSSを作り直す。それ以外の部分（HTML構造・妖怪データ・JS）は
`public/index.html` を直接編集してよい。

`cdn.tailwindcss.com`（Play CDN）は使っていない。あれはブラウザ上でCSSを実行時に
コンパイルするもので、本番では初回表示時にスタイル無しの状態が見えてしまうため。

## Cloudflare で公開する

Cloudflare Workers の [Static Assets](https://developers.cloudflare.com/workers/static-assets/) で
`public/` をそのまま配信する。Worker スクリプトは無し（`wrangler.jsonc` に `main` を書いていない）。

```bash
npm install
npx wrangler login   # 初回のみ
npm run deploy       # CSSをビルドしてからデプロイする
```

デプロイ先は `https://yokai-checker.<アカウントのサブドメイン>.workers.dev`。

本番と同じ配信をローカルで確認したいときは:

```bash
npm run dev
```

## 保存ファイルの形式

```json
{ "version": "yokai-checker-v2", "checked": ["イサマシ族-ぶようじん坊", "..."] }
```

`version` と ID（`族名-妖怪名`）は、過去に保存したファイルが読めなくなるので変更しないこと。
