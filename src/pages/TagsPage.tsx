import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Merge,
  User,
  MapPin,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import TagBadge from '@/components/TagBadge';
import type { Tag, TagCategory } from '@shared/types.js';

const categories: { value: TagCategory; label: string; icon: typeof User; color: string }[] = [
  { value: 'person', label: '人物', icon: User, color: 'text-rose-600' },
  { value: 'location', label: '地点', icon: MapPin, color: 'text-emerald-600' },
  { value: 'era', label: '年代', icon: Clock, color: 'text-violet-600' },
  { value: 'event', label: '事件', icon: Calendar, color: 'text-amber-600' },
];

export default function TagsPage() {
  const { tags, allTags, fetchAllTags } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<TagCategory>('person');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '' });
  const [mergeFrom, setMergeFrom] = useState<Tag | null>(null);
  const [mergeTo, setMergeTo] = useState<Tag | null>(null);

  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  const currentTags = tags[activeCategory] || [];

  const filteredTags = searchQuery
    ? currentTags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentTags;

  async function handleCreateTag() {
    if (!newTag.name.trim()) return;

    try {
      await api.createTag({
        name: newTag.name.trim(),
        category: activeCategory,
        color: newTag.color || undefined,
      });
      await fetchAllTags();
      setShowNewModal(false);
      setNewTag({ name: '', color: '' });
    } catch (e) {
      alert('创建失败：' + (e as Error).message);
    }
  }

  async function handleUpdateTag() {
    if (!editingTag || !editingTag.name.trim()) return;

    try {
      await api.updateTag(editingTag.id, {
        name: editingTag.name,
        color: editingTag.color,
      });
      await fetchAllTags();
      setEditingTag(null);
    } catch (e) {
      alert('更新失败：' + (e as Error).message);
    }
  }

  async function handleDeleteTag(tag: Tag) {
    if (!confirm(`确定要删除标签「${tag.name}」吗？`)) return;

    try {
      await api.deleteTag(tag.id);
      await fetchAllTags();
    } catch (e) {
      alert('删除失败：' + (e as Error).message);
    }
  }

  async function handleMergeTags() {
    if (!mergeFrom || !mergeTo) return;

    try {
      await api.mergeTags(mergeFrom.id, mergeTo.id);
      await fetchAllTags();
      setShowMergeModal(false);
      setMergeFrom(null);
      setMergeTo(null);
    } catch (e) {
      alert('合并失败：' + (e as Error).message);
    }
  }

  const categoryInfo = categories.find(c => c.value === activeCategory);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-900">标签管理</h1>
          <p className="text-warm-500 mt-1">
            共 {allTags.length} 个标签 · {currentTags.length} 个{categoryInfo?.label}标签
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMergeModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-warm-200 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
          >
            <Merge className="w-4 h-4" />
            合并标签
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新建标签
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-warm-200">
        <div className="flex border-b border-warm-100">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors',
                activeCategory === cat.value
                  ? 'bg-warm-50 text-primary-800 border-b-2 border-primary-500'
                  : 'text-warm-500 hover:bg-warm-50'
              )}
            >
              <cat.icon className={cn('w-5 h-5', cat.color)} />
              <span className="font-medium">{cat.label}</span>
              <span className="text-xs bg-warm-200 text-warm-600 px-2 py-0.5 rounded-full">
                {tags[cat.value]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-warm-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              placeholder={`搜索${categoryInfo?.label}标签...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="divide-y divide-warm-100">
          {filteredTags.length === 0 ? (
            <div className="p-12 text-center text-warm-400">
              {categoryInfo?.icon && (
                <categoryInfo.icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              )}
              <p className="text-lg">暂无{categoryInfo?.label}标签</p>
              <p className="text-sm mt-1">点击「新建标签」开始添加</p>
            </div>
          ) : (
            filteredTags.map(tag => (
              <div
                key={tag.id}
                className="p-4 flex items-center justify-between hover:bg-warm-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <h3 className="font-medium text-primary-800">{tag.name}</h3>
                    <p className="text-xs text-warm-500 mt-0.5">
                      使用 {tag.usageCount} 次
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TagBadge tag={tag} size="sm" />
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="p-2 text-warm-400 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="p-2 text-warm-400 hover:text-rose-600 hover:bg-warm-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                新建{categoryInfo?.label}标签
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  标签名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag(t => ({ ...t, name: e.target.value }))}
                  placeholder="输入标签名称"
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  标签颜色
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTag.color || '#888888'}
                    onChange={(e) => setNewTag(t => ({ ...t, color: e.target.value }))}
                    className="w-10 h-10 rounded border border-warm-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newTag.color}
                    onChange={(e) => setNewTag(t => ({ ...t, color: e.target.value }))}
                    placeholder="#888888"
                    className="flex-1 px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowNewModal(false); setNewTag({ name: '', color: '' }); }}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTag}
                disabled={!newTag.name.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                编辑标签
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  标签颜色
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-10 h-10 rounded border border-warm-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                合并标签
              </h2>
              <p className="text-sm text-warm-500 mt-1">
                将源标签合并到目标标签，源标签将被删除
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  源标签（将被合并）
                </label>
                <select
                  value={mergeFrom?.id || ''}
                  onChange={(e) => {
                    const tag = currentTags.find(t => t.id === parseInt(e.target.value));
                    setMergeFrom(tag || null);
                  }}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择源标签</option>
                  {currentTags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}（{tag.usageCount}次）
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center text-warm-400">
                ↓
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  目标标签
                </label>
                <select
                  value={mergeTo?.id || ''}
                  onChange={(e) => {
                    const tag = currentTags.find(t => t.id === parseInt(e.target.value));
                    setMergeTo(tag || null);
                  }}
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择目标标签</option>
                  {currentTags
                    .filter(t => t.id !== mergeFrom?.id)
                    .map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}（{tag.usageCount}次）
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setMergeFrom(null);
                  setMergeTo(null);
                }}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMergeTags}
                disabled={!mergeFrom || !mergeTo}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                合并
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
