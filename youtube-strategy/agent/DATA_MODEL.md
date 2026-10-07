# データモデル（叩き台）

## エンティティ

| エンティティ | 主な項目 |
|---|---|
| Game | id、名前、発売日、分類（一等地/安定収益/成長株/投機/イベント）、工業要素の強さ、一般視聴者への分かりやすさ |
| GameSnapshot | game_id、日付、Steam同接（平均・ピーク）、Trends指数、Reddit/Discord人口、取得元 |
| CompetitorVideo | url、チャンネル、登録者数、公開日、再生数（時点別）、尺、企画フォーマット、タイトル型、サムネ型、流入推定 |
| VideoIdea | id、game_id、フォーマット、一文企画、終了条件、想定プレイ時間、想定尺、評価スコア、判定 |
| Video | idea_id、公開日、実績プレイ時間、制作時間、タイトル・サムネの版、仮説ID |
| VideoMetricSnapshot | video_id、経過日数（1/7/30/90/180/365）、再生、インプレッション、CTR、維持率、平均視聴時間、流入元別、新規率 |
| CrossViewing | video_a、video_b、日付、A視聴者のBを見た割合 |
| Hypothesis | id、対象（戦略/動画）、内容、根拠、反証条件、結果、正誤 |

## 関係

Game 1─N GameSnapshot / VideoIdea、VideoIdea 1─1 Video、Video 1─N VideoMetricSnapshot、Video N─N Video（CrossViewing）、Hypothesis N─N Video。

## ストレージ

当面はMarkdown＋CSV（`research/`・`videos/`・`experiments/`）。データ量が増えてからSQLite等に移行。
