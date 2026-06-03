'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Todo, Category } from '@/types'
import { Plus, Pencil, Trash2, Check, X, Calendar, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function TodosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  // 新規追加フォーム
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [adding, setAdding] = useState(false)

  // 編集
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: todosData } = await supabase
        .from('todos')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      setTodos(todosData || [])
      setCategories(categoriesData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  // TODO追加
  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error('タイトルを入力してください')
      return
    }
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        due_date: newDueDate || null,
        category_id: newCategoryId ? Number(newCategoryId) : null,
        is_completed: false,
      })
      .select('*, categories(*)')
      .single()

    if (!error && data) {
      setTodos([data, ...todos])
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setNewCategoryId('')
      setShowAddForm(false)
      toast.success('TODOを追加しました！')
    } else {
      toast.error('追加に失敗しました')
    }
    setAdding(false)
  }

  // 完了・未完了の切り替え
  const handleToggle = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !todo.is_completed })
      .eq('id', todo.id)

    if (!error) {
      setTodos(todos.map(t =>
        t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t
      ))
      toast.success(todo.is_completed ? '未完了に戻しました' : '完了しました！🎉')
    }
  }

  // 編集開始
  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
    setEditDueDate(todo.due_date || '')
    setEditCategoryId(todo.category_id?.toString() || '')
  }

  // 編集保存
  const handleEdit = async (id: number) => {
    if (!editTitle.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    const { error } = await supabase
      .from('todos')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        due_date: editDueDate || null,
        category_id: editCategoryId ? Number(editCategoryId) : null,
      })
      .eq('id', id)

    if (!error) {
      setTodos(todos.map(t =>
        t.id === id ? {
          ...t,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          due_date: editDueDate || null,
          category_id: editCategoryId ? Number(editCategoryId) : null,
        } : t
      ))
      setEditingId(null)
      toast.success('TODOを更新しました！')
    } else {
      toast.error('更新に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">このTODOを削除しますか？</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id)
              if (!error) {
                setTodos(prev => prev.filter(t => t.id !== id))
                toast.success('TODOを削除しました')
              } else {
                toast.error('削除に失敗しました')
              }
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg transition-colors"
          >
            削除する
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1.5 px-3 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      style: {
        background: '#fff',
        color: '#374151',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '12px 16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      },
    })
  }

  // フィルター
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  // 期限チェック
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toISOString().split('T')[0])
  }

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">TODO</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {todos.filter(t => !t.is_completed).length}件の未完了タスク
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            追加
          </button>
        </div>

        {/* 新規追加フォーム */}
        {showAddForm && (
          <div className="card border-2 border-indigo-100 mb-4">
            <p className="text-sm font-medium text-indigo-500 mb-3">新しいTODOを追加</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="タイトル（必須）"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-field"
                autoFocus
              />
              <input
                type="text"
                placeholder="詳細（任意）"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">期限日（任意）</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">カテゴリー（任意）</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">なし</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="btn-primary flex-1"
                >
                  {adding ? '追加中...' : '追加する'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTitle('')
                    setNewDescription('')
                    setNewDueDate('')
                    setNewCategoryId('')
                  }}
                  className="btn-secondary flex-1"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* フィルタータブ */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium',
                filter === f
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {f === 'all' ? 'すべて' : f === 'active' ? '未完了' : '完了済み'}
            </button>
          ))}
        </div>

        {/* TODO一覧 */}
        {filteredTodos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">
              {filter === 'completed' ? '完了済みのTODOはありません' :
               filter === 'active' ? '未完了のTODOはありません🎉' :
               'TODOがまだありません'}
            </p>
            {filter !== 'completed' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl"
              >
                <Plus size={16} />
                TODOを追加
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={clsx(
                  'card transition-opacity',
                  todo.is_completed && 'opacity-60'
                )}
              >
                {editingId === todo.id ? (
                  // 編集モード
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input-field"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="詳細（任意）"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="input-field"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="label">期限日</label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="label">カテゴリー</label>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="input-field"
                        >
                          <option value="">なし</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(todo.id)}
                        className="flex items-center gap-1 bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg"
                      >
                        <Check size={14} />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-lg"
                      >
                        <X size={14} />
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 通常モード
                  <div className="flex items-start gap-3">
                    {/* 完了チェックボックス */}
                    <button
                      onClick={() => handleToggle(todo)}
                      className={clsx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                        todo.is_completed
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-gray-300 hover:border-indigo-400'
                      )}
                    >
                      {todo.is_completed && <Check size={12} className="text-white" />}
                    </button>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-sm font-medium text-gray-700',
                        todo.is_completed && 'line-through text-gray-400'
                      )}>
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {todo.due_date && (
                          <span className={clsx(
                            'flex items-center gap-1 text-xs',
                            isOverdue(todo.due_date) && !todo.is_completed
                              ? 'text-red-500'
                              : 'text-gray-400'
                          )}>
                            <Calendar size={10} />
                            {formatDueDate(todo.due_date)}
                            {isOverdue(todo.due_date) && !todo.is_completed && ' (期限切れ)'}
                          </span>
                        )}
                        {todo.categories && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Tag size={10} />
                            {todo.categories.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(todo)}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}