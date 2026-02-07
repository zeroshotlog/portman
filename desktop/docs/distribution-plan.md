# Portman Desktop 配布計画

macOSデスクトップアプリの公開配布に向けた手順書。

## 方針

- **GitHub Organization** を作成し、個人アカウントを非公開にする
- **GitHub Releases** で署名なしDMGを配布（初期フェーズ）
- **Homebrew Cask** でインストール可能にする
- ユーザー増加後に Apple Developer Program 登録 → 署名 & 公証を追加

---

## Phase 1: GitHub Organization & リポジトリ公開

### 1-1. Organization 作成

1. https://github.com/organizations/plan にアクセス
2. Free プランで Organization を作成（例: `portman-app`）
3. Organization の Profile に説明・アイコンを設定

### 1-2. リポジトリの移行 or 新規作成

**方法A: 既存リポジトリを Organization に移譲（Transfer）**

```bash
# GitHub Web UI: Settings → Danger Zone → Transfer ownership
# 移譲先: portman-app
```

- リポジトリ全体（コミット履歴含む）が移動
- 元のURLからリダイレクトされる
- ⚠️ プライベートのまま移譲 → 公開に変更も可能

**方法B: Organization に新規リポジトリを作成し push**

```bash
# 新規リポジトリ作成後
git remote add public git@github.com:portman-app/portman.git
git push public master
```

- コミット履歴を整理してから公開したい場合に有効
- 個人リポジトリはそのまま残せる

### 1-3. 公開前チェックリスト

- [ ] コミット履歴に機密情報がないか確認（`git log --all -p | grep -i "secret\|password\|token"`）
- [ ] `.gitignore` に `.env`, `credentials` 等が含まれているか確認
- [ ] `CLAUDE.md` の内容に公開して問題ない情報だけか確認
- [ ] README をOSS向けに整備（英語併記推奨）
- [ ] LICENSE ファイル確認（Proprietary EULA）

---

## Phase 2: GitHub Actions で DMG 自動ビルド

### 2-1. ワークフロー設定

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install frontend dependencies
        run: cd desktop && npm install

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: crates/portman_desktop
          tauriScript: cargo tauri
          tagName: ${{ github.ref_name }}
          releaseName: "Portman ${{ github.ref_name }}"
          releaseBody: "See the assets to download this version."
          releaseDraft: true
          prerelease: false
          args: "--bundles dmg"
```

### 2-2. リリース手順

```bash
# バージョン更新
# tauri.conf.json の version を更新

# タグ作成 & プッシュ
git tag v0.1.0
git push origin v0.1.0

# → GitHub Actions が自動実行
# → Draft Release が作成される
# → 内容確認後、Publish する
```

### 2-3. Apple Silicon + Intel 両対応（将来）

```yaml
# Universal Binary を作る場合
args: "--bundles dmg --target universal-apple-darwin"
```

※ `universal-apple-darwin` ターゲットは Rust ツールチェーンの追加が必要:
```bash
rustup target add x86_64-apple-darwin
```

---

## Phase 3: Homebrew Cask

### 3-1. tap リポジトリ作成

Organization に `homebrew-portman` リポジトリを作成。

```
portman-app/homebrew-portman
  └── Casks/
      └── portman.rb
```

### 3-2. Cask 定義

`Casks/portman.rb`:

```ruby
cask "portman" do
  version "0.1.0"
  sha256 "SHA256_HASH_HERE"

  url "https://github.com/portman-app/portman/releases/download/v#{version}/Portman_#{version}_aarch64.dmg"
  name "Portman"
  desc "macOS port management tool - scan, label, and monitor"
  homepage "https://github.com/portman-app/portman"

  app "Portman.app"

  zap trash: [
    "~/.local/share/portman",
  ]
end
```

### 3-3. ユーザーのインストール手順

```bash
brew tap portman-app/portman
brew install --cask portman
```

### 3-4. リリース時の Cask 更新

```bash
# DMG の SHA256 を取得
shasum -a 256 Portman_0.2.0_aarch64.dmg

# Cask の version と sha256 を更新して push
```

※ GitHub Actions で自動化も可能（bump-cask ワークフロー）

---

## Phase 4: Apple Developer Program 署名（将来）

ユーザー増加後に対応。年$99。

### 4-1. 署名 & 公証の追加

```yaml
# GitHub Actions に追加する環境変数
env:
  APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
  APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

`tauri-action` は上記の環境変数を検出すると自動的に署名 & Notarization を実行する。

### 4-2. 署名追加のメリット

- Homebrew 以外（Webサイト直接DL）でもGatekeeper警告なし
- ユーザーの信頼性向上
- 将来の App Store 配布への道も開く

---

## Phase 5: ランディングページ（任意）

### 選択肢

| 方法 | 特徴 |
|------|------|
| GitHub リポジトリの README | 最もシンプル、十分な場合が多い |
| GitHub Pages | Organization で `portman-app.github.io` を無料ホスト |
| Vercel / Cloudflare Pages | 独自ドメイン + 高速CDN |

### 最小構成（GitHub Pages）

```
portman-app/portman-app.github.io
  └── index.html  (シンプルなLP)
```

または リポジトリの GitHub Pages 機能を使用:
```
Settings → Pages → Deploy from branch (docs/ or root)
```

---

## 全体の流れ（まとめ）

```
Phase 1  Organization作成 & リポジトリ公開
  ↓
Phase 2  GitHub Actions で DMG 自動ビルド & Releases 公開
  ↓
Phase 3  Homebrew Cask で `brew install` 対応
  ↓
Phase 4  (任意) Apple Developer Program で署名
  ↓
Phase 5  (任意) ランディングページ作成
```

Phase 1〜3 は全て無料で実施可能。

---

## コスト一覧

| 項目 | コスト | 必須 |
|------|--------|------|
| GitHub Organization | 無料 | Yes |
| GitHub Actions (パブリックリポジトリ) | 無料 | Yes |
| Homebrew tap | 無料 | Yes |
| Apple Developer Program | $99/年 | No（後から追加可） |
| 独自ドメイン | $10〜15/年 | No |
| ランディングページホスティング | 無料（GitHub Pages） | No |
