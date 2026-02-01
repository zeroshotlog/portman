# Portman

[![crates.io](https://img.shields.io/crates/v/portman-mcp.svg)](https://crates.io/crates/portman-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Portmanは、macOS向けのローカルポート使用状況の可視化・管理ツールです。CLIツールおよびMCP（Model Context Protocol）サーバーとして機能します。
開発者が「どのポートが使用中か」を即座に把握し、ポート競合や開発環境の混乱を防ぐために作られました。

## 特徴

- **リスナーのスキャン**: `lsof` を利用して現在LISTEN状態のTCPポートを一覧表示。
- **インテリジェントな推論**: プロセス名やポート番号から、起動中のアプリ（Vite, Next.js, Python等）を推測。
- **フリーポート検索**: 指定範囲内から安全に使える空きポートを検索・提案。
- **永続ラベル**: ポート、PID、または起動コマンドのパターン（正規表現）にラベル（名前・メモ）を付与し、DBに保存。
- **MCP対応**: Claude Code や Antigravity などのAIエージェントから直接ポート情報を取得・操作可能。

## 必須要件

- macOS (Intel / Apple Silicon)
- Rust (ビルド用)

## インストール

### crates.io からインストール（推奨）
```bash
# MCPサーバー（AIエージェント連携用）
cargo install portman-mcp

# CLIツール（MCPサーバーと一緒にインストールされるportman-coreに含まれる機能をCLIで使う場合）
cargo install --path crates/portman_cli
```

### ソースからビルドしてインストール
```bash
# CLIツールのインストール
cargo install --path crates/portman_cli

# MCPサーバーのインストール（AIエージェント連携用）
cargo install --path crates/portman_mcp
```

## ローカル開発での実行方法

開発中にソースコードから直接実行する場合：

```bash
# スキャン実行
cargo run -q -p portman_cli -- scan

# 空きポート検索
cargo run -q -p portman_cli -- ports find

# テスト実行
cargo test --workspace
```

## CLI の使い方

### 基本コマンド

| コマンド | 説明 |
| --- | --- |
| `portman scan` | アクティブなリスナー一覧を表示 |
| `portman scan --json` | JSON形式で出力 |
| `portman ports find` | 空きポートを検索 (デフォルト: 3000-8000から10個) |
| `portman who <port>` | 特定ポートの詳細情報を表示 |

### ラベル管理

アプリに名前を付けて管理できます。

```bash
# ポート番号で固定して名前を付ける
portman label set --port 5173 --name "My React App" --note "メインフロントエンド"

# PIDで一時的に名前を付ける
portman label set --pid 12345 --name "Worker"

# コマンドの正規表現パターンで名前を付ける（推奨）
# 例: "uvicorn main:app --reload" で起動するアプリを自動検出
portman label set --pattern "uvicorn.*main:app" --name "API Backend"
```

## MCP (Model Context Protocol) の設定

AIエージェント（Claude Code 等）からPortmanを利用するための設定です。

### 1. Claude Code への追加（推奨）

最新の `claude` CLI を使用している場合、以下のコマンドだけで追加できます：

```bash
# パスが通っている場合
claude mcp add portman -- portman-mcp

# うまくいかない場合（絶対パス指定）
claude mcp add portman -- ~/.cargo/bin/portman-mcp
```

※ `portman-mcp` にパスが通っている（`cargo install` 済み）必要があります。

### 2. Claude Desktop (GUI) / Antigravity

設定ファイル（`claude_desktop_config.json` 等）に以下を追記してください：

```json
{
  "mcpServers": {
    "portman": {
      "command": "portman-mcp",
      "args": []
    }
  }
}
```

パスが通っていない場合は、`command` に絶対パス（例: `/Users/username/.cargo/bin/portman-mcp`）を指定してください。

### 提供されるツール一覧

| ツール名 | 説明 |
| --- | --- |
| `scan_listeners` | ポート一覧の取得 |
| `who` | 特定ポートの詳細確認 |
| `ports_find` | 空きポート検索 |
| `label_set_*` | ラベルの設定（ポート/PID/パターン） |
| `label_list` | ラベル一覧取得 |
| `label_remove_*` | ラベル削除 |

## crates.io への公開手順（メンテナ向け）

依存関係があるため、以下の順序で公開してください：

1. **portman-core** の公開（portman-mcpの依存先）
   ```bash
   cargo publish -p portman-core
   ```

2. **portman-mcp** の公開
   ```bash
   cargo publish -p portman-mcp
   ```

## ライセンス

MIT License
