# Portman Desktop リリース手順書

---

## リポジトリ構成

| リポジトリ | 公開設定 | ブランチ | 用途 |
|-----------|---------|---------|------|
| `wizteriacode/portman` | Private | `master` | 開発・ソースコード管理 |
| `zeroshotlog/portman` | Public | `master` | ソースコードミラー・リリース配布 |
| `zeroshotlog/portman` | Public | `main` | GitHub Pages（ランディングページ + VitePress docs） |
| `zeroshotlog/homebrew-tap` | Public | `main` | Homebrew cask formula |

Git remote 設定:
```
origin  → wizteriacode/portman (Private)
public  → zeroshotlog/portman (Public)
```

### GitHub Pages のブランチ構成

`main`ブランチは`master`とは独立したツリーで、`website/`の中身がルート直下に配置される:

```
main ブランチ（GitHub Pages ソース）
├── index.html          ← website/index.html
├── assets/             ← website/assets/
├── docs/               ← website/docs/.vitepress/dist/ (VitePressビルド成果物)
├── llms.txt
├── sitemap.xml
└── README.md

master ブランチ（開発ソース）
├── crates/
├── desktop/
├── website/
│   ├── index.html      ← ソース
│   ├── assets/
│   └── docs/           ← VitePressソース (.md)
└── ...
```

`master`で`website/`を変更しても`main`には自動反映されない。Phase 4 で手動同期が必要。

---

## バージョン更新対象ファイル一覧

デスクトップアプリのリリース時に更新が必要な全箇所:

| ファイル | 更新箇所 | 備考 |
|---------|---------|------|
| `crates/portman_desktop/tauri.conf.json` | `"version"` | アプリ本体のバージョン |
| `crates/portman_desktop/Cargo.toml` | `version` | Cargo パッケージバージョン（tauri.conf.json と一致させる） |
| `website/index.html` | DMGリンクURL × 4箇所 | `Portman_X.X.X_aarch64.dmg` |
| `website/index.html` | バージョン表示 × 2箇所 | `Download for macOS (vX.X.X)` |

`website/index.html`の更新箇所詳細（一括置換推奨）:
- 構造化データ内の`downloadUrl`と`softwareVersion`
- ヘッダーのDownloadボタンのhref
- ヒーローセクションのDownloadボタンのhref + テキスト
- Desktop Appセクションの Downloadボタンのhref + テキスト

---

## Phase 1: バージョン更新

```bash
cd /Users/reverseblade/personal/portman
```

1. `crates/portman_desktop/tauri.conf.json` の `"version"` を更新
2. `crates/portman_desktop/Cargo.toml` の `version` を更新（同じ値）
3. `website/index.html` のバージョン番号を一括置換（旧バージョン → 新バージョン、6箇所）

バージョン確認:
```bash
grep '"version"' crates/portman_desktop/tauri.conf.json
grep '^version' crates/portman_desktop/Cargo.toml
grep -c 'vX.X.X' website/index.html  # 6が期待値
```

- [ ] tauri.conf.json 更新完了
- [ ] Cargo.toml 更新完了
- [ ] website/index.html 更新完了（6箇所）
- [ ] 更新後バージョン: _______________

---

## Phase 2: ビルド & テスト

```bash
cd /Users/reverseblade/personal/portman

# フロントエンド依存の最新化
cd desktop && npm ci && cd ..

# リリースビルド
cargo tauri build --bundles dmg
```

成果物の確認:
```bash
ls -lh target/release/bundle/dmg/Portman_*.dmg
```

動作確認:
```bash
open target/release/bundle/dmg/Portman_*.dmg
```

- [ ] ビルド成功
- [ ] アプリが起動する
- [ ] ポートスキャンが動作する
- [ ] ラベル追加・削除が動作する
- [ ] ダークモード切り替えが動作する
- [ ] Help → Check for Updates が動作する
- [ ] Help → Documentation リンクが正しい

---

## Phase 3: コミット & GitHub Release 作成

### 3-1. コミット & プッシュ

```bash
cd /Users/reverseblade/personal/portman

# コミット（日本語）
git add crates/portman_desktop/tauri.conf.json \
        crates/portman_desktop/Cargo.toml \
        website/index.html
git commit -m "vX.X.X リリース準備"

# タグ
git tag vX.X.X

# 開発リポジトリにプッシュ
git push origin master --tags

# 公開リポジトリにプッシュ
git push public master
git push public vX.X.X
```

- [ ] origin にプッシュ完了
- [ ] public にプッシュ完了

### 3-2. GitHub Release 作成

```bash
VERSION="X.X.X"
DMG_FILE="target/release/bundle/dmg/Portman_${VERSION}_aarch64.dmg"

gh release create "v${VERSION}" \
  --repo zeroshotlog/portman \
  --title "Portman v${VERSION}" \
  --notes "## What's New

- (変更内容を記載)

## Installation

1. Download the \`.dmg\` file below
2. Open the DMG and drag Portman to Applications
3. First launch: Right-click → Open (macOS Gatekeeper bypass)

## Requirements

- macOS 11.0 or later
- Apple Silicon (aarch64)" \
  "${DMG_FILE}"
```

> リリースノートは英語で記載すること。

- [ ] Release 作成完了
- [ ] DMGダウンロード可能を確認

---

## Phase 4: ランディングページ同期（GitHub Pages）

> **重要**: `main`ブランチは`master`とは独立したツリー。`website/`のファイルがルート直下に配置される特殊構造のため、手動同期が必要。

### 4-1. main ブランチをクローン

```bash
cd /tmp
rm -rf portman-pages
git clone -b main git@github.com:zeroshotlog/portman.git portman-pages
```

### 4-2. ランディングページとアセットをコピー

```bash
cp /Users/reverseblade/personal/portman/website/index.html /tmp/portman-pages/index.html
cp -r /Users/reverseblade/personal/portman/website/assets/ /tmp/portman-pages/assets/
cp /Users/reverseblade/personal/portman/website/llms.txt /tmp/portman-pages/llms.txt
```

### 4-3. VitePress ドキュメントをビルド & コピー

```bash
# VitePress をビルド
cd /Users/reverseblade/personal/portman/website
npm run docs:build

# ビルド成果物をコピー
rm -rf /tmp/portman-pages/docs
cp -r /Users/reverseblade/personal/portman/website/docs/.vitepress/dist /tmp/portman-pages/docs
```

### 4-4. コミット & プッシュ

```bash
cd /tmp/portman-pages
git add -A
git commit -m "Update landing page and docs for vX.X.X"
git push origin main
```

### 4-5. 確認

GitHub Pages のデプロイ完了を待つ（通常1分以内）:
```bash
gh run list --repo zeroshotlog/portman --limit 1
```

- [ ] https://zeroshotlog.github.io/portman/ でバージョン表記が更新されている
- [ ] DMGダウンロードリンクが正しく動作する
- [ ] https://zeroshotlog.github.io/portman/docs/ が正しく表示される

---

## Phase 5: Homebrew tap 更新

### 5-1. DMG の SHA256 を計算

```bash
VERSION="X.X.X"
shasum -a 256 target/release/bundle/dmg/Portman_${VERSION}_aarch64.dmg
```

### 5-2. Homebrew tap リポジトリを更新

```bash
cd /tmp
rm -rf homebrew-tap
gh repo clone zeroshotlog/homebrew-tap

cd homebrew-tap
# Casks/portman.rb の version と sha256 を更新
# version "X.X.X"
# sha256 "新しいハッシュ"
```

### 5-3. コミット & プッシュ

```bash
cd /tmp/homebrew-tap
git add Casks/portman.rb
git commit -m "Update portman cask to vX.X.X"
git push
```

### 5-4. 確認（任意）

```bash
brew untap zeroshotlog/tap 2>/dev/null; brew tap zeroshotlog/tap
brew install --cask zeroshotlog/tap/portman
```

- [ ] Homebrew tap 更新完了
- [ ] `brew install` で新バージョンがインストール可能

---

## Phase 6: リリース後確認

| 確認項目 | URL |
|---------|-----|
| GitHub Release | https://github.com/zeroshotlog/portman/releases |
| ランディングページ | https://zeroshotlog.github.io/portman/ |
| ドキュメント | https://zeroshotlog.github.io/portman/docs/ |
| Homebrew cask | https://github.com/zeroshotlog/homebrew-tap/blob/main/Casks/portman.rb |

- [ ] 全URL確認完了

---

## 改善・自動化検討案

### 案1: GitHub Actions で Pages デプロイを自動化

現在の問題: `master`で`website/`を変更しても`main`に手動同期が必要。

```yaml
# .github/workflows/pages.yml
name: Deploy Pages
on:
  push:
    branches: [master]
    paths: ['website/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd website && npm ci && npm run docs:build
      - name: Deploy to GitHub Pages
        # website/ のファイルをルート直下にデプロイ
        # index.html, assets/, llms.txt, sitemap.xml はそのまま
        # docs/ は VitePress ビルド成果物
```

メリット: `main`ブランチの手動同期が不要になる
課題: Private リポジトリの GitHub Actions はこの workflow を実行できないため、Public 側に workflow を設置する必要がある

### 案2: リリーススクリプトで全 Phase 自動化

```bash
#!/bin/bash
# scripts/release.sh
VERSION=$1
if [ -z "$VERSION" ]; then echo "Usage: ./scripts/release.sh X.X.X"; exit 1; fi

echo "=== Phase 1: バージョン更新 ==="
./scripts/bump-version.sh $VERSION

echo "=== Phase 2: ビルド ==="
cd desktop && npm ci && cd ..
cargo tauri build --bundles dmg

echo "=== Phase 3: GitHub Release ==="
# コミット、タグ、プッシュ、リリース作成

echo "=== Phase 4: ランディングページ同期 ==="
./scripts/sync-landing-page.sh $VERSION

echo "=== Phase 5: Homebrew tap 更新 ==="
./scripts/update-homebrew-tap.sh $VERSION
```

### 案3: バージョン一括更新スクリプト

```bash
#!/bin/bash
# scripts/bump-version.sh
NEW_VERSION=$1
OLD_VERSION=$(grep '"version"' crates/portman_desktop/tauri.conf.json | sed 's/.*"\([0-9.]*\)".*/\1/')

# tauri.conf.json
sed -i '' "s/\"version\": \"${OLD_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" crates/portman_desktop/tauri.conf.json

# Cargo.toml
sed -i '' "s/^version = \"${OLD_VERSION}\"/version = \"${NEW_VERSION}\"/" crates/portman_desktop/Cargo.toml

# website/index.html
sed -i '' "s/${OLD_VERSION}/${NEW_VERSION}/g" website/index.html

echo "Updated: ${OLD_VERSION} → ${NEW_VERSION}"
```

---

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュクリア
cargo clean
cd desktop && rm -rf node_modules && npm ci && cd ..
cargo tauri build --bundles dmg
```

### Gatekeeper 警告

署名なしDMGは警告が出る。ユーザーへの案内:
1. Finder でアプリを右クリック
2. 「開く」を選択
3. 確認ダイアログで「開く」をクリック

### vite dev server のポート競合

`cargo tauri dev` 時にポート 1420 が使用中の場合:
```bash
lsof -i :1420  # プロセスを特定
kill <PID>     # 必要に応じて停止
```

### 将来: Apple 署名を追加

Apple Developer Program ($99/年) に登録後、署名と公証を追加可能。
詳細は `distribution-plan.md` Phase 4 を参照。
