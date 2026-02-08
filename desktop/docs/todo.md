# TODO

## Backlog

### `cargo tauri build --bundles dmg` のDMGバンドラーエラー調査

- **状態**: 未着手
- **発見日**: 2026-02-08
- **症状**: `cargo tauri build --bundles dmg` で `bundle_dmg.sh` の実行に失敗する（`failed to run bundle_dmg.sh`）
- **詳細**: `--bundles app` は成功し、ad-hoc署名も正しく適用されるが、DMGバンドルのフェーズで `bundle_dmg.sh` がエラーになる。スクリプト単体で実行すると「Not enough arguments」と表示されるため、Tauriからの引数渡しに問題がある可能性
- **現在の回避策**: `cargo tauri build --bundles app` でappバンドルを作成後、`hdiutil create` で手動DMG作成
- **影響**: リリースビルド時にDMG作成が1手間増える。GitHub Actions（release.yml）にも影響する可能性あり
