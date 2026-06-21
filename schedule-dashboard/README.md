# schedule-dashboard

カード型ダッシュボード + スケジュール帳。React + Vite（フロント完結・サーバー不要）で、
Google カレンダーと連携します。

## 機能

### ダッシュボード
- 🕐 **時計 / 日付** … リアルタイム表示
- ⏳ **カウントダウン** … 「次の予定まで」（カレンダー連動）＋ 任意イベントまでの日数
- 📅 **今日の予定** … Google カレンダーから取得。Meet / Zoom の参加ボタン付き
- ✅ **TODO** … ブラウザ内（localStorage）に保存
- 📝 **メモ** … 自動保存のクイックノート

### スケジュール帳
- 月カレンダー表示（前月 / 翌月の切り替え）
- 日付クリックでその日の予定を表示
- 予定の **追加 / 削除**（Google カレンダーに反映）
- 追加時に **Google Meet リンクを自動発行** するオプション
- 予定内の **Zoom URL を自動検出** して参加ボタンを表示

## Web 会議連携の方針
- **Google Meet**: カレンダーのネイティブ機能。参加・新規発行の両方に対応。
- **Zoom**: カレンダー予定に貼られた Zoom URL を検出して「参加」ボタン化（参加のみ）。
  Zoom 会議の新規作成には Zoom API + バックエンドが必要なため対象外。

## セットアップ

### 1. 依存をインストール
```bash
npm install
```

### 2. Google Cloud の設定（初回のみ）
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス」→ **Google Calendar API** を有効化
3. 「OAuth 同意画面」を設定（テストユーザーに自分のアカウントを追加）
4. 「認証情報」→ **OAuth クライアントID（種類: ウェブアプリケーション）** を作成
   - **承認済みの JavaScript 生成元** に `http://localhost:5173` を追加
   - 公開する場合は本番 URL も追加
5. 発行された **クライアントID** を控える

### 3. 環境変数
`.env.example` をコピーして `.env.local` を作成し、クライアントIDを設定：
```bash
cp .env.example .env.local
```
```
VITE_GOOGLE_CLIENT_ID=発行されたクライアントID.apps.googleusercontent.com
```

### 4. 起動
```bash
npm run dev
```
ブラウザで http://localhost:5173 を開き、「Googleでログイン」でカレンダーと連携します。

## 技術スタック
- React 18 + TypeScript + Vite
- react-router-dom（ダッシュボード / スケジュール帳のルーティング）
- Google Identity Services（ブラウザ内 OAuth）+ Google Calendar API v3
- データ保存: Google カレンダー（予定）/ localStorage（TODO・メモ・カウントダウン設定）

## ビルド
```bash
npm run build      # 型チェック + 本番ビルド（dist/）
npm run preview    # ビルド結果のプレビュー
```

## スコープ
`calendar.events`（カレンダーの読み取り・作成・削除）。
