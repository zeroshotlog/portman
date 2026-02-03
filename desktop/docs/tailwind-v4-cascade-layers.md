# Tailwind CSS v4 + カスタムCSS: Cascade Layers の落とし穴

## 概要

Tailwind CSS v4 では CSS ネイティブの Cascade Layers (`@layer`) が採用された。
これにより **`@layer` 外に書かれたカスタム CSS が、Tailwind ユーティリティを常に上書きする** という問題が発生しやすい。

Tauri プロジェクトに限らず Tailwind v4 を使う全てのプロジェクトで起こり得るが、
Tauri のスターターテンプレートや Web 開発の慣習で CSS リセットを自前で書くケースが多いため、特に踏みやすい。

## 症状

- `px-4`, `py-2`, `gap-6`, `w-56` などの spacing/sizing ユーティリティが効かない
- `bg-[var(--custom)]` のような arbitrary value が適用されない
- DevTools で見ると Tailwind のクラスが生成されているが、別のルールに打ち消されている

## 原因

Tailwind v4 の `@import "tailwindcss"` は内部で以下の Cascade Layers を作成する:

```
@layer theme, base, components, utilities;
```

CSS の仕様上、**unlayered CSS (どの `@layer` にも属さないルール) は、layered CSS より常に優先される。**
specificity (詳細度) は関係ない。

```css
/* index.css */
@import "tailwindcss";

/* これは unlayered — Tailwind の @layer utilities より常に優先される */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

上記の `* { padding: 0 }` (specificity 0,0,0 / unlayered) は、
Tailwind の `.px-4 { padding-left: 1rem }` (specificity 0,1,0 / `@layer utilities`) に **常に勝つ**。

## 解決策

### 方法 1: カスタムリセットを削除する (推奨)

Tailwind v4 の preflight が `@layer base` 内で同等のリセットを提供済み。
自前の `* { margin: 0; padding: 0; box-sizing: border-box; }` は不要。

```css
@import "tailwindcss";

/* カスタムリセットは書かない */
```

### 方法 2: `@layer base` に入れる

どうしてもカスタムスタイルが必要な場合は `@layer base` に入れる。
`@layer base` は `@layer utilities` より優先度が低いため、ユーティリティを邪魔しない。

```css
@import "tailwindcss";

@layer base {
  body {
    font-family: "Inter", sans-serif;
    font-size: 13px;
  }
}
```

### 方法 3: 外部 CSS を layer 付きで import する

サードパーティ CSS も同様の問題を起こすため、layer を指定して読み込む。

```css
@import "tailwindcss";
@import "some-library/style.css" layer(base);
```

## このプロジェクトでの対応

`src/index.css` で以下を実施:

1. `* { margin: 0; padding: 0; box-sizing: border-box; }` を削除 (preflight が提供)
2. `html`, `body`, `#root` のスタイルを `@layer base` に移動
3. CSS 変数 (`:root`) はプロパティ定義のみのため unlayered でも問題なし

## 参考リンク

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Why Your Global CSS Reset Overrides Tailwind's Margin and Padding (Medium)](https://medium.com/@fatimahakanbi/why-your-global-css-reset-overrides-tailwinds-margin-and-padding-acfcbd4c73ca)
- [Padding and margin are not working on TW v4.0 (GitHub)](https://github.com/tailwindlabs/tailwindcss/discussions/15728)
- [Common style rules overrides Tailwind layer rules (GitHub)](https://github.com/tailwindlabs/tailwindcss/discussions/16934)
- [Using CSS Cascade Layers With Tailwind Utilities (CSS-Tricks)](https://css-tricks.com/using-css-cascade-layers-with-tailwind-utilities/)
