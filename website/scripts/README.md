# Banner Generator for Portman

Puppeteer + HTMLテンプレートを使用して、Portmanのランディングページ用OGP/SNS画像を自動生成するスクリプト。

## 生成される画像

| タイプ | サイズ | ファイル名 | 用途 |
|--------|--------|-----------|------|
| OGP | 1200×630 | `ogp.png` | Facebook、LinkedIn等のSNS共有 |
| Twitter Card | 1200×600 | `twitter-card.png` | Twitter/X投稿時のプレビュー |

## 使い方

### 全バナー生成

```bash
npm run generate:banners
```

### 個別生成

```bash
# OGP画像のみ
npm run generate:ogp

# Twitter Card画像のみ
npm run generate:twitter
```

## 出力先

生成された画像は `website/assets/` に保存されます。

## カスタマイズ方法

### デザイン変更

HTMLテンプレートを編集:
- OGP: `scripts/templates/ogp.html`
- Twitter Card: `scripts/templates/twitter.html`

変更可能な要素:
- カラースキーム（CSS変数、グラデーション）
- フォント（Google Fonts）
- レイアウト（Flexbox/Grid）
- 説明文、機能リスト
- バッジ表示

### 設定変更

`scripts/generate-banners.mjs` の `BANNER_CONFIGS` で調整:

```javascript
const BANNER_CONFIGS = {
  ogp: {
    template: 'ogp.html',
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // Retina対応（2倍解像度）
  },
  // ...
};
```

## 技術仕様

### 依存関係

- **Puppeteer**: ヘッドレスChromiumでHTMLをレンダリング
- **Google Fonts**: Inter（本文）、JetBrains Mono（コード）

### レンダリング品質

- 解像度: 2倍スケール（Retina対応）
- フォーマット: PNG
- カラープロファイル: sRGB

### デザインコンセプト

- ダークモード: アプリUIに合わせた `#0f172a` → `#1e293b` グラデーション
- ブランドカラー: `#3b82f6` (primary blue)
- タイポグラフィ: Inter（-3%レタースペーシング、800 weight）
- グラデーションテキスト: `#60a5fa` → `#a78bfa`（青→紫）
- アニメーション: "MCP Ready" バッジのパルスエフェクト

## トラブルシューティング

### エラー: "Template not found"

テンプレートファイルが存在するか確認:

```bash
ls scripts/templates/
```

### エラー: "Icon file not found"

アイコンファイルのパスを確認:

```bash
ls website/assets/icon.png
```

### フォントが読み込まれない

- インターネット接続を確認（Google Fonts CDN使用）
- `networkidle0` 待機により自動解決

### 画像サイズが大きい

PNGを最適化（オプション）:

```bash
# ImageMagickを使用
magick assets/ogp.png -strip -quality 95 assets/ogp.png

# pngquantを使用
pngquant --quality=80-95 assets/ogp.png --output assets/ogp.png --force
```

## 開発メモ

### 画像置き換えプレースホルダー

テンプレート内で `{{ICON_URL}}` を使用すると、スクリプトがBase64エンコードされた画像データに置き換えます。

```html
<img src="{{ICON_URL}}" alt="Portman Icon">
```

### フォント読み込み待機

```javascript
await page.evaluate(() => document.fonts.ready);
await new Promise(resolve => setTimeout(resolve, 500));
```

最初の行でフォント読み込みを待機、2行目で追加の安全マージンを確保。

## SNS別推奨サイズ（参考）

- **Facebook**: 1200×630（1.91:1）
- **Twitter/X**: 1200×600〜1200×675（16:9〜1.78:1）
- **LinkedIn**: 1200×627（1.91:1）
- **Instagram Feed**: 1080×1080（1:1）
- **Instagram Story**: 1080×1920（9:16）

現在のテンプレートは Facebook/Twitter に最適化。

## ライセンス

プロジェクトと同じライセンス。
