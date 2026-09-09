/**
 * scripts/build-css.mjs が public/index.html から生成CSSを取り除いたものを
 * .tmp/scan.html に書き出す。それをクラス名の抽出対象にする。
 * （public/index.html を直接見ると、生成済みCSSの中身まで走査してしまう）
 */
module.exports = {
  content: ['./.tmp/scan.html'],
  theme: { extend: {} },
  plugins: [],
};
