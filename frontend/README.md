# 📚 Logly - 学習記録・可視化アプリ

> 毎日の学習を記録して、成長を可視化しよう。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8)

---

## 🌟 アプリ概要

**Logly** は、日々の勉強時間を記録・管理・可視化できるWebアプリです。
科目やジャンルごとにカテゴリを自由に作成し、学習の積み重ねをグラフで確認できます。
TODOリスト機能で学習タスクも一元管理でき、継続的な学習をサポートします。

---

## 🎯 ターゲットユーザー

- 勉強時間を管理したい学生・社会人
- 学習の習慣化を目指している人
- 自分の成長を可視化して、モチベーションを上げたい人

---

## ✨ 主な機能

| 機能                      | 説明                                   |
| ------------------------- | -------------------------------------- |
| 👤 ユーザー登録・ログイン | メールアドレスでアカウント作成         |
| ⏱️ 勉強時間の記録         | 日付・内容・時間・カテゴリを記録       |
| ✏️ 記録の編集・削除       | 過去の記録を修正・削除                 |
| 📋 記録一覧表示           | 過去の学習履歴を日付ごとに確認         |
| 📊 ダッシュボード         | 今月の合計・カテゴリ別グラフを表示     |
| 🏷️ カテゴリー管理         | 科目ごとのカテゴリを自由に作成・編集   |
| ✅ TODO機能               | 学習タスクの管理・期限日・完了管理     |
| ⚙️ アカウント設定         | ユーザーネーム・メール・パスワード変更 |
| 📱 レスポンシブ対応       | PC・スマホどちらでも快適に使える       |
| 🔔 トースト通知           | 操作結果をリアルタイムで通知           |
| 👥 フレンド機能（予定）   | 友達と進捗を共有                       |
| 🏆 ランキング機能（予定） | 仲間と切磋琢磨                         |

---

## 🛠️ 技術スタック

### フロントエンド

- [Next.js 16](https://nextjs.org/) (React / TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/)（バリデーション）
- [Recharts](https://recharts.org/)（グラフ）
- [Lucide React](https://lucide.dev/)（アイコン）
- [react-hot-toast](https://react-hot-toast.com/)（トースト通知）

### バックエンド（フェーズ2予定）

- [Spring Boot](https://spring.io/projects/spring-boot) (Java 21)
- REST API

### データベース・認証

- [Supabase](https://supabase.com/) (PostgreSQL)
- Supabase Auth（認証）

### インフラ

- フロントエンド：[Vercel](https://vercel.com/)
- バックエンド：[Railway](https://railway.app/)（フェーズ2予定）

---

## 🏗️ アーキテクチャ

```
【ブラウザ】
    ↓
【Next.js（フロントエンド）】
    ↓ Supabase Client
【Supabase（PostgreSQL + Auth）】
```

> フェーズ2でSpring Boot APIを追加予定

---

## 🗄️ データベース設計

### users（ユーザー）

| カラム       | 型        | 説明                              |
| ------------ | --------- | --------------------------------- |
| id           | UUID      | 主キー（Supabase Authが自動生成） |
| email        | TEXT      | メールアドレス                    |
| display_name | TEXT      | 表示名                            |
| created_at   | TIMESTAMP | 登録日時                          |

### categories（カテゴリー）

| カラム     | 型        | 説明                           |
| ---------- | --------- | ------------------------------ |
| id         | BIGINT    | 主キー                         |
| user_id    | UUID      | ユーザーID（外部キー）         |
| name       | TEXT      | カテゴリー名（例：数学、英語） |
| color      | TEXT      | 表示色（例：#6366F1）          |
| created_at | TIMESTAMP | 作成日時                       |

### study_records（勉強記録）

| カラム           | 型        | 説明                     |
| ---------------- | --------- | ------------------------ |
| id               | BIGINT    | 主キー                   |
| user_id          | UUID      | ユーザーID（外部キー）   |
| category_id      | BIGINT    | カテゴリーID（外部キー） |
| study_date       | DATE      | 勉強した日付             |
| duration_minutes | INTEGER   | 勉強時間（分）           |
| content          | TEXT      | 勉強内容のメモ           |
| created_at       | TIMESTAMP | 作成日時                 |

### todos（TODO）

| カラム       | 型        | 説明                     |
| ------------ | --------- | ------------------------ |
| id           | BIGINT    | 主キー                   |
| user_id      | UUID      | ユーザーID（外部キー）   |
| category_id  | BIGINT    | カテゴリーID（外部キー） |
| title        | TEXT      | タイトル                 |
| description  | TEXT      | 詳細                     |
| due_date     | DATE      | 期限日                   |
| is_completed | BOOLEAN   | 完了フラグ               |
| created_at   | TIMESTAMP | 作成日時                 |

### friendships（フレンド関係 ※将来実装）

| カラム       | 型        | 説明               |
| ------------ | --------- | ------------------ |
| id           | BIGINT    | 主キー             |
| requester_id | UUID      | 申請したユーザー   |
| receiver_id  | UUID      | 申請されたユーザー |
| status       | TEXT      | pending / accepted |
| created_at   | TIMESTAMP | 申請日時           |

---

## 📁 フォルダ構成

```
logly/
└── frontend/                    # Next.jsプロジェクト
    └── src/
        ├── app/
        │   ├── (auth)/
        │   │   ├── login/       # ログインページ
        │   │   └── register/    # 新規登録ページ
        │   ├── dashboard/       # ダッシュボード
        │   ├── records/
        │   │   ├── page.tsx     # 履歴一覧
        │   │   ├── new/         # 記録追加
        │   │   └── [id]/edit/   # 記録編集
        │   ├── todos/           # TODO管理
        │   ├── categories/      # カテゴリー管理
        │   └── settings/        # アカウント設定
        ├── components/
        │   └── layout/
        │       ├── Sidebar.tsx  # サイドバー（PC）
        │       ├── BottomTab.tsx # タブバー（スマホ）
        │       └── AppLayout.tsx # 共通レイアウト
        ├── lib/
        │   └── supabase.ts      # Supabaseクライアント
        └── types/
            └── index.ts         # 型定義
```

---

## 🚀 開発ロードマップ

### フェーズ1（完了）

- [x] 全体設計・DB設計
- [x] Supabaseセットアップ・テーブル作成
- [x] Next.jsプロジェクト作成
- [x] 認証機能（登録・ログイン）
- [x] 勉強記録のCRUD
- [x] カテゴリー管理
- [x] ダッシュボード・グラフ表示
- [x] TODO機能
- [x] アカウント設定
- [x] レスポンシブ対応
- [x] デプロイ（Vercel）

### フェーズ2（予定）

- [ ] Spring Boot API実装
- [ ] フレンド機能
- [ ] ランキング機能
- [ ] プッシュ通知

---

## 🔧 環境構築

### 必要な環境

- Node.js 18以上
- npm 9以上

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/Naoya-0213/logly.git
cd logly/frontend

# ライブラリをインストール
npm install

# 環境変数を設定
# .env.localを作成してSupabaseのURLとキーを入力
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Publishable key

# 開発サーバーを起動
npm run dev
```

---

## 👨‍💻 開発者

- [Naoya-0213](https://github.com/Naoya-0213)

---

## 📄 ライセンス

MIT License
