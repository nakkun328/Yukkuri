# データ取得の制約と解決策

調査日: 2026-10-07

## 動画が見られない理由（結論）

**このクラウド環境のネットワーク設定（egress policy）が、YouTube のドメインを許可していないため。** 動画が非公開・削除されているわけではない。

### 確認した事実

| 確認 | 結果 |
|---|---|
| 環境内のプロキシ | 正常に動作（`/__agentproxy/status` で異常なし） |
| youtu.be / www.youtube.com / m.youtube.com / youtube.com / i.ytimg.com | **ゲートウェイが CONNECT に 403**（ポリシーによる拒否） |
| 代替フロントエンド（yewtu.be, inv.nadeko.net, piped.video）、noembed.com | 同じく 403 |
| SteamDB / Steam Charts / Steamストア / Steam API | 403（以前の「Steam API が空応答」も同じ原因） |
| Google Trends / Reddit | 403 |
| WebFetch（ページ取得ツール） | 同じポリシーの下で動くため youtu.be などは EGRESS_BLOCKED |
| **www.googleapis.com（YouTube Data API v3）** | **到達できる**。キーなしで呼ぶと「API Key が必要」（403 PERMISSION_DENIED）が返る＝キーがあれば使える |
| pypi.org | 到達できる（yt-dlp などのツールは入れられる） |
| Web検索 | 使える（別経路）。ただし記事の要約しか得られず、一次情報の確認ができない |

## 解決策

| 方法 | できるようになること | できないこと | ユーザー側の作業 |
|---|---|---|---|
| A. **YouTube Data API キー**を環境に設定（推奨・最小） | 動画・チャンネルの統計（再生数・登録者数・公開日・尺・タイトル・概要欄・タグ）、検索結果の一覧、コメント。競合分析（登録者が少ないのに再生が多い動画探し）が自動化できる | 動画本編・字幕の中身は取れない（字幕のダウンロードは動画の所有者の権限が必要） | Google Cloud でキーを発行し、環境変数（例: `YOUTUBE_API_KEY`）として設定 |
| B. ネットワーク設定で **YouTube のドメインを許可** | ページの取得、yt-dlp で字幕（自動字幕を含む）の取得 → 動画の中身を要約・構造抽出できる | クラウドのIPは YouTube に「ボットでは？」と弾かれることがあり、確実ではない | 環境の Network access で許可ドメインに `youtube.com`, `www.youtube.com`, `youtu.be`, `i.ytimg.com`, `*.googlevideo.com` を追加 |
| C. Steam・Trends のドメインを許可 | 同時接続の一次データ | SteamDB は機械的なアクセスを弾くことが多い | 許可ドメインに `api.steampowered.com`, `store.steampowered.com`, `steamcharts.com` など |
| D. 手で貼る（今の方法） | すぐできる | 手間がかかり、量をこなせない | 字幕・要約・スクショを貼る |

設定手順: セッションのタイトルバーにあるクラウド環境のメニュー → Edit → Network access。詳しくは https://code.claude.com/docs/en/cloud-environments#network-access

**推奨**: まず A（APIキー）。競合分析（Phase 3）の大部分はこれで回る。動画の中身が必要なものだけ B を試すか、D で貼る。
