"use client";

import AppLayout from "@/components/layout/AppLayout";
import { ChevronLeft, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

const versionHistory = [
  {
    version: "v1.3.0",
    date: "2026年6月",
    changes: [
      "ユーザーアバター画像の登録・変更機能を追加",
      "フレンド一覧・ランキングにアバター画像を表示",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026年6月",
    changes: [
      "フレンド追加・申請機能を追加",
      "フレンドランキング機能を追加",
      "フレンド申請のベル通知を追加",
      "モバイルヘッダーを追加",
      "BottomTabの均等配置を修正",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026年5月",
    changes: [
      "TODO機能を追加",
      "カテゴリー管理機能を追加",
      "ダッシュボードのグラフ・期間切り替えを追加",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026年4月",
    changes: [
      "Logly リリース",
      "ユーザー認証（登録・ログイン・メール認証）",
      "勉強記録のCRUD機能",
    ],
  },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/settings"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">アプリ情報</h1>
            <p className="text-sm text-gray-400 mt-0.5">Loglyについて</p>
          </div>
        </div>

        {/* アプリ概要 */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
            <img
              src="/favicon.svg"
              alt="Logly"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">Logly</p>
            <p className="text-sm text-gray-400">学習記録・可視化アプリ</p>
            <p className="text-xs text-indigo-400 mt-0.5">
              {versionHistory[0].version}
            </p>
          </div>
        </div>

        {/* 作成者・問い合わせ */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">作成者</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">作成者</span>
              <span className="text-sm font-medium text-gray-700">Naoya</span>
            </div>
            <div className="h-px bg-gray-100" />
            <a
              href="https://github.com/Naoya-0213/logly"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <span className="text-sm text-gray-500">GitHub</span>
              <span className="flex items-center gap-1 text-sm text-indigo-500 group-hover:text-indigo-600 transition-colors">
                <ExternalLink size={14} />
                Naoya-0213/logly
              </span>
            </a>
            <div className="h-px bg-gray-100" />
            <a
              href="mailto:naoya.work0213@gmail.com"
              className="flex items-center justify-between group"
            >
              <span className="text-sm text-gray-500">お問い合わせ</span>
              <span className="flex items-center gap-1 text-sm text-indigo-500 group-hover:text-indigo-600 transition-colors">
                <Mail size={14} />
                naoya.work0213@gmail.com
              </span>
            </a>
          </div>
        </div>

        {/* バージョン履歴 */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            バージョン履歴
          </h2>
          <div className="flex flex-col gap-5">
            {versionHistory.map((v, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  {i !== versionHistory.length - 1 && (
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  )}
                </div>
                <div className="pb-2 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      {v.version}
                    </span>
                    <span className="text-xs text-gray-400">{v.date}</span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {v.changes.map((c, j) => (
                      <li
                        key={j}
                        className="text-xs text-gray-500 flex items-start gap-1"
                      >
                        <span className="text-indigo-300 mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
