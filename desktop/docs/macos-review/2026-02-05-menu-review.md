# macOS UI/UX レビュー結果 -- メニューバー重点

## 対象情報

| 項目 | 値 |
|------|-----|
| プロジェクト | Portman (macOS向けローカルポート管理ツール) |
| 技術スタック | Tauri v2 (Rust backend + React 19 / TypeScript / Tailwind CSS v4) |
| レビュー日 | 2026-02-05 |
| レビュー範囲 | メニューバー設計を中心に、関連するショートカット・アクセシビリティ・ネイティブ感を包括 |

---

## スコアサマリー

| カテゴリ | スコア | 評価 |
|---------|--------|------|
| メニューバー設計 | 2/5 | 要改善 -- Tauriデフォルトに完全依存しアプリ固有メニューが皆無 |
| ウィンドウ設計 | 4/5 | 良好 -- Overlay titlebar・ドラッグ領域は適切、状態永続化が未対応 |
| カラー/テーマ | 3/5 | 普通 -- Light/Dark対応済みだがシステム追従とコントラスト不足あり |
| タイポグラフィ | 4/5 | 良好 -- 13px基準・SF Proフォールバックでネイティブ準拠 |
| アクセシビリティ | 2/5 | 要改善 -- ARIA属性・フォーカスリング・Reduce Motion全て未対応 |
| アニメーション | 3/5 | 普通 -- 基本的なトランジションあるがReduce Motion非対応 |
| ネイティブ感 | 3/5 | 普通 -- フォント・タイトルバーは良いがメニュー・通知・システム連携に課題 |
| **総合** | **3.0/5** | **基盤は整っているが、メニューバーとアクセシビリティに根本的な改善が必要** |

---

## 重大な問題（Critical -- 即時対応）

### 1. Settingsメニュー項目とCmd+,ショートカットの欠落

- **カテゴリ**: メニューバー設計 / ショートカット
- **場所**: `crates/portman_desktop/src/main.rs`
- **問題**: Appメニュー(Portman)に「Settings...」(Cmd+,)が存在しない。Apple HIGではmacOSアプリに Cmd+, は必須とされている。なお、Tauri v2のデフォルトメニューには「Settings...」が含まれるとの報告もあるが、対応するSettings画面が未実装であるため、いずれにせよユーザーがクリックしても何も起きない状態にある。
- **HIG準拠**: 「Settings... (Cmd+,) はアプリケーションメニューの標準項目として必須」(macOS HIG - Menus)
- **検出元**: structure-review (M1), visual-review (#1), native-review (#2)
- **改善案**:
  ```rust
  // crates/portman_desktop/src/main.rs (Tauri v2)
  use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder};

  fn main() {
      tauri::Builder::default()
          .plugin(tauri_plugin_shell::init())
          .setup(|app| {
              let settings = MenuItemBuilder::new("Settings\u{2026}")
                  .accelerator("CmdOrCtrl+,")
                  .id("settings")
                  .build(app)?;

              // App submenu に Settings を追加
              // フロントエンドで menu イベントをリッスンし設定画面を表示
              Ok(())
          })
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
  }
  ```

### 2. About Portman のメタデータ未設定

- **カテゴリ**: メニューバー設計 / ネイティブ感
- **場所**: `crates/portman_desktop/src/main.rs`
- **問題**: Appメニューの「About Portman」が表示されるが、`AboutMetadata`（`product_name`, `version`, `copyright`）が未設定のため、Aboutダイアログの情報が空になる可能性がある。
- **HIG準拠**: 「About [App Name] はアプリメニューの先頭に配置し、バージョン・著作権情報を表示する」(macOS HIG - App Menu)
- **検出元**: native-review (#1)
- **改善案**:
  ```rust
  // tauri.conf.json の bundle セクション、または main.rs で AboutMetadata を設定
  // tauri.conf.json
  {
    "bundle": {
      "shortDescription": "Local port management tool for macOS",
      "copyright": "Copyright 2026 reverseblade"
    }
  }
  ```

### 3. ダークモードがシステム環境設定と連動していない

- **カテゴリ**: カラー/テーマ / ネイティブ感
- **場所**: `desktop/src/hooks/useTheme.ts:7-11`
- **問題**: `useTheme.ts` では `localStorage` からのみ初期値を取得し、`prefers-color-scheme` メディアクエリを参照していない。macOSシステム設定でダークモードに切り替えてもアプリが追従しない。
- **HIG準拠**: 「アプリはシステムの外観設定に自動的に追従すべき」(macOS HIG - Dark Mode)
- **検出元**: native-review (#1 in 3.4)
- **改善案**:
  ```typescript
  // desktop/src/hooks/useTheme.ts
  function getInitialTheme(): Theme {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
      // システム設定にフォールバック
      return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark" : "light";
  }

  // useEffect 内で動的追従
  useEffect(() => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
          if (!localStorage.getItem(STORAGE_KEY)) {
              setTheme(e.matches ? "dark" : "light");
          }
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
  }, []);
  ```

### 4. フォーカスリングが全input要素で削除されている

- **カテゴリ**: アクセシビリティ
- **場所**: `desktop/src/components/LabelEditor.tsx:41,53`, `desktop/src/components/Toolbar.tsx:49`, `desktop/src/components/FreePortFinder.tsx:34,53,71`
- **問題**: 全ての `<input>` 要素に `outline-none` が指定されフォーカスリングが消えている。キーボード操作ユーザーが現在のフォーカス位置を視覚的に確認できない。
- **HIG準拠**: 「全てのインタラクティブ要素にフォーカスインジケータが必要」(macOS HIG - Accessibility / WCAG 2.4.7)
- **検出元**: a11y-review (キーボード操作 #1, #2)
- **改善案**:
  ```tsx
  // outline-none を削除し、focus-visible ベースのフォーカスリングを追加
  // Before:
  <input className="... outline-none ..." />

  // After:
  <input className="... outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ..." />
  ```

### 5. prefers-reduced-motion への対応が一切ない

- **カテゴリ**: アクセシビリティ / アニメーション
- **場所**: `desktop/src/index.css`
- **問題**: `prefers-reduced-motion` メディアクエリへの対応がなく、`animate-pulse`（StatusBar）を含む全アニメーションがReduce Motion設定時も継続する。
- **HIG準拠**: 「Reduce Motionが有効な場合、不必要なアニメーションを停止する」(macOS HIG - Motion / Accessibility)
- **検出元**: a11y-review (アニメーション #1, #2)
- **改善案**:
  ```css
  /* desktop/src/index.css に追加 */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
  ```

### 6. SVGアイコンにARIA属性が欠如

- **カテゴリ**: アクセシビリティ
- **場所**: `desktop/src/components/Sidebar.tsx:83-90`, `desktop/src/components/Sidebar.tsx:148-192` 他多数
- **問題**: SVGアイコンのみのボタン（テーマ切替等）に `aria-label` がなく、装飾的SVGに `aria-hidden="true"` が設定されていない。VoiceOverがSVGの内部構造を読み上げてしまう。
- **HIG準拠**: 「全てのインタラクティブ要素はアクセシブルなラベルを持つべき」(macOS HIG - Accessibility)
- **検出元**: a11y-review (VoiceOver #1, #2)
- **改善案**:
  ```tsx
  // アイコンのみのボタン
  <button aria-label="Toggle dark mode">
    <SunIcon aria-hidden="true" />
  </button>

  // 装飾的SVGアイコン（テキストラベルが隣接する場合）
  <PortsIcon aria-hidden="true" />
  ```

---

## 改善推奨（High -- 短期対応）

### 1. Cmd+R (Refresh) ショートカットが未実装

- **カテゴリ**: メニューバー設計 / ショートカット
- **場所**: `desktop/src/components/Toolbar.tsx:69-76`, `crates/portman_desktop/src/main.rs`
- **問題**: ツールバーにRefreshボタンがあるがキーボードショートカットがなく、メニューからもアクセスできない。ポートスキャンの更新はアプリの主要操作。
- **改善案**: Viewメニューに「Refresh」(Cmd+R)を追加し、フロントエンドの `refresh()` と連携する。
- **検出元**: structure-review (K3, M5), visual-review (#6), native-review (#3 in 1)

### 2. Cmd+F (Find/Filter) ショートカットが未実装

- **カテゴリ**: メニューバー設計 / ショートカット
- **場所**: `desktop/src/components/Toolbar.tsx:42-55`
- **問題**: ツールバーにフィルター入力があるが、Cmd+Fで直接フォーカスできない。macOSではCmd+Fによる検索フォーカスが標準。
- **改善案**: Cmd+Fをインターセプトして検索フィールドにフォーカスを移動する。Editメニュー内のFind項目として実装するのがHIG準拠。
- **検出元**: structure-review (K2), visual-review (#7)

### 3. テーマ切替がメニューからアクセスできない

- **カテゴリ**: メニューバー設計
- **場所**: `desktop/src/components/Sidebar.tsx:83-91`
- **問題**: ダークモード切替がサイドバーのボタンのみで、メニューバーからアクセスできない。macOSアプリではViewメニューまたはSettingsから外観を切り替えるのが標準的。
- **改善案**: Viewメニューに「Appearance」サブメニュー(Light / Dark / Auto)を追加。
- **検出元**: structure-review (M2), native-review (#3 in 3.4)

### 4. Helpメニューにコンテンツがない

- **カテゴリ**: メニューバー設計
- **場所**: Tauriデフォルトメニュー
- **問題**: Helpメニューが空であるか、Helpメニュー自体が存在しない。Apple HIGではHelpメニューの設置を推奨。
- **改善案**: 「Portman Help」項目を追加し、GitHubリポジトリやドキュメントへのリンクを提供する。
- **検出元**: structure-review (M3), visual-review (#4), a11y-review (#2 in メニューバー), native-review (#6)

### 5. メニュー項目とツールバーアクションの対応が不完全

- **カテゴリ**: メニューバー設計 / ネイティブ感
- **場所**: 全般
- **問題**: ツールバーにある「リフレッシュ」「表示切替」「フィルター」はメニューに対応項目がないため、メニューからアクセスできない。Apple HIGでは「全ての機能はメニューバーからアクセスできるべき」とされている。
- **改善案**: 主要操作にキーボードショートカットを割り当て、対応するメニュー項目を追加する。
- **検出元**: structure-review (K5), native-review (#7)

### 6. Dark Modeのコントラスト不足 (--text-label)

- **カテゴリ**: カラー/テーマ / アクセシビリティ
- **場所**: `desktop/src/index.css:40`
- **問題**: `--text-label` (#71717a) がDarkモード背景(#18181b)上で使用されコントラスト比約3.2:1。WCAG AA基準(4.5:1)を不通過。
- **改善案**: Darkモードでは `--text-label` を `#a0a0a8` 以上に変更。
- **検出元**: a11y-review (コントラスト #2)

### 7. ラベル削除時の確認ダイアログがない

- **カテゴリ**: ネイティブ感
- **場所**: `desktop/src/components/ListenerTable.tsx:103`, `desktop/src/components/ListenerCard.tsx:72`
- **問題**: removeボタン押下で即座に削除される。macOS HIGでは破壊的操作に確認ダイアログを推奨。
- **改善案**: 削除操作時にNSAlert相当の確認ダイアログを表示する。
- **検出元**: native-review (#2 in 2)

### 8. Cmd+W後のウィンドウ再表示処理が未実装の可能性

- **カテゴリ**: ネイティブ感
- **場所**: `crates/portman_desktop/src/main.rs`
- **問題**: macOSではCmd+Wでウィンドウを閉じてもアプリは終了せず、Dockアイコンクリックでウィンドウを再表示するのが標準動作。この処理がTauriデフォルト動作に依存。
- **改善案**: `on_window_event` で `CloseRequested` を処理し、`activated` イベントでウィンドウを再表示する。
- **検出元**: native-review (#1 in 3.5)

### 9. ラベル保存成功時のフィードバックがない

- **カテゴリ**: ネイティブ感
- **場所**: `desktop/src/components/LabelEditor.tsx:17-30`
- **問題**: LabelEditorでSave実行後、UIが閉じるだけで成功/失敗のフィードバックがない。
- **改善案**: 保存成功時にインラインのチェックマークアニメーションまたは短時間のトースト表示を追加。
- **検出元**: native-review (#1 in 2)

### 10. キーボード操作 -- hover時のみ表示されるボタンがキーボードで到達不可能

- **カテゴリ**: アクセシビリティ
- **場所**: `desktop/src/components/ListenerTable.tsx:95-108`, `desktop/src/components/ListenerCard.tsx:63`
- **問題**: edit/removeボタンが `invisible group-hover:visible` で制御されており、キーボードフォーカス時に表示されない。
- **改善案**: `invisible group-hover:visible focus:visible` または `opacity-0 group-hover:opacity-100 focus:opacity-100` に変更し、フォーカス時にも表示する。
- **検出元**: a11y-review (VoiceOver #9, #10, キーボード操作 #5)

---

## 改善提案（Medium -- 中期対応）

### 1. Viewメニューに表示切替(List/Grid)を追加

- **カテゴリ**: メニューバー設計
- **場所**: `desktop/src/components/Toolbar.tsx:59-66`
- **現状**: List/Grid切替がツールバーボタンのみで提供されている。
- **提案**: Viewメニューに「as List」(Cmd+1) / 「as Grid」(Cmd+2) を追加し、ツールバーボタンと連動させる。
- **期待効果**: Finderと同様の操作感を提供し、メニューバーからの表示制御が可能になる。
- **検出元**: structure-review (M4, K4), visual-review (#5, #8), native-review (#3 in 1)

### 2. Helpメニューの設置

- **カテゴリ**: メニューバー設計
- **場所**: `crates/portman_desktop/src/main.rs`
- **現状**: Helpメニューが空または存在しない。
- **提案**: Helpメニューに「Portman Help」を追加し、GitHubリポジトリやドキュメントへのリンクを提供する。
- **期待効果**: Apple HIGのHelpメニュー要件を満たし、ユーザーがヘルプ情報にアクセスできる。

### 3. ウィンドウ状態の永続化

- **カテゴリ**: ウィンドウ設計
- **場所**: `crates/portman_desktop/tauri.conf.json`
- **現状**: ウィンドウのサイズ・位置が保存されず、毎回初期値(960x640)で起動する。
- **提案**: `tauri-plugin-window-state` プラグインを導入し、ウィンドウ状態を永続化する。
- **期待効果**: ユーザーが好みの位置・サイズでアプリを使い続けられる。macOSネイティブアプリの標準動作。

### 4. ドラッグ領域の拡張

- **カテゴリ**: ウィンドウ設計
- **場所**: `desktop/src/App.tsx:65-80`
- **現状**: ドラッグ領域がタイトルバー(h-10=40px)のみに限定されている。
- **提案**: サイドバー上部にもドラッグ領域を拡張するか、タイトルバーの高さを標準的な52px程度に拡大する。
- **期待効果**: ウィンドウの移動操作がより自然になる。

### 5. エラー時の詳細メッセージ表示

- **カテゴリ**: ネイティブ感
- **場所**: `desktop/src/components/StatusBar.tsx:17-21`
- **現状**: StatusBarで赤丸 + "Error" は表示されるがエラーの詳細テキストが表示されない。
- **提案**: エラーメッセージの概要をStatusBarまたはアラートで表示する。
- **期待効果**: ユーザーがエラー原因を理解し、適切に対処できる。

### 6. Loading状態のaria-live通知

- **カテゴリ**: アクセシビリティ
- **場所**: `desktop/src/App.tsx:107-109`, `desktop/src/components/FreePortFinder.tsx:94-129`
- **現状**: Loading状態("Scanning ports...")および検索結果表示領域に `aria-live` がない。
- **提案**: `aria-live="polite"` を追加して状態変化をVoiceOverに通知する。
- **期待効果**: スクリーンリーダーユーザーがアプリの状態変化を把握できる。

### 7. テーブルヘッダーのscope属性

- **カテゴリ**: アクセシビリティ
- **場所**: `desktop/src/components/ListenerTable.tsx:24-41`
- **現状**: `<th>` に `scope="col"` がなくVoiceOverがテーブル構造を正しく認識できない。
- **提案**: 各 `<th>` に `scope="col"` を追加する。
- **期待効果**: VoiceOverでのテーブルナビゲーションが正確になる。

### 8. フィルターカウント値のopacity問題

- **カテゴリ**: アクセシビリティ / カラー
- **場所**: `desktop/src/components/Sidebar.tsx:141`
- **現状**: `--text-secondary`(#52525b)に `opacity: 0.6` を掛けると実質的に薄くなりすぎる。
- **提案**: opacityを使わず直接 `--text-muted` 等の色を指定する。
- **期待効果**: コントラスト比が安定し、視認性が向上する。

---

## 参考改善（Low -- 将来対応）

- Fileメニューの必要性の再検討: ドキュメント型アプリではないためFileメニューのClose Windowは Windowメニューと重複する。カスタムメニュー移行時に整理を検討 (structure-review M6)
- サイドバーにバイブランシー（半透明）効果を追加: CSS `backdrop-filter: blur()` で近似可能だが完全再現は難しい (structure-review W3)
- 省略記号のUnicode統一: メニュー項目の "..." を Unicode U+2026 に統一 (visual-review #2)
- メニュー上でショートカットが確認できるよう、カスタムメニューでacceleratorを正しく設定 (visual-review #9)
- `tray-icon` featureが有効だが未使用: 不要なら削除、メニューバー常駐を実装するなら適切に設定 (visual-review #10, native-review #2 in 3.5)
- `<title>desktop</title>` を `<title>Portman</title>` に変更 (a11y-review #14, native-review #3 in 3.5)
- `<html lang="en">` がUIの実際の言語と一致しているか確認 (a11y-review #13)
- カードビューのポート番号(18px)はやや大きめだがグリッドカードとして許容範囲 (native-review #1 in 3.3)

---

## 良い点

- **フォント設定がネイティブ準拠**: 13px基準、SF Pro Textへのフォールバック、`-webkit-font-smoothing: antialiased` が適切に設定されている
- **Overlay titlebarの適切な実装**: `data-tauri-drag-region` でカスタムタイトルバーを実現し、トラフィックライトとの統合ができている
- **テーマ切替の即時反映**: ダークモード切替が保存/キャンセル不要のモードレス設計で、CSS変数による一貫したテーマ管理が行われている
- **初期ウィンドウサイズ(960x640)が適切**: ユーティリティアプリとして十分な幅があり、画面を圧迫しない
- **最小ウィンドウサイズ(700x400)が設定済み**: テーブルの可読性を維持できる制限値
- **セマンティックHTML**: `<aside>`, `<nav>`, `<main>`, `<footer>` が部分的に使用されている
- **システム予約ショートカットとの競合なし**: Cmd+Space, Cmd+Tab 等との衝突は検出されなかった
- **Tauriデフォルトメニューの基本ショートカット**: Cmd+Q, Cmd+W, Cmd+H, Cmd+C/V/X/Z/A が自動的に機能している
- **メニュー項目の命名規則**: Tauriデフォルトメニューは Title Case に正しく準拠

---

## 推奨メニュー構成

現状のTauriデフォルトメニューから、以下のカスタムメニュー構成への移行を推奨する。

```
Portman (App)
+-- About Portman            (AboutMetadata 設定必須)
+-- ----------
+-- Settings...          Cmd+,
+-- ----------
+-- Services            >
+-- ----------
+-- Hide Portman         Cmd+H
+-- Hide Others          Opt+Cmd+H
+-- Show All
+-- ----------
+-- Quit Portman         Cmd+Q

Edit
+-- Undo                 Cmd+Z
+-- Redo                 Shift+Cmd+Z
+-- ----------
+-- Cut                  Cmd+X
+-- Copy                 Cmd+C
+-- Paste                Cmd+V
+-- Select All           Cmd+A
+-- ----------
+-- Find...              Cmd+F

View
+-- Refresh              Cmd+R
+-- ----------
+-- as List              Cmd+1
+-- as Grid              Cmd+2
+-- ----------
+-- Appearance          >
|   +-- Light
|   +-- Dark
|   +-- Auto (System)
+-- ----------
+-- Enter Full Screen    Ctrl+Cmd+F

Window
+-- Minimize             Cmd+M
+-- Zoom
+-- ----------
+-- Bring All to Front

Help
+-- Portman Help
```

---

## 改善ロードマップ

### Phase 1: 即時対応（Critical） -- メニューバー最優先

メニューバー関連のCritical問題を最優先で解決する。

- [ ] **カスタムメニューの実装** (`main.rs`): Tauriデフォルトメニューから上記推奨構成のカスタムメニューへ移行する
- [ ] **Settings... (Cmd+,) メニュー項目の追加** と対応するSettings画面（最低限テーマ選択: Light / Dark / Auto）の実装
- [ ] **About Portman のメタデータ設定**: `product_name`, `version`, `copyright` を明示する
- [ ] **ダークモードのシステム追従**: `prefers-color-scheme` の参照と `change` イベントの監視を追加
- [ ] **フォーカスリングの復元**: 全ての `outline-none` を削除し `focus-visible` ベースのフォーカスリングを追加
- [ ] **prefers-reduced-motion 対応**: グローバルCSS にメディアクエリを追加
- [ ] **SVGアイコンのARIA属性追加**: `aria-hidden="true"` と `aria-label` を全コンポーネントに設定

### Phase 2: 短期対応（High） -- メニュー機能拡充とショートカット

メニューバーの機能性を充実させ、ツールバーとの対応を完成させる。

- [ ] **Cmd+R (Refresh) の実装**: Viewメニューに追加し、フロントエンドの `refresh()` と連携
- [ ] **Cmd+F (Find/Filter) の実装**: EditメニューのFind項目として追加し、フィルター入力にフォーカス
- [ ] **Viewメニューにテーマ切替を追加**: Appearance サブメニュー (Light / Dark / Auto)
- [ ] **Helpメニューにコンテンツ追加**: 「Portman Help」項目でGitHubリポジトリへリンク
- [ ] **Dark Modeのコントラスト修正**: `--text-label` のDarkモード値を WCAG AA 準拠に変更
- [ ] **ラベル削除時の確認ダイアログ追加**
- [ ] **Cmd+W後のウィンドウ再表示処理の確認と実装**
- [ ] **ラベル保存成功時のフィードバック追加**
- [ ] **hover限定ボタンのフォーカス時表示対応**

### Phase 3: 中期対応（Medium） -- 仕上げと品質向上

メニューバーの補助機能と全体的な品質を向上させる。

- [ ] **Viewメニューに表示切替 (Cmd+1 / Cmd+2) を追加**
- [ ] **ウィンドウ状態の永続化** (`tauri-plugin-window-state` 導入)
- [ ] **ドラッグ領域の拡張検討**
- [ ] **テーブルヘッダーの `scope="col"` 追加**
- [ ] **`aria-live` 属性の追加** (Loading状態、検索結果)
- [ ] **エラー詳細メッセージの表示改善**
- [ ] **opacity使用によるコントラスト問題の修正**

---

## 指摘件数サマリー

| 重要度 | 件数 | メニューバー関連 | その他 |
|--------|------|-----------------|--------|
| Critical | 6 | 3件 (Settings欠落, Aboutメタデータ, システムDM連動) | 3件 (フォーカスリング, Reduce Motion, ARIA) |
| High | 10 | 5件 (Cmd+R, Cmd+F, テーマのメニュー化, Help, メニュー-ツールバー対応) | 5件 (コントラスト, 削除確認, Cmd+W, フィードバック, hover限定UI) |
| Medium | 8 | 1件 (表示切替ショートカット) | 7件 (ウィンドウ関連, a11y関連, ネイティブ感) |
| Low | 8 | 1件 (Fileメニュー整理) | 7件 (視覚効果, Unicode, tray-icon, title等) |
| **合計** | **32** | **10件** | **22件** |

---

## 参考リソース

- [Apple Human Interface Guidelines - Menus](https://developer.apple.com/design/human-interface-guidelines/menus)
- [Apple Human Interface Guidelines - Keyboard](https://developer.apple.com/design/human-interface-guidelines/keyboards)
- [Apple Human Interface Guidelines - Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Apple Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Apple Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [macOS Design Resources](https://developer.apple.com/design/resources/)
- [Accessibility Programming Guide](https://developer.apple.com/accessibility/)
- [Tauri v2 Menu API](https://v2.tauri.app/reference/javascript/api/namespacemenu/)
- [WCAG 2.1 - Focus Visible (2.4.7)](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html)
- [WCAG 2.1 - Contrast Minimum (1.4.3)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
