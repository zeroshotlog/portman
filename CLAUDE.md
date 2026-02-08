# Portman

macOS向けローカルポート管理ツール（CLI + MCPサーバー）

## アーキテクチャ

Rustワークスペース（3クレート構成）:
- `portman-core` (ライブラリ) - コアロジック: スキャン、ラベル、ポート割り当て
- `portman-cli` (バイナリ: `portman`) - CLIインターフェース（clap使用）
- `portman-mcp` (バイナリ: `portman-mcp`) - MCPサーバー（stdio JSON-RPC）

## ビルド・テストコマンド

```bash
cargo build --workspace          # 全体ビルド
cargo test --workspace           # 全テスト実行
cargo clippy --workspace -- -D warnings  # リント
cargo run -p portman_cli -- scan # CLI実行
cargo publish --dry-run -p portman-core  # 公開検証
```

## 主要依存関係

- `rusqlite` (bundled SQLite) - ラベル永続化
- `clap` - CLI引数パース
- `tokio` - MCPサーバーの非同期I/O
- `serde` / `serde_json` - シリアライズ
- `regex` - パターンマッチング

## データ保存先

SQLiteデータベース: `~/.local/share/portman/labels.sqlite`

## プラットフォーム

macOS限定（`lsof`コマンドに依存）

## 公開順序（crates.io）

`portman-core` → `portman-mcp`（依存関係順。portman-cliは現状crates.io非公開）

## コミット・リリースルール

- コミットメッセージは日本語で書くこと
- リリースノートは英語で書くこと
- コミットメッセージに `Co-Authored-By` を付けないこと

## デスクトップアプリ リリース手順

詳細は `desktop/docs/release-checklist.md` 参照。

### バージョン更新対象
- `crates/portman_desktop/tauri.conf.json` — version
- `crates/portman_desktop/Cargo.toml` — version
- `website/index.html` — DMGリンク×4 + バージョン表示×2（計6箇所）

### リリースフロー概要
1. バージョン更新（上記3ファイル）
2. `cargo tauri build --bundles dmg` でビルド & 動作確認
3. コミット → origin/public にプッシュ → `gh release create` でRelease作成
4. ランディングページ同期: `main`ブランチに手動同期（website/がルート直下に配置される構造）
5. Homebrew tap更新: `zeroshotlog/homebrew-tap` の `Casks/portman.rb`（version + sha256）
