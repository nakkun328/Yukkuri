# ゲーム市場データ

取得日: 2026-10-07

## データ取得の状況

| 項目 | 状態 | 備考 |
|---|---|---|
| Steam API（同時接続） | ❌ | コンテナから接続できず空応答。直接取得は失敗 |
| SteamDB / Steam Charts | ⚠️ | 直接アクセスせず、Web検索結果の要約から二次取得 |
| YouTube（検索量・動画数・再生数） | ❌ | 未接続 |
| Google Trends | ❌ | 未接続 |
| Reddit / Discord 人口 | ❌ | 未取得 |

**このファイルの数値はすべて二次情報。意思決定に使う前に、出典の一次情報で再確認する。**

## Steam 同時接続（Web検索の要約から。要再確認）

| ゲーム | 時点 | 値 |
|---|---|---|
| Factorio | 2026-01〜06 月次 | 平均 15.5〜18.0千／ピーク 25.5〜31.3千（月ごとの詳細は `videos/002-factorio/research.md`） |
| Cities: Skylines II | 2026-06 | 平均 9,524／ピーク 16,426。過去最高 24,440（2025-11） |
| Satisfactory | 2026-10 | 現在 22,342／24hピーク 27,033。過去ピークは 104,677 と 185,957 の2説あり |
| Kerbal Space Program（1） | 2026-05-05 | ピーク 約12,000（アルテミスII 話題による特需と報じられている。10年超ぶりの高水準） |
| Arknights: Endfield | 2026-01-22 発売 | 事前登録3,500万以上。Steam同接は未取得 |
| Hearts of Iron IV | — | 未取得 |

## MODコミュニティ

- Create（Minecraft MOD）: CurseForge 約1.868億、Modrinth 約1,730万 ダウンロード（2026-04-21時点）

## 主な出典

- Factorio: SteamDB / steambase / live-player-count などの集計ページ（検索結果から）
- CS2: steambase / steampulse / pcgameshardware.de / Wikipedia
- Satisfactory: raijin.gg / gameworldobserver.com
- KSP: games.gg / mlwgames.com / Wikipedia（KSP2）
- Create: Modrinth / GDLauncher の統計ページ
- Endfield: gematsu / rpgsite / automaton-media
