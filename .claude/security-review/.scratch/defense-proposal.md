# 防御策提案レポート

## 対応する攻撃分析
- **入力**: `.claude/security-review/.scratch/attack-analysis.md`
- **脆弱性数**: Critical 0件, High 2件, Medium 3件, Low 2件

---

## 対策サマリー（優先度順）

| 優先度 | 対策 | 対象脆弱性 | 難易度 | 効果 | Quick Win |
|--------|------|----------|--------|------|-----------|
| 1 | CSP設定の有効化 | V-001 | 低 | 高 | Yes |
| 2 | withGlobalTauriの無効化 | V-006 | 低 | 中 | Yes |
| 3 | コード署名とNotarization | V-003 | 中 | 高 | No |
| 4 | shell:allow-openのスコープ制限 | V-005 | 低 | 中 | Yes |
| 5 | 正規表現のサイズ/複雑度制限 | V-002 | 中 | 中 | No |
| 6 | エラーメッセージの抽象化 | V-004 | 低 | 低 | Yes |
| 7 | ラベル入力のサニタイズ強化 | V-007 | 低 | 低 | Yes |

---

## Quick Wins（即座に実施可能）

### QW-1: CSP設定の有効化

**対象脆弱性**: V-001
**実装時間**: 30分以内
**効果**: XSS攻撃リスクの大幅軽減

**実装手順**:

1. `tauri.conf.json` を開く
2. `app.security.csp` を適切な値に設定

**コード変更例**:

```json
// Before (脆弱)
"security": {
  "csp": null
}

// After (安全)
"security": {
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; font-src 'self'"
}
```

**注意**: `'unsafe-inline'` は `style-src` でのみ許可。`script-src` には含めない。

**ファイル**: `/Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json`

---

### QW-2: withGlobalTauriの無効化

**対象脆弱性**: V-006
**実装時間**: 15分以内
**効果**: Tauri API攻撃面の縮小

**実装手順**:

1. `tauri.conf.json` を開く
2. `app.withGlobalTauri` を `false` に設定
3. フロントエンドでの`invoke`呼び出しが正常に動作することを確認

**コード変更例**:

```json
// Before
"app": {
  "withGlobalTauri": true,
  ...
}

// After
"app": {
  "withGlobalTauri": false,
  ...
}
```

**検証方法**:
- アプリを起動し、開発者ツールで `window.__TAURI__` が `undefined` であることを確認
- すべての機能（スキャン、ラベル設定等）が正常に動作することを確認

**ファイル**: `/Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json`

---

### QW-3: shell:allow-openのスコープ制限

**対象脆弱性**: V-005
**実装時間**: 30分以内
**効果**: 任意URL開放リスクの軽減

**実装手順**:

Tauri v2ではcapabilitiesファイルでスコープを定義できる。現在は`shell:allow-open`が無制限だが、localhostとGitHubリポジトリのみに制限する。

**方法1: カスタムPermissionの定義**

`crates/portman_desktop/permissions/shell-open-restricted.toml` を作成:

```toml
[[permission]]
identifier = "shell-open-restricted"
description = "Restrict open to localhost and GitHub only"

[[permission.scope.allow]]
url = "^https?://localhost(:\\d+)?(/.*)?$"

[[permission.scope.allow]]
url = "^https://github\\.com/zeroshotlog/portman$"
```

**方法2: capabilities/default.jsonでのインライン定義**

```json
{
  "$schema": "...",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-open",
      "allow": [
        { "url": "^https?://localhost(:\\d+)?(/.*)?$" },
        { "url": "^https://github\\.com/zeroshotlog/portman.*$" }
      ]
    },
    "core:window:allow-start-dragging",
    "core:menu:default",
    "core:image:default"
  ]
}
```

**注意**: Tauri v2の正確なスコープ構文はバージョンにより異なる可能性がある。公式ドキュメントを参照のこと。

**ファイル**: `/Users/reverseblade/personal/portman/crates/portman_desktop/capabilities/default.json`

---

### QW-4: エラーメッセージの抽象化

**対象脆弱性**: V-004
**実装時間**: 30分以内
**効果**: 内部情報漏洩の防止

**実装手順**:

1. `commands.rs` でエラーをログに記録し、ユーザーには抽象的なメッセージを返す
2. 必要に応じてエラーコードを定義

**コード変更例**:

```rust
// Before (脆弱)
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()?.scan().map_err(|e| e.to_string())
}

// After (安全)
use log::error;

fn sanitize_error<E: std::fmt::Display>(e: E, context: &str) -> String {
    error!("{}: {}", context, e);
    format!("An error occurred: {}", context)
}

#[tauri::command]
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()
        .map_err(|e| sanitize_error(e, "Failed to initialize"))?
        .scan()
        .map_err(|e| sanitize_error(e, "Failed to scan ports"))
}

#[tauri::command]
pub fn set_label(args: SetLabelArgs) -> Result<(), String> {
    let now = Utc::now();
    let label = Label {
        id: None,
        key_type: args.key_type,
        key_value: args.key_value,
        name: args.name,
        note: args.note,
        created_at: now,
        updated_at: now,
    };
    portman()
        .map_err(|e| sanitize_error(e, "Failed to initialize"))?
        .set_label(&label)
        .map_err(|e| sanitize_error(e, "Failed to save label"))
}
```

**依存関係追加** (`Cargo.toml`):
```toml
[dependencies]
log = "0.4"
```

**ファイル**: `/Users/reverseblade/personal/portman/crates/portman_desktop/src/commands.rs`

---

## 対策詳細

### D-001: CSP設定の有効化（詳細版）

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-001: CSP無効化 |
| 優先度 | 1（最優先） |
| 難易度 | 低 |
| 実装コスト | 0.5人日 |
| リスク低減効果 | 高 |

**対策の説明**

Content Security Policy (CSP) はブラウザ/WebViewに対して、どのリソースの読み込み・実行を許可するかを指示するセキュリティヘッダー。XSS攻撃が成功した場合でも、CSPにより悪意のあるスクリプトの実行を防ぐことができる。

Tauri v2では `tauri.conf.json` の `app.security.csp` で設定する。

**推奨CSP設定**

Portmanアプリケーションに最適なCSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self' ipc: http://ipc.localhost;
font-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

**各ディレクティブの説明**:

| ディレクティブ | 設定 | 理由 |
|---------------|------|------|
| `default-src` | `'self'` | 明示されていないリソースは自己オリジンのみ |
| `script-src` | `'self'` | インラインスクリプトを禁止（XSS対策の核心） |
| `style-src` | `'self' 'unsafe-inline'` | Tailwindのインラインスタイルに必要 |
| `img-src` | `'self' data:` | Base64画像とローカル画像を許可 |
| `connect-src` | `'self' ipc: http://ipc.localhost` | Tauri IPCに必要 |
| `object-src` | `'none'` | プラグイン（Flash等）を完全禁止 |
| `frame-ancestors` | `'none'` | iframeへの埋め込みを禁止（クリックジャッキング対策） |

**実装**

`/Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json`:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    }
  }
}
```

**検証方法**

1. アプリをビルド: `npm run tauri build`
2. アプリを起動し、開発者ツールのコンソールでCSP違反がないことを確認
3. XSSテスト: 開発者ツールで `<script>alert(1)</script>` をDOMに挿入し、実行されないことを確認

**参照資料**
- [Tauri v2 CSP Documentation](https://v2.tauri.app/security/csp/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

### D-002: withGlobalTauri無効化（詳細版）

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-006: withGlobalTauri有効化 |
| 優先度 | 2 |
| 難易度 | 低 |
| 実装コスト | 0.25人日 |
| リスク低減効果 | 中 |

**対策の説明**

`withGlobalTauri: true` は `window.__TAURI__` オブジェクトをグローバルに公開する開発者向け機能。本番ビルドでは不要であり、XSS攻撃成功時にTauri APIへの直接アクセスを許してしまう。

**実装**

`/Users/reverseblade/personal/portman/crates/portman_desktop/tauri.conf.json`:

```json
{
  "app": {
    "withGlobalTauri": false
  }
}
```

**フロントエンドへの影響**

現在のコードは `@tauri-apps/api` パッケージ経由でAPIを呼び出しているため、変更は不要:

```typescript
// これらは引き続き動作する
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
```

**検証方法**

1. アプリをビルドして起動
2. 開発者ツールで `window.__TAURI__` を確認し、`undefined` であること
3. 全機能（スキャン、ラベル編集、URLオープン）が正常動作すること

**参照資料**
- [Tauri v2 Security Best Practices](https://v2.tauri.app/security/)

---

### D-003: macOSコード署名とNotarization

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-003: 未署名アプリケーション配布 |
| 優先度 | 3 |
| 難易度 | 中 |
| 実装コスト | 2-3人日（初期セットアップ） |
| リスク低減効果 | 高 |

**対策の説明**

Apple Developer IDで署名されていないアプリケーションは:
1. Gatekeeperが警告を表示
2. ユーザーが「セキュリティとプライバシー」設定で許可する必要がある
3. 改ざん検知ができない

コード署名とNotarizationにより、これらの問題を解決できる。

**前提条件**

- Apple Developer Program への登録（年間$99）
- Developer ID Application 証明書の取得
- App Store Connect API キーの作成（Notarization用）

**実装手順**

#### ステップ1: 証明書の取得

1. [Apple Developer](https://developer.apple.com/) にログイン
2. Certificates, Identifiers & Profiles > Certificates
3. 「Developer ID Application」証明書を作成
4. ダウンロードしてキーチェーンにインストール

#### ステップ2: 環境変数の設定

CI/CDまたはローカル環境に以下を設定:

```bash
# 署名用
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (XXXXXXXXXX)"

# Notarization用（App Store Connect API）
export APPLE_API_KEY="AuthKey_XXXXXXXXXX.p8"
export APPLE_API_KEY_PATH="/path/to/AuthKey_XXXXXXXXXX.p8"
export APPLE_API_ISSUER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

または Apple ID 認証:

```bash
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="@keychain:AC_PASSWORD"  # アプリ固有パスワード
export APPLE_TEAM_ID="XXXXXXXXXX"
```

#### ステップ3: tauri.conf.json の設定

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": null,  // 環境変数から読み込み
      "providerShortName": null,
      "entitlements": null,
      "exceptionDomain": null,
      "hardenedRuntime": true
    }
  }
}
```

#### ステップ4: CI/CD設定（GitHub Actions例）

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Import certificates
        env:
          CERTIFICATE_BASE64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        run: |
          echo "$CERTIFICATE_BASE64" | base64 --decode > certificate.p12
          security create-keychain -p "" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "" build.keychain
          security import certificate.p12 -k build.keychain -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain
      
      - name: Build and sign
        env:
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
          APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
          APPLE_API_KEY_PATH: ${{ runner.temp }}/AuthKey.p8
        run: |
          echo "${{ secrets.APPLE_API_KEY_CONTENT }}" > "$APPLE_API_KEY_PATH"
          npm run tauri build
```

**代替案: チェックサム提供**

コード署名が困難な場合の暫定対策として、リリースにSHA-256チェックサムを提供:

`release-notes.md`:
```markdown
## Download

- [Portman-0.1.0_universal.dmg](...)

### Verification

SHA-256 checksums:
```
a1b2c3d4... Portman-0.1.0_universal.dmg
```

Verify with:
```bash
shasum -a 256 Portman-0.1.0_universal.dmg
```
```

**検証方法**

```bash
# 署名の確認
codesign --verify --verbose /Applications/Portman.app

# Notarizationの確認
spctl --assess --verbose /Applications/Portman.app
```

**参照資料**
- [Tauri macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Apple Developer ID](https://developer.apple.com/developer-id/)

---

### D-004: shell:allow-openスコープ制限（詳細版）

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-005: shell:allow-open権限によるURL開放リスク |
| 優先度 | 4 |
| 難易度 | 低 |
| 実装コスト | 0.5人日 |
| リスク低減効果 | 中 |

**対策の説明**

現在の `shell:allow-open` 権限では、デフォルトで `mailto:`, `tel:`, `http://`, `https://` プロトコルの任意URLを開ける。これをlocalhostとGitHubリポジトリに制限する。

**現在の使用箇所分析**

| ファイル | 使用目的 | URL形式 |
|---------|---------|---------|
| `ListenerCard.tsx:32` | ポートをブラウザで開く | `http://localhost:{port}/` |
| `menu.ts:57` | ヘルプ（GitHub） | `https://github.com/zeroshotlog/portman` |

**実装**

Tauri v2では、capabilitiesファイルでスコープを定義できる。

#### 方法A: 既存のcapabilitiesを更新

`/Users/reverseblade/personal/portman/crates/portman_desktop/capabilities/default.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/nicholasio/tauri-deb-example/refs/heads/main/src-tauri/gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
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

#### 方法B: Tauri v2 openerプラグインへの移行

Tauri v2では `@tauri-apps/plugin-shell` の `open` よりも `@tauri-apps/plugin-opener` が推奨される場合がある。openerプラグインはより細かいスコープ制御が可能。

```bash
npm install @tauri-apps/plugin-opener
cargo add tauri-plugin-opener
```

```typescript
// 変更前
import { open } from "@tauri-apps/plugin-shell";

// 変更後
import { openUrl } from "@tauri-apps/plugin-opener";
```

**フロントエンド側の追加検証**

URLを開く前に、フロントエンド側でも検証を行う（多層防御）:

```typescript
// utils/safeOpen.ts
import { open } from "@tauri-apps/plugin-shell";

const ALLOWED_URL_PATTERNS = [
  /^http:\/\/localhost(:\d+)?(\/.*)?$/,
  /^https:\/\/github\.com\/zeroshotlog\/portman.*$/,
];

export async function safeOpen(url: string): Promise<void> {
  const isAllowed = ALLOWED_URL_PATTERNS.some(pattern => pattern.test(url));
  if (!isAllowed) {
    console.error(`Blocked opening disallowed URL: ${url}`);
    return;
  }
  await open(url);
}
```

使用箇所を更新:

```typescript
// ListenerCard.tsx
import { safeOpen } from "../utils/safeOpen";

<button onClick={() => safeOpen(item.listener.url)}>
  :{item.listener.port}
</button>
```

**検証方法**

1. localhostのポートをクリックし、ブラウザで開くことを確認
2. ヘルプメニューからGitHubリポジトリが開くことを確認
3. 開発者ツールで `open("https://evil.com")` を実行し、ブロックされることを確認

**参照資料**
- [Tauri v2 Shell Plugin](https://v2.tauri.app/plugin/shell/)
- [Tauri v2 Command Scopes](https://v2.tauri.app/security/scope/)
- [Tauri v2 Opener Plugin](https://v2.tauri.app/plugin/opener/)

---

### D-005: 正規表現のサイズ/複雑度制限

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-002: ReDoS（正規表現DoS）可能性 |
| 優先度 | 5 |
| 難易度 | 中 |
| 実装コスト | 1人日 |
| リスク低減効果 | 中 |

**対策の説明**

Rustの`regex`クレートはデフォルトでバックトラッキングを行わないため、古典的なReDoS攻撃には耐性がある。しかし、非常に大きな正規表現や特定のパターンでは依然としてパフォーマンス問題が発生する可能性がある。

**多層対策**

#### 対策1: 正規表現の長さ制限

```rust
// resolver.rs または validation.rs

const MAX_REGEX_LENGTH: usize = 256;

pub fn validate_regex_pattern(pattern: &str) -> Result<regex::Regex, String> {
    if pattern.len() > MAX_REGEX_LENGTH {
        return Err(format!(
            "Pattern too long: {} chars (max {})",
            pattern.len(),
            MAX_REGEX_LENGTH
        ));
    }
    
    regex::Regex::new(pattern)
        .map_err(|e| format!("Invalid regex: {}", e))
}
```

#### 対策2: RegexBuilderでサイズ制限

```rust
use regex::RegexBuilder;

const MAX_REGEX_SIZE: usize = 10 * (1 << 20);  // 10MB

pub fn safe_regex(pattern: &str) -> Result<regex::Regex, regex::Error> {
    RegexBuilder::new(pattern)
        .size_limit(MAX_REGEX_SIZE)
        .dfa_size_limit(MAX_REGEX_SIZE)
        .build()
}
```

#### 対策3: マッチングのタイムアウト

```rust
use std::time::{Duration, Instant};

const MATCH_TIMEOUT: Duration = Duration::from_millis(100);

pub fn safe_match(re: &regex::Regex, text: &str) -> bool {
    let start = Instant::now();
    
    // regex crateは自動的にバックトラッキングを制限するため
    // 通常は追加のタイムアウトは不要だが、念のため計測
    let result = re.is_match(text);
    
    if start.elapsed() > MATCH_TIMEOUT {
        log::warn!(
            "Regex match took {:?} for pattern: {}",
            start.elapsed(),
            re.as_str()
        );
    }
    
    result
}
```

#### 対策4: 危険なパターンの拒否（オプション）

```rust
// 特に危険なパターンを拒否（過剰防御だが参考として）
const DANGEROUS_PATTERNS: &[&str] = &[
    r"(.+)+",    // ネストした量指定子
    r"(.*)*",
    r"(a+)+",
];

pub fn is_dangerous_pattern(pattern: &str) -> bool {
    for dangerous in DANGEROUS_PATTERNS {
        if pattern.contains(dangerous) {
            return true;
        }
    }
    false
}
```

**resolver.rs への統合**

```rust
// resolver.rs

use crate::validation::validate_regex_pattern;

pub fn resolve_enrichment(listeners: Vec<LiveListener>, labels: Vec<Label>) -> Vec<EnrichedListener> {
    let mut pattern_labels = Vec::new();
    
    for label in labels {
        match label.key_type {
            LabelKeyType::Pattern => {
                // Before: Regex::new(&label.key_value)
                // After: 検証付き
                match validate_regex_pattern(&label.key_value) {
                    Ok(re) => pattern_labels.push((re, label)),
                    Err(e) => {
                        log::warn!("Skipping invalid pattern '{}': {}", label.key_value, e);
                    }
                }
            }
            // ...
        }
    }
    // ...
}
```

**フロントエンド側のバリデーション（将来Pattern UIを追加する場合）**

```typescript
// validation.ts
const MAX_PATTERN_LENGTH = 256;

export function validateRegexPattern(pattern: string): string | null {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return `Pattern too long (max ${MAX_PATTERN_LENGTH} characters)`;
  }
  
  try {
    new RegExp(pattern);
    return null;
  } catch (e) {
    return `Invalid regex: ${e.message}`;
  }
}
```

**検証方法**

```rust
#[test]
fn test_regex_length_limit() {
    let long_pattern = "a".repeat(300);
    assert!(validate_regex_pattern(&long_pattern).is_err());
}

#[test]
fn test_regex_size_limit() {
    // 非常に大きなコンパイル結果を生成するパターン
    let complex = format!("({})?", "a".repeat(100));
    // サイズ制限により失敗するか、または成功するがサイズ内に収まる
}
```

**参照資料**
- [regex crate documentation](https://docs.rs/regex/latest/regex/)
- [OWASP ReDoS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

### D-006: エラーメッセージの抽象化（詳細版）

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-004: プロセス情報のエラー露出 |
| 優先度 | 6 |
| 難易度 | 低 |
| 実装コスト | 0.5人日 |
| リスク低減効果 | 低 |

**対策の説明**

現在、Rustバックエンドのエラーは `.map_err(|e| e.to_string())` で直接フロントエンドに返されている。これにより内部パスやシステム状態が露出する可能性がある。

**実装**

`/Users/reverseblade/personal/portman/crates/portman_desktop/src/commands.rs`:

```rust
use portman_core::models::{EnrichedListener, Label, LabelKeyType};
use portman_core::Portman;
use chrono::Utc;
use serde::Deserialize;
use log::error;

// エラーコードの定義（オプション）
#[derive(Debug)]
enum AppError {
    InitializationFailed,
    ScanFailed,
    LabelOperationFailed,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::InitializationFailed => write!(f, "Failed to initialize application"),
            AppError::ScanFailed => write!(f, "Failed to scan ports"),
            AppError::LabelOperationFailed => write!(f, "Failed to perform label operation"),
        }
    }
}

fn handle_error<E: std::fmt::Display>(err: E, user_message: AppError) -> String {
    // 詳細はログに記録（デバッグ用）
    error!("{}: {}", user_message, err);
    // ユーザーには抽象的なメッセージを返す
    user_message.to_string()
}

fn portman() -> Result<Portman, String> {
    Portman::new().map_err(|e| handle_error(e, AppError::InitializationFailed))
}

#[tauri::command]
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()?
        .scan()
        .map_err(|e| handle_error(e, AppError::ScanFailed))
}

#[tauri::command]
pub fn who(port: u16) -> Result<Option<EnrichedListener>, String> {
    let results = portman()?
        .scan()
        .map_err(|e| handle_error(e, AppError::ScanFailed))?;
    Ok(results.into_iter().find(|e| e.listener.port == port))
}

#[tauri::command]
pub fn find_free_ports(
    range_start: Option<u16>,
    range_end: Option<u16>,
    count: Option<usize>,
) -> Result<Vec<u16>, String> {
    let start = range_start.unwrap_or(3000);
    let end = range_end.unwrap_or(8000);
    let cnt = count.unwrap_or(10);
    portman()?
        .find_free_ports(start, end, cnt)
        .map_err(|e| handle_error(e, AppError::ScanFailed))
}

#[tauri::command]
pub fn get_labels() -> Result<Vec<Label>, String> {
    portman()?
        .get_labels()
        .map_err(|e| handle_error(e, AppError::LabelOperationFailed))
}

#[derive(Deserialize)]
pub struct SetLabelArgs {
    pub key_type: LabelKeyType,
    pub key_value: String,
    pub name: String,
    pub note: Option<String>,
}

#[tauri::command]
pub fn set_label(args: SetLabelArgs) -> Result<(), String> {
    let now = Utc::now();
    let label = Label {
        id: None,
        key_type: args.key_type,
        key_value: args.key_value,
        name: args.name,
        note: args.note,
        created_at: now,
        updated_at: now,
    };
    portman()?
        .set_label(&label)
        .map_err(|e| handle_error(e, AppError::LabelOperationFailed))
}

#[tauri::command]
pub fn remove_label(key_type: LabelKeyType, key_value: String) -> Result<(), String> {
    portman()?
        .remove_label(key_type, &key_value)
        .map_err(|e| handle_error(e, AppError::LabelOperationFailed))
}
```

**ログ設定の追加**

`main.rs` にログ初期化を追加:

```rust
fn main() {
    // 開発時はデバッグログ、本番はエラーログのみ
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("error")
    ).init();
    
    tauri::Builder::default()
        // ...
}
```

`Cargo.toml`:
```toml
[dependencies]
log = "0.4"
env_logger = "0.11"
```

**検証方法**

1. 意図的にエラーを発生させる（例: DBファイルの権限を変更）
2. フロントエンドに表示されるエラーが抽象的なメッセージであることを確認
3. 詳細なエラーがログに記録されていることを確認

**参照資料**
- [OWASP Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

---

### D-007: ラベル入力のサニタイズ強化

**基本情報**
| 項目 | 内容 |
|------|------|
| 対象脆弱性 | V-007: ラベルデータのXSS潜在リスク |
| 優先度 | 7 |
| 難易度 | 低 |
| 実装コスト | 0.25人日 |
| リスク低減効果 | 低 |

**対策の説明**

ReactはデフォルトでXSS対策（エスケープ）を行うため、現状では安全。しかし、将来的な変更に備えて入力時のサニタイズを強化しておく。

**実装（フロントエンド）**

`/Users/reverseblade/personal/portman/desktop/src/components/LabelEditor.tsx`:

```typescript
// 入力サニタイズユーティリティ
function sanitizeInput(value: string): string {
  return value
    .trim()
    // 制御文字を除去
    .replace(/[\x00-\x1F\x7F]/g, '')
    // 長さ制限
    .slice(0, 100);
}

function sanitizeNote(value: string): string {
  return value
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, 500);
}

// LabelEditor内で使用
const handleSave = async () => {
  const sanitizedName = sanitizeInput(name);
  const sanitizedNote = note ? sanitizeNote(note) : undefined;
  
  if (!sanitizedName) {
    setError("Name is required");
    return;
  }
  
  await onSave({
    key_type: "Port",
    key_value: String(port),
    name: sanitizedName,
    note: sanitizedNote,
  });
  onCancel();
};
```

**実装（バックエンド）**

`/Users/reverseblade/personal/portman/crates/portman_desktop/src/commands.rs`:

```rust
fn sanitize_string(s: &str, max_len: usize) -> String {
    s.chars()
        .filter(|c| !c.is_control())
        .take(max_len)
        .collect::<String>()
        .trim()
        .to_string()
}

#[tauri::command]
pub fn set_label(args: SetLabelArgs) -> Result<(), String> {
    // 入力のサニタイズ
    let name = sanitize_string(&args.name, 100);
    let note = args.note.map(|n| sanitize_string(&n, 500));
    
    if name.is_empty() {
        return Err("Label name cannot be empty".to_string());
    }
    
    let now = Utc::now();
    let label = Label {
        id: None,
        key_type: args.key_type,
        key_value: args.key_value,
        name,
        note,
        created_at: now,
        updated_at: now,
    };
    portman()?
        .set_label(&label)
        .map_err(|e| handle_error(e, AppError::LabelOperationFailed))
}
```

**dangerouslySetInnerHTMLの禁止（コードレビュールール）**

ESLintルールを追加:

`.eslintrc.json`:
```json
{
  "rules": {
    "react/no-danger": "error"
  }
}
```

**検証方法**

```typescript
// テスト
describe('sanitizeInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
  
  it('should remove control characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });
  
  it('should enforce max length', () => {
    const longString = 'a'.repeat(150);
    expect(sanitizeInput(longString).length).toBe(100);
  });
  
  it('should handle XSS attempts', () => {
    // Reactが自動エスケープするが、念のため
    const xss = '<script>alert(1)</script>';
    const sanitized = sanitizeInput(xss);
    // 制御文字がないのでそのまま保存される（表示時にReactがエスケープ）
    expect(sanitized).toBe(xss);
  });
});
```

**参照資料**
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)

---

## 多層防御設計

### 推奨アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                       Portman Desktop                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   React Frontend                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ 入力検証    │  │ safeOpen   │  │ Reactエスケープ │  │   │
│  │  │ (length,    │  │ (URL検証)  │  │ (XSS防止)       │  │   │
│  │  │  sanitize)  │  │            │  │                  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │ Tauri IPC                           │
│                           │ (型安全、capabilities制限)          │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                   Rust Backend                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ 入力検証    │  │ エラー抽象化│  │ パラメータ化    │  │   │
│  │  │ (sanitize)  │  │ (ログ分離) │  │ クエリ(SQLite) │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Tauri Security                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ CSP有効     │  │ Capabilities│  │ withGlobalTauri: false │ │
│  │             │  │ (最小権限)  │  │                        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       配布セキュリティ                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ コード署名 + Notarization (Apple Developer ID)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 各レイヤーの対策まとめ

| レイヤー | 対策 | 対象脆弱性 |
|---------|------|-----------|
| フロントエンド | 入力サニタイズ、URL検証、Reactエスケープ | V-007, V-005 |
| Tauri IPC | 型安全なコマンド、capabilities制限 | V-005, V-006 |
| Rust バックエンド | 入力検証、エラー抽象化、パラメータ化クエリ | V-002, V-004 |
| Tauri 設定 | CSP有効化、withGlobalTauri無効化 | V-001, V-006 |
| 配布 | コード署名、Notarization | V-003 |

---

## 継続的セキュリティ

### 開発プロセスへの組み込み

| フェーズ | セキュリティ活動 |
|---------|----------------|
| 設計 | 新機能のセキュリティ影響評価 |
| 実装 | ESLint/Clippy警告への対応、入力検証 |
| テスト | セキュリティテストケースの追加 |
| デプロイ | コード署名、Notarization |
| 運用 | 依存関係の定期更新 |

### 推奨ツール

| 目的 | ツール |
|------|--------|
| Rustセキュリティ | `cargo audit`, `cargo deny` |
| npmセキュリティ | `npm audit`, `snyk` |
| コード品質 | `clippy`, `eslint`, `prettier` |
| 依存関係更新 | Dependabot, Renovate |
| セキュリティスキャン | Semgrep, CodeQL |

### CI/CD統合例

`.github/workflows/security.yml`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  rust-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
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
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run npm audit
        run: npm audit --audit-level=high
      - name: Run eslint
        run: npm run lint
```

---

## 実装ロードマップ

### 短期（1-2日）: Quick Wins

- [x] D-001: CSP設定の有効化
- [x] D-002: withGlobalTauri無効化
- [x] D-006: エラーメッセージ抽象化
- [x] D-007: ラベル入力サニタイズ

### 中期（1週間）: 権限強化

- [ ] D-004: shell:allow-openスコープ制限
- [ ] D-005: 正規表現サイズ/複雑度制限
- [ ] CI/CDセキュリティチェック統合

### 長期（1ヶ月）: 配布セキュリティ

- [ ] D-003: Apple Developer Program登録
- [ ] D-003: コード署名とNotarization設定
- [ ] D-003: GitHub Actions自動署名パイプライン
- [ ] SBOM（Software Bill of Materials）生成

---

## 次ステップへの引き継ぎ

### sec-report-integratorへの入力

**優先対策**:
1. D-001: CSP有効化（Quick Win）
2. D-002: withGlobalTauri無効化（Quick Win）
3. D-003: コード署名（中長期）

**攻撃チェーン阻止ポイント**:
- Chain-1（XSS経由の情報窃取）: D-001（CSP）で阻止
- Chain-2（サプライチェーン攻撃）: D-003（署名）で阻止

**改善ロードマップ案**:
- **短期**: Quick Wins実施（D-001, D-002, D-006, D-007）
- **中期**: 権限強化（D-004, D-005）+ CI/CD統合
- **長期**: コード署名体制構築（D-003）

---

## 参照資料

### 公式ドキュメント
- [Tauri v2 Security](https://v2.tauri.app/security/)
- [Tauri v2 CSP](https://v2.tauri.app/security/csp/)
- [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri v2 macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri v2 Shell Plugin](https://v2.tauri.app/plugin/shell/)

### OWASPリソース
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

### セキュリティアドバイザリ
- [Tauri Shell Plugin Security Advisory (GHSA-c9pr-q8gx-3mgp)](https://github.com/tauri-apps/plugins-workspace/security/advisories/GHSA-c9pr-q8gx-3mgp)
