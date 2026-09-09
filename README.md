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
| `scripts/check.mjs` | 壊れやすい箇所の静的チェック（`npm run check`） |
| `.github/workflows/ci.yml` | PRでのチェックと、main マージ時のデプロイ |

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

通常は下の「開発の流れ」のとおり **main にマージすると自動でデプロイされる**ので、
手でデプロイする必要はない。手元から直接出したいときだけ:

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

## 開発の流れ

main への直接 push はしない。ブランチを切って PR を作る。

```bash
git switch -c fix/something
# 編集する。Tailwind のクラスを触ったら npm run build も実行する
npm run check
git commit -am "..."
git push -u origin fix/something
gh pr create
```

- **PR を作る / 更新する** → [CI](.github/workflows/ci.yml) の `check` が走る
  - `npm run check`（保存形式の互換性、妖怪IDの重複、Play CDN の混入、必要な要素の有無）
  - `npm run build` して `public/index.html` に差分が出ないこと（＝埋め込みCSSが最新か）
  - `wrangler deploy --dry-run`（設定の検証。認証は不要）
- **main にマージ** → `check` が通ったあと `deploy` が走り、Cloudflare に反映される

### 初回だけ必要な設定

デプロイに使う値を GitHub の
`Settings > Secrets and variables > Actions` に **Repository secret** として登録する。

| 名前 | 中身 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare ダッシュボードの My Profile > API Tokens で作る。テンプレート **Edit Cloudflare Workers**（または Workers Scripts の Edit 権限）でよい |
| `CLOUDFLARE_ACCOUNT_ID` | `npx wrangler whoami` で表示される Account ID |

API トークンは発行時に一度しか表示されない。GitHub に貼る以外の場所には残さないこと。

## 保存ファイルの形式

```json
{ "version": "yokai-checker-v2", "checked": ["イサマシ族-ぶようじん坊", "..."] }
```

`version` と ID（`族名-妖怪名`）は、過去に保存したファイルが読めなくなるので変更しないこと。
