# Portman リリース手順書

バイナリ配布モデル: ソースコードは非公開、ビルド済みDMGのみ配布。

---

## リポジトリ構成

| リポジトリ | 公開設定 | 用途 |
|-----------|---------|------|
| `wizteriacode/portman` | Private | 開発・ソースコード管理 |
| `zeroshotlog/portman` | Public | リリース配布（README + DMG） |

---

## 初回セットアップ（1回のみ）

### Step 1: 公開リポジトリ作成

1. https://github.com/orgs/zeroshotlog/repositories にアクセス
2. **New repository** をクリック
3. 設定:
   - Repository name: `portman`
   - Description: `Local port management tool for macOS`
   - Public を選択
   - **Add a README file** にチェック
4. **Create repository** をクリック

- [ ] 公開リポジトリ作成完了

### Step 2: 公開用READMEを作成

GitHub Web UI で `zeroshotlog/portman` の README.md を編集:

```markdown
# Portman

macOS向けローカルポート管理ツール。

## Features

- アクティブなポートをリアルタイムスキャン
- ポートにラベル・メモを付けて管理
- プロセス名・タイプの自動検出
- 空きポートの検索

## Requirements

- macOS 11.0 (Big Sur) 以降
- Apple Silicon native

## Installation

### Download

[Releases](https://github.com/zeroshotlog/portman/releases) から最新の `.dmg` をダウンロード。

### Install

1. DMGファイルを開く
2. Portman.app を Applications フォルダにドラッグ
3. 初回起動時: Portman.app を右クリック → 「開く」を選択

> 署名されていないアプリのため、初回は Gatekeeper の警告が表示されます。

## Screenshots

(後で追加)
```

- [ ] README.md 作成完了

### Step 3: ローカルにクローン

```bash
git clone git@github.com:zeroshotlog/portman.git ~/portman-release
```

- [ ] クローン完了

---

## リリース手順（毎回）

### Step 1: バージョン更新

開発リポジトリでバージョンを更新:

```bash
cd /Users/reverseblade/personal/portman

# tauri.conf.json のバージョンを更新
# "version": "0.1.0" → "0.2.0" など
code crates/portman_desktop/tauri.conf.json
```

現在のバージョン確認:
```bash
grep '"version"' crates/portman_desktop/tauri.conf.json
```

- [ ] バージョン更新完了
- [ ] 更新後バージョン: _______________

### Step 2: DMGビルド

```bash
cd /Users/reverseblade/personal/portman

# フロントエンドの依存関係を最新化
cd desktop && npm ci && cd ..

# リリースビルド
cargo tauri build --bundles dmg
```

ビルド成果物の場所:
```
target/release/bundle/dmg/Portman_X.X.X_aarch64.dmg
```

- [ ] ビルド成功
- [ ] DMGファイル確認: `ls -la target/release/bundle/dmg/`

### Step 3: 動作確認

```bash
# DMGをマウントしてテスト
open target/release/bundle/dmg/Portman_*.dmg
```

確認項目:
- [ ] アプリが起動する
- [ ] ポートスキャンが動作する
- [ ] ラベル追加・削除が動作する
- [ ] ダークモード切り替えが動作する

### Step 4: GitHub Release 作成

**方法A: GitHub Web UI（推奨）**

1. https://github.com/zeroshotlog/portman/releases にアクセス
2. **Draft a new release** をクリック
3. 設定:
   - **Choose a tag**: `v0.1.0` を入力 → **Create new tag**
   - **Release title**: `Portman v0.1.0`
   - **Description**:
     ```
     ## What's New

     - 初回リリース
     - ポートスキャン・ラベル管理機能
     - ダークモード対応

     ## Installation

     1. 下の `.dmg` ファイルをダウンロード
     2. DMGを開いて Portman.app を Applications にドラッグ
     3. 初回起動: 右クリック → 開く
     ```
   - **Attach binaries**: DMGファイルをドラッグ&ドロップ
4. **Publish release** をクリック

**方法B: gh CLI**

```bash
# DMGファイルのパスを変数に
DMG_FILE=$(ls target/release/bundle/dmg/Portman_*.dmg)
VERSION="0.1.0"

# リリースリポジトリに移動
cd ~/portman-release

# タグ作成（軽量タグ）
git tag "v${VERSION}"
git push origin "v${VERSION}"

# リリース作成 & DMGアップロード
gh release create "v${VERSION}" \
  --title "Portman v${VERSION}" \
  --notes "## What's New

- 初回リリース

## Installation

1. 下の .dmg ファイルをダウンロード
2. DMGを開いて Portman.app を Applications にドラッグ
3. 初回起動: 右クリック → 開く" \
  "/Users/reverseblade/personal/portman/${DMG_FILE}"
```

- [ ] Release 作成完了
- [ ] DMGダウンロード可能を確認

### Step 5: 開発リポジトリにタグ

開発リポジトリにもタグを付けて同期:

```bash
cd /Users/reverseblade/personal/portman
git add -A
git commit -m "v0.1.0"
git tag v0.1.0
git push origin master --tags
```

- [ ] 開発リポジトリにタグ付け完了

---

## リリース後の確認

### ダウンロードテスト

```bash
# 公開URLからダウンロード
curl -LO https://github.com/zeroshotlog/portman/releases/download/v0.1.0/Portman_0.1.0_aarch64.dmg

# インストールテスト
open Portman_0.1.0_aarch64.dmg
```

- [ ] 公開URLからダウンロード可能
- [ ] インストール・起動成功

---

## クイックリファレンス

### ビルドコマンド

```bash
cd /Users/reverseblade/personal/portman
cargo tauri build --bundles dmg
```

### DMGの場所

```
target/release/bundle/dmg/Portman_X.X.X_aarch64.dmg
```

### リリースURL

```
https://github.com/zeroshotlog/portman/releases
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

### 将来: Apple署名を追加

Apple Developer Program ($99/年) に登録後、署名と公証を追加可能。
詳細は `distribution-plan.md` Phase 4 を参照。
