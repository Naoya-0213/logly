'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [nameLoading, setNameLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', user.id)
        .single()

      if (data) {
        setDisplayName(data.display_name || '')
        setEmail(data.email || '')
      }
    }
    fetchUser()
  }, [])

  // ユーザーネーム変更
  const handleNameUpdate = async () => {
    if (!displayName.trim()) {
      toast.error('ユーザーネームを入力してください')
      return
    }
    if (displayName.length > 20) {
      toast.error('20文字以内で入力してください')
      return
    }

    setNameLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (error) {
      toast.error('更新に失敗しました')
    } else {
      toast.success('ユーザーネームを更新しました！')
    }
    setNameLoading(false)
  }

  // メールアドレス変更
  const handleEmailUpdate = async () => {
    if (!newEmail.trim()) {
      toast.error('メールアドレスを入力してください')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error('正しいメールアドレスを入力してください')
      return
    }

    setEmailLoading(true)

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      toast.error('更新に失敗しました')
    } else {
      toast.success('確認メールを送信しました！')
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  // パスワード変更
  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      toast.error('パスワードを入力してください')
      return
    }
    if (newPassword.length < 8) {
      toast.error('8文字以上で入力してください')
      return
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('英字と数字を含めてください')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('パスワードが一致しません')
      return
    }

    setPasswordLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast.error('更新に失敗しました')
    } else {
      toast.success('パスワードを更新しました！')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">アカウント設定</h1>
          <p className="text-sm text-gray-400 mt-0.5">プロフィールとセキュリティ設定</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-indigo-400" />
          </div>
        </div>

        {/* ユーザーネーム変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            ユーザーネーム変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">新しいユーザーネーム</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="20文字以内"
                className="input-field"
                maxLength={20}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {displayName.length}/20
              </p>
            </div>
            <button
              onClick={handleNameUpdate}
              disabled={nameLoading}
              className="btn-primary"
            >
              {nameLoading ? '更新中...' : '更新する'}
            </button>
          </div>
        </div>

        {/* メールアドレス変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            メールアドレス変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">現在のメールアドレス</label>
              <input
                type="email"
                value={email}
                disabled
                className="input-field bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="label">新しいメールアドレス</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-field"
              />
            </div>
            <button
              onClick={handleEmailUpdate}
              disabled={emailLoading}
              className="btn-primary"
            >
              {emailLoading ? '更新中...' : '更新する'}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            パスワード変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上・英数字混在"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">パスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力してください"
                className="input-field"
              />
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={passwordLoading}
              className="btn-primary"
            >
              {passwordLoading ? '更新中...' : '更新する'}
            </button>
          </div>
        </div>

        {/* ログアウト */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            アカウント操作
          </h2>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full text-red-500 border-red-200 hover:bg-red-50"
          >
            ログアウト
          </button>
        </div>
      </div>
    </AppLayout>
  )
}