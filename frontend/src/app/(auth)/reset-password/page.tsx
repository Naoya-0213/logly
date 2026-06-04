'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      toast.error('メールの送信に失敗しました')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          <div className="card text-center">
            <div className="text-5xl mb-3">📧</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              メールを送信しました！
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              パスワードリセット用のリンクを送りました。<br />
              メールをご確認ください。
            </p>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-6">
              <p className="text-yellow-700 text-xs">
                ⚠️ リンクの有効期限は24時間です
              </p>
            </div>
            <Link href="/login" className="btn-primary inline-block text-center">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">Logly</h1>
          <p className="text-gray-500 text-sm mt-2">学習記録をシンプルに</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            パスワードをお忘れですか？
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            登録したメールアドレスを入力してください。<br />
            パスワードリセット用のリンクをお送りします。
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="label">メールアドレス</label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@email.com"
                className="input-field"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-indigo-500 font-medium">
            ← ログインページへ戻る
          </Link>
        </p>
      </div>
    </div>
  )
}