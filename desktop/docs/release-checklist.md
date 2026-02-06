# Portman v0.1.0 リリース手順書

初回リリースのためのステップバイステップガイド。

---

## Phase 1: リポジトリ公開準備

### 1.1 機密情報チェック

```bash
# コミット履歴に機密情報がないか確認
git log --all -p | grep -iE "secret|password|token|api_key|credential" | head -50
```

- [ ] 機密情報が含まれていないことを確認

### 1.2 必要ファイルの追加

- [ ] LICENSE ファイル作成

```bash
# MIT License を追加
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 zeroshotlog

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

- [ ] README.md を公開向けに整備（必要に応じて英語併記）

### 1.3 .gitignore 確認

```bash
cat .gitignore | grep -E "\.env|credential|secret"
```

- [ ] `.env`, 機密ファイルが除外されていることを確認

---

## Phase 2: GitHub Organization 作成

### 2.1 Organization 作成

1. https://github.com/organizations/plan にアクセス
2. **Create a free organization** を選択
3. Organization name を入力（例: `portman-app`）
4. 作成完了

- [ ] Organization 作成完了
- [ ] Organization名: _______________

### 2.2 リポジトリ移譲

**方法A: 既存リポジトリを移譲（推奨）**

1. https://github.com/wizteriacode/portman/settings に移動
2. 一番下の **Danger Zone** → **Transfer ownership**
3. 移譲先 Organization を選択
4. リポジトリ名を入力して確認

```bash
# 移譲後、リモートURLを更新
git remote set-url origin git@github.com:NEW_ORG/portman.git
```

- [ ] リポジトリ移譲完了
- [ ] リモートURL更新完了

**方法B: 新規作成（履歴を整理したい場合）**

```bash
git remote add public git@github.com:NEW_ORG/portman.git
git push public master
```

### 2.3 リポジトリを Public に変更

1. Settings → General → Danger Zone
2. **Change repository visibility** → Make public

- [ ] リポジトリを Public に変更完了

---

## Phase 3: GitHub Actions 設定

### 3.1 ワークフローファイル作成

```bash
mkdir -p .github/workflows
```

`.github/workflows/release.yml` を作成:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  build-macos:
    runs-on: macos-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install frontend dependencies
        run: cd desktop && npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: crates/portman_desktop
          tauriScript: cargo tauri
          tagName: ${{ github.ref_name }}
          releaseName: "Portman ${{ github.ref_name }}"
          releaseBody: |
            ## What's New

            See [CHANGELOG](https://github.com/ORG_NAME/portman/blob/master/CHANGELOG.md) for details.

            ## Installation

            1. Download the `.dmg` file below
            2. Open the DMG and drag Portman to Applications
            3. First launch: Right-click → Open (macOS Gatekeeper)
          releaseDraft: true
          prerelease: false
          args: "--bundles dmg"
```

- [ ] `.github/workflows/release.yml` 作成完了
- [ ] `ORG_NAME` を実際の Organization 名に置換

### 3.2 ワークフローをコミット & プッシュ

```bash
git add .github/workflows/release.yml
git commit -m "GitHub Actions リリースワークフローを追加"
git push origin master
```

- [ ] ワークフローをプッシュ完了

---

## Phase 4: 初回リリース実行

### 4.1 最終確認

```bash
# ビルドが通ることを確認
cd /Users/reverseblade/personal/portman
cargo build --release -p portman-desktop

# フロントエンドビルド確認
cd desktop && npm run build
```

- [ ] Rust ビルド成功
- [ ] フロントエンドビルド成功

### 4.2 バージョン確認

現在のバージョン: `crates/portman_desktop/tauri.conf.json`

```json
"version": "0.1.0"
```

- [ ] バージョン番号確認: `0.1.0`

### 4.3 タグ作成 & プッシュ

```bash
# タグ作成
git tag v0.1.0

# タグをプッシュ（これで GitHub Actions が起動）
git push origin v0.1.0
```

- [ ] タグ作成完了
- [ ] タグプッシュ完了

### 4.4 GitHub Actions 監視

1. https://github.com/ORG_NAME/portman/actions にアクセス
2. ワークフローの実行状況を確認（約5-10分）

- [ ] GitHub Actions 実行成功

### 4.5 Release 公開

1. https://github.com/ORG_NAME/portman/releases にアクセス
2. Draft release が作成されていることを確認
3. リリースノートを確認・編集
4. **Publish release** をクリック

- [ ] Release 公開完了
- [ ] DMG ダウンロード可能を確認

---

## Phase 5: 動作確認

### 5.1 DMG インストールテスト

```bash
# DMG をダウンロード
cd ~/Downloads
open Portman_0.1.0_aarch64.dmg

# アプリを Applications にドラッグ
# 初回起動: 右クリック → 開く
```

- [ ] DMG からインストール成功
- [ ] アプリ起動成功
- [ ] 基本機能動作確認（ポートスキャン、ラベル付け）

---

## Phase 6: Homebrew Cask（任意）

### 6.1 tap リポジトリ作成

1. Organization に `homebrew-portman` リポジトリを作成
2. `Casks/portman.rb` を作成

```bash
# DMG の SHA256 を取得
shasum -a 256 ~/Downloads/Portman_0.1.0_aarch64.dmg
```

`Casks/portman.rb`:

```ruby
cask "portman" do
  version "0.1.0"
  sha256 "SHA256_HASH_HERE"

  url "https://github.com/ORG_NAME/portman/releases/download/v#{version}/Portman_#{version}_aarch64.dmg"
  name "Portman"
  desc "Local port management tool for macOS"
  homepage "https://github.com/ORG_NAME/portman"

  app "Portman.app"

  zap trash: [
    "~/.local/share/portman",
  ]
end
```

- [ ] homebrew-portman リポジトリ作成
- [ ] Cask 定義ファイル作成

### 6.2 インストールテスト

```bash
brew tap ORG_NAME/portman
brew install --cask portman
```

- [ ] Homebrew からインストール成功

---

## 完了チェックリスト

| Phase | 項目 | 状態 |
|-------|------|------|
| 1 | 機密情報チェック | ⬜ |
| 1 | LICENSE 追加 | ⬜ |
| 2 | Organization 作成 | ⬜ |
| 2 | リポジトリ移譲 | ⬜ |
| 2 | Public 化 | ⬜ |
| 3 | GitHub Actions 設定 | ⬜ |
| 4 | タグ作成 & プッシュ | ⬜ |
| 4 | Release 公開 | ⬜ |
| 5 | 動作確認 | ⬜ |
| 6 | Homebrew Cask（任意） | ⬜ |

---

## トラブルシューティング

### GitHub Actions が失敗する場合

```bash
# ローカルでビルドテスト
cargo tauri build --bundles dmg
```

### Gatekeeper 警告が出る場合

署名なしDMGは初回起動時に警告が出る。ユーザーへの案内:

1. Finder でアプリを右クリック
2. 「開く」を選択
3. 確認ダイアログで「開く」をクリック

### 将来: Apple 署名を追加する場合

`distribution-plan.md` の Phase 4 を参照。
