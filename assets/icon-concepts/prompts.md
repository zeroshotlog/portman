# Portman App Icon - Generation Prompts

Portman = macOS向けローカルポート管理ツール（スキャン・ラベリング・監視）

## 注意: macOSアイコンの仕様

macOSが自動的に角丸スーパー楕円マスクを適用する。
そのため **画像自体は端まで塗りつぶした正方形** で出力すること。
画像内に角丸フレームや枠を描かせてはいけない。

---

## Concept A: Harbor Beacon（港の灯台）

「port」= 港のダブルミーニング。灯台がポートを照らす＝監視するメタファー。

```
A minimal stylized lighthouse emitting concentric signal waves from the top,
geometric modern design, the lighthouse is navy blue and teal colored,
signal waves in soft cyan gradient, sitting on a subtle hill,
dark navy gradient background that fills the entire canvas edge to edge.
Full-bleed square illustration, the artwork fills the entire canvas edge to edge.
Clean vector style, single centered symbol, subtle gradient background,
high contrast --ar 1:1 --no rounded rectangle, app icon frame, border, inset, rounded corners, squircle shape, drop shadow, mockup, text, letters, watermark
```

---

## Concept B: Port Radar（ポートレーダー）

レーダースキャンのイメージ。ポートをスキャンして検出する機能を表現。

```
A minimal radar display with a sweeping scan line filling the entire canvas,
3-4 small glowing dots representing detected ports scattered on the radar,
the sweep line in bright emerald green, dots in cyan and blue,
dark navy blue background with subtle concentric grid circles,
the radar circle extends to the edges of the canvas.
Full-bleed square illustration, the artwork fills the entire canvas edge to edge.
Clean vector style, single centered symbol, subtle gradient background,
high contrast --ar 1:1 --no rounded rectangle, app icon frame, border, inset, rounded corners, squircle shape, drop shadow, mockup, text, letters, watermark
```

---

## Concept C: Network Hub（ネットワークハブ）

中央のノードから放射状に接続が伸びる。ポート管理＝接続管理のメタファー。

```
A minimal network hub, one central hexagonal node connected to 6 smaller
peripheral nodes by thin lines, the central node is bright blue,
peripheral nodes in varying colors (teal, purple, green, amber, red, indigo)
representing different port types, clean geometric flat design,
light gradient background from white to light gray filling the entire canvas.
Full-bleed square illustration, the artwork fills the entire canvas edge to edge.
Clean vector style, single centered symbol, subtle gradient background,
high contrast --ar 1:1 --no rounded rectangle, app icon frame, border, inset, rounded corners, squircle shape, drop shadow, mockup, text, letters, watermark
```

---

## Concept D: Anchor Badge（アンカーバッジ）

船のアンカー（錨）＝ port に「固定」されたサービスを表現。シンプルで印象的。

```
A minimal stylized ship anchor, modern geometric simplified anchor shape,
the anchor is metallic blue-gray with a subtle gradient from steel blue to navy,
a small glowing teal dot at the anchor ring representing an active connection,
clean and bold silhouette design,
soft gradient background from light zinc to light blue filling the entire canvas.
Full-bleed square illustration, the artwork fills the entire canvas edge to edge.
Clean vector style, single centered symbol, subtle gradient background,
high contrast --ar 1:1 --no rounded rectangle, app icon frame, border, inset, rounded corners, squircle shape, drop shadow, mockup, text, letters, watermark
```

---

## Concept E: Port Gate（ポートゲート）

開かれたゲート/ドアのイメージ。ポート＝通信の入り口。管理者がゲートを管理する。

```
A minimal open gateway or portal, two vertical pillars forming a gate,
with a bright glowing passage of light between them in blue-cyan gradient,
small horizontal lines on each pillar suggesting numbered ports,
modern architectural geometric design,
soft gradient background from light slate to light cyan filling the entire canvas.
Full-bleed square illustration, the artwork fills the entire canvas edge to edge.
Clean vector style, single centered symbol, subtle gradient background,
high contrast --ar 1:1 --no rounded rectangle, app icon frame, border, inset, rounded corners, squircle shape, drop shadow, mockup, text, letters, watermark
```

---

## 推奨

| Concept | 印象 | macOS映え | 一意性 |
|---------|------|-----------|--------|
| A: Harbor Beacon | 温かみ、信頼感 | ★★★★ | ★★★ |
| B: Port Radar | テック感、プロ向け | ★★★★★ | ★★★★ |
| C: Network Hub | 直感的、分かりやすい | ★★★ | ★★ |
| D: Anchor Badge | シンプル、印象的 | ★★★★★ | ★★★★★ |
| E: Port Gate | モダン、抽象的 | ★★★★ | ★★★★ |

**おすすめ**: D (Anchor Badge) または B (Port Radar)
- D: 「port」のダブルミーニングが効いていてシンプルかつ記憶に残りやすい
- B: ツールの「スキャン」機能を直感的に表現しテック感が強い

## アイコン適用手順

1. 生成した1024x1024画像を `assets/icon-concepts/` に保存
2. `cargo tauri icon <画像パス>` で全サイズのアイコンを自動生成
3. `crates/portman_desktop/icons/` に出力される
