# 妖怪ウォッチ2 妖怪ゲットチェッカー

妖怪ウォッチ2 の妖怪 398 体（9 族）のゲット状況をチェックしていくツール。
サーバー処理は一切なく、`public/index.html` 1ファイルで完結している。

進捗は JSON ファイル（`yokai_data.json`）としてダウンロード／読込する方式。
ブラウザやサーバーには何も保存しないので、別の端末でも保存ファイルを渡せば続きから使える。

## ローカルで使う

`public/index.html` をブラウザで直接開くだけ。

## Cloudflare で公開する

Cloudflare Workers の [Static Assets](https://developers.cloudflare.com/workers/static-assets/) で
`public/` をそのまま配信する。Worker スクリプトは無し（`wrangler.jsonc` に `main` を書いていない）。

```bash
npm install
npx wrangler login   # 初回のみ
npm run deploy
```

デプロイ先は `https://yokai-checker.<アカウントのサブドメイン>.workers.dev`。

ローカルで本番と同じ配信を確認したいときは:

```bash
npm run dev
```

## 保存ファイルの形式

```json
{ "version": "yokai-checker-v2", "checked": ["イサマシ族-ぶようじん坊", "..."] }
```

`version` と ID（`族名-妖怪名`）は、過去に保存したファイルが読めなくなるので変更しないこと。
