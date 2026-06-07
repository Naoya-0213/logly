# 📚 Logly - 学習記録・可視化アプリ

> 毎日の学習を記録して、成長を可視化しよう。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

---

## 🌟 アプリ概要

**Logly** は、日々の勉強時間を記録・管理・可視化できるWebアプリです。
科目やジャンルごとにカテゴリを自由に作成し、学習の積み重ねをグラフで確認できます。
TODOリスト機能で学習タスクも一元管理でき、継続的な学習をサポートします。

🔗 **公開URL：https://logly-track.vercel.app**

---

## 🎯 ターゲットユーザー

- 勉強時間を管理したい学生・社会人
- 学習の習慣化を目指している人
- 自分の成長を可視化して、モチベーションを上げたい人

---

## ✨ 主な機能

| 機能                      | 説明                                             |
| ------------------------- | ------------------------------------------------ |
| 👤 ユーザー登録・ログイン | メールアドレスでアカウント作成（メール認証付き） |
| 🔐 パスワードリセット     | メールアドレスからパスワードを再設定             |
| ⏱️ 勉強時間の記録         | 日付・内容・時間・カテゴリを記録                 |
| ✏️ 記録の編集・削除       | 過去の記録を修正・削除                           |
| 📋 記録一覧表示           | 過去の学習履歴を日付ごとに確認・検索・絞り込み   |
| 📊 ダッシュボード         | 期間別集計・カテゴリ別円グラフを表示             |
| 🏷️ カテゴリー管理         | 科目ごとのカテゴリを自由に作成・編集・削除       |
| ✅ TODO機能               | 学習タスクの管理・期限日・カテゴリ・完了管理     |
| ⚙️ アカウント設定         | ユーザーネーム・メール・パスワード・アバター変更 |
| 🖼️ アバター画像           | プロフィール画像の登録・変更                     |
| 📱 レスポンシブ対応       | PC・スマホどちらでも快適に使える                 |
| 🔔 トースト通知           | 操作結果をリアルタイムで通知                     |
| 📧 メール通知             | 登録・パスワードリセット・変更通知メール         |
| 👥 フレンド機能           | 友達と進捗を共有                                 |
| 🏆 ランキング機能         | 仲間と切磋琢磨                                   |

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
- Supabase Auth（メール認証・パスワードリセット）
- Supabase Storage（アバター画像）

### メール配信

- Gmail SMTP（カスタムSMTP）

### インフラ

- フロントエンド：[Vercel](https://vercel.com/)
- バックエンド：[Railway](https://railway.app/)（フェーズ2予定）

---

## 🏗️ アーキテクチャ

【ブラウザ】
↓
【Next.js（フロントエンド）】
↓ Supabase Client
【Supabase（PostgreSQL + Auth + Storage）】
↓ Gmail SMTP
【メール配信】

> フェーズ2でSpring Boot APIを追加予定

---

## 🗄️ データベース設計

### users（ユーザー）

| カラム       | 型        | 説明                              |
| ------------ | --------- | --------------------------------- |
| id           | UUID      | 主キー（Supabase Authが自動生成） |
| email        | TEXT      | メールアドレス                    |
| display_name | TEXT      | 表示名                            |
| avatar_url   | TEXT      | アバター画像URL                   |
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

### friendships（フレンド関係）

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
└── frontend/ → Next.jsプロジェクト
└── src/
├── app/
│ ├── (auth)/
│ │ ├── login/ → ログインページ
│ │ ├── register/ → 新規登録ページ
│ │ ├── reset-password/ → パスワードリセット
│ │ └── update-password/→ パスワード更新
│ ├── about/ → アプリ情報・バージョン履歴
│ ├── dashboard/ → ダッシュボード
│ ├── friends/ → フレンド・ランキング
│ ├── records/
│ │ ├── page.tsx → 履歴一覧
│ │ ├── new/ → 記録追加
│ │ └── [id]/edit/ → 記録編集
│ ├── todos/ → TODO管理
│ ├── categories/ → カテゴリー管理
│ └── settings/ → アカウント設定
├── components/
│ ├── layout/
│ │ ├── Sidebar.tsx → サイドバー（PC）
│ │ ├── BottomTab.tsx → タブバー（スマホ）
│ │ ├── NotificationBell.tsx → 通知ベル
│ │ └── AppLayout.tsx → 共通レイアウト
│ └── ui/
│ └── UserAvatar.tsx → アバター共通コンポーネント
├── hooks/
│ └── useAvatar.ts → アバターアップロードフック
├── lib/
│ └── supabase.ts → Supabaseクライアント
└── types/
└── index.ts → 型定義

```

---

## 🚀 開発ロードマップ

### フェーズ1（完了）✅

- [x] 全体設計・DB設計
- [x] Supabaseセットアップ・テーブル作成
- [x] Next.jsプロジェクト作成
- [x] 認証機能（登録・ログイン・メール認証）
- [x] パスワードリセット機能
- [x] 勉強記録のCRUD
- [x] カテゴリー管理
- [x] ダッシュボード（期間切り替え・円グラフ）
- [x] TODO機能（期限日・カテゴリー・完了管理）
- [x] アカウント設定
- [x] メール通知（Gmail SMTP）
- [x] レスポンシブ対応（PC・スマホ）
- [x] トースト通知
- [x] ファビコン・Apple Touch Icon
- [x] Vercelデプロイ
- [x] フレンド機能
- [x] ランキング機能
- [x] ユーザーアバター画像登録

### フェーズ2（予定）

- [ ] Spring Boot API実装
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
# .env.localを作成して以下を入力
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Publishable key

# 開発サーバーを起動
npm run dev
```

---

## 📝 更新履歴

### v1.5.0（2026年6月）

**カテゴリー検索機能追加**

- 履歴一覧にカテゴリー別・キーワード別の合計時間表示を追加
- カテゴリーなしのドット色をグレーに統一
- ダッシュボードのホバー表示を改善（日付非表示・モバイル無効化）

### v1.4.0（2026年6月）

**ダッシュボード表示内容追加**

- ダッシュボードに週別学習時間グラフを追加
- 月単位でのナビゲーション（過去月への遡りも可能）
- 週をクリックしてカテゴリー別円グラフ・記録一覧に連動表示
- カテゴリーなしの記録を円グラフに「その他」として表示
- 円グラフの開始位置を12時スタートに修正
- 設定画面にカテゴリー管理へのリンクを追加
- 記録追加画面に「カテゴリーを追加」リンクを追加

### v1.3.0（2026年6月）

**アバター機能追加**

- ユーザーアバター画像の登録・変更機能を追加
- フレンド一覧・ランキングにアバター画像を表示

### v1.2.0（2026年6月）

**フレンド機能追加・改善**

- フレンド追加・申請機能を追加
- フレンドランキング機能を追加
- フレンド申請のベル通知を追加
- モバイルヘッダーを追加
- BottomTabの均等配置を修正

### v1.1.0（2026年6月）

**機能追加**

- TODO機能を追加
- カテゴリー管理機能を追加
- ダッシュボードのグラフ・期間切り替えを追加

### v1.0.0（2026年6月）

**フェーズ1 リリース 🎉**

- 初回リリース
- ユーザー登録・ログイン（メール認証付き）
- 勉強記録のCRUD（追加・編集・削除）
- 履歴一覧（検索・絞り込み・累計時間表示）
- カテゴリー管理（追加・編集・削除・カラー設定）
- ダッシュボード（期間切り替え・カテゴリー別円グラフ）
- TODO機能（期限日・カテゴリー・完了管理・フィルター）
- アカウント設定（ユーザーネーム・メール・パスワード変更）
- パスワードリセット機能
- メール通知（Gmail SMTP）
- トースト通知（react-hot-toast）
- レスポンシブ対応（PC：サイドバー / スマホ：タブバー）
- ファビコン・Apple Touch Icon設定
- Vercelデプロイ

### v0.5.0（2026年6月）

**機能追加・改善**

- TODO機能を追加
- ダッシュボードに期間切り替え機能を追加（今月・先月・過去3ヶ月・全期間）
- カテゴリー別グラフを棒グラフから円グラフ（ドーナツグラフ）に変更
- 削除確認をブラウザダイアログからトーストに変更
- 新規登録後の案内画面を改善（手順・注意事項を追加）
- iOSでの日付入力フィールドのはみ出しを修正

### v0.4.0（2026年5月）

**認証・メール機能**

- Supabase メール認証を実装
- Gmail SMTPによるカスタムメール配信を設定
- パスワードリセット機能を実装
- メールテンプレートを日本語化（登録確認・パスワードリセット・メール変更・パスワード変更通知）
- ログイン時のトースト通知を初回と通常で分岐

### v0.3.0（2026年5月）

**主要機能の実装**

- 勉強記録の追加・編集・削除を実装
- 履歴一覧画面を実装（累計時間・検索・絞り込み）
- カテゴリー管理画面を実装
- アカウント設定画面を実装
- 記録追加・編集時のトースト通知を追加
- react-hot-toastを導入

### v0.2.0（2026年4月）

**基盤構築**

- Next.jsプロジェクト作成
- Supabaseセットアップ・テーブル作成（users・categories・study_records・todos・friendships）
- RLS（Row Level Security）設定
- ログイン・新規登録画面を実装
- ダッシュボード画面を実装
- レイアウトコンポーネント作成（サイドバー・タブバー・レスポンシブ対応）
- ミドルウェア設定（認証ガード）
- Vercelデプロイ設定

### v0.1.0（2026年4月）

**設計フェーズ**

- 全体アーキテクチャ設計
- データベース設計（テーブル・リレーション）
- APIエンドポイント設計
- UIモックアップ作成（PC・スマホ）
- GitHubリポジトリ作成
- README.md作成

---

## 👨‍💻 開発者

- [Naoya-0213](https://github.com/Naoya-0213)

---

## 📄 ライセンス

MIT License
