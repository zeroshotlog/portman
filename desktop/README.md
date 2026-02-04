# Portman Desktop

macOS向けポート管理ツール Portman のデスクトップアプリ。

**Tech Stack:** Tauri v2 + React 19 + TypeScript + Tailwind CSS v4

## 前提条件

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v18+)
- Xcode Command Line Tools (`xcode-select --install`)

## 開発

```bash
# 依存パッケージのインストール
cd desktop && npm install && cd ..

# 開発サーバー起動（ホットリロード付き）
cd crates/portman_desktop
cargo tauri dev
```

`http://localhost:1420` でVite開発サーバーが起動し、Tauriウィンドウが自動で開く。
フロントエンドの変更はHMRで即時反映、Rust側の変更は自動リコンパイル。

## ビルド

```bash
cd crates/portman_desktop

# .app バンドルを生成
cargo tauri build --bundles app

# DMG インストーラーも生成する場合
cargo tauri build --bundles dmg
```

### 出力先

| 形式 | パス |
|------|------|
| バイナリ | `target/release/portman-desktop` |
| .app | `target/release/bundle/macos/Portman.app` |
| .dmg | `target/release/bundle/dmg/Portman_<version>_aarch64.dmg` |

## インストール（ローカル）

ビルド後、`.app` を Applications フォルダにコピーする:

```bash
cp -r target/release/bundle/macos/Portman.app /Applications/
```

または Finder で `target/release/bundle/macos/Portman.app` を `/Applications` にドラッグ。

DMG を使う場合は `.dmg` ファイルを開いて、Portman.app を Applications にドラッグ。

### 初回起動時の Gatekeeper 警告

コード署名なしでビルドした場合、初回起動時に「開発元が未確認」と警告される。
以下のいずれかで対処:

```bash
# 方法 1: Gatekeeper の隔離属性を削除
xattr -cr /Applications/Portman.app

# 方法 2: システム設定 > プライバシーとセキュリティ > 「このまま開く」
```

## 配布

### 未署名（開発・テスト用）

1. `cargo tauri build --bundles dmg` で DMG を生成
2. `.dmg` ファイルを共有（AirDrop、ファイル共有など）
3. 受け取り側は上記の Gatekeeper 対処が必要

### 署名付き（本番配布用）

Apple Developer Program ($99/年) への登録が必要:

1. **Developer ID 証明書** を取得
2. 環境変数で署名設定:
   ```bash
   export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
   cargo tauri build --bundles dmg
   ```
3. **Notarization**（公証）を実行:
   ```bash
   xcrun notarytool submit target/release/bundle/dmg/Portman_*.dmg \
     --apple-id "your@email.com" \
     --team-id "TEAM_ID" \
     --password "app-specific-password" \
     --wait
   xcrun stapler staple target/release/bundle/dmg/Portman_*.dmg
   ```
4. 公証済み DMG を配布すれば Gatekeeper 警告なしでインストール可能

## アプリアイコンの変更

1. 1024x1024 の正方形 PNG を用意（端まで塗りつぶし、角丸なし — macOSが自動マスク）
2. 全サイズのアイコンを自動生成:
   ```bash
   cd crates/portman_desktop
   cargo tauri icon /path/to/icon.png
   ```
3. `crates/portman_desktop/icons/` に全サイズが出力される
4. `cargo tauri build --bundles app` で再ビルド

アイコンのコンセプトとプロンプトは `assets/icon-concepts/prompts.md` を参照。

## プロジェクト構成

```
desktop/                    # フロントエンド（React + Tailwind CSS v4）
  src/
    components/             # UI コンポーネント
    hooks/                  # カスタムフック（usePortman等）
    contexts/               # テーマコンテキスト
    types.ts                # 型定義
    index.css               # CSS変数 + Tailwind設定
  docs/                     # 技術ドキュメント
crates/portman_desktop/     # Tauri バックエンド（Rust）
  src/
    main.rs                 # Tauriアプリエントリポイント
    commands.rs             # IPC コマンド（scan, label CRUD等）
  capabilities/             # ACL パーミッション設定
  icons/                    # アプリアイコン（全サイズ）
  tauri.conf.json           # Tauri設定
```

## 既知の注意点

- **Tailwind CSS v4 Cascade Layers**: カスタムCSSは `@layer base` 内に書くこと。
  unlayered CSS は Tailwind ユーティリティを上書きする。
  詳細は `docs/tailwind-v4-cascade-layers.md` を参照。
- **ウィンドウドラッグ**: `data-tauri-drag-region` には `core:window:allow-start-dragging`
  パーミッションが必要（`capabilities/default.json`）。
- **dev モードのアイコン**: `cargo tauri dev` ではカスタムアイコンは反映されない。
  `.app` バンドル（`cargo tauri build --bundles app`）で確認する。
