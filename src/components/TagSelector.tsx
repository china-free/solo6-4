import { useState, useEffect, useRef } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import TagBadge from './TagBadge';
import type { Tag, TagCategory } from '@shared/types.js';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tagIds: number[]) => void;
  category?: TagCategory;
  className?: string;
}

const categories: { value: TagCategory; label: string; color: string }[] = [
  { value: 'person', label: '人物', color: 'text-rose-600' },
  { value: 'location', label: '地点', color: 'text-emerald-600' },
  { value: 'era', label: '年代', color: 'text-violet-600' },
  { value: 'event', label: '事件', color: 'text-amber-600' },
];

export default function TagSelector({ selectedTags, onTagsChange, className = '' }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TagCategory | 'all'>('all');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { allTags, fetchAllTags } = useAppStore();

  useEffect(() => {
    if (allTags.length === 0) {
      fetchAllTags();
    }
  }, [allTags.length, fetchAllTags]);

  useEffect(() => {
    if (searchQuery.trim()) {
      api.searchTags(searchQuery, activeCategory === 'all' ? undefined : activeCategory).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeCategory]);

  const filteredTags = activeCategory === 'all'
    ? allTags
    : allTags.filter(t => t.category === activeCategory);

  const displayTags = searchQuery.trim() ? searchResults : filteredTags;

  function toggleTag(tag: Tag) {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      const newTagIds = selectedTags.filter(t => t.id !== tag.id).map(t => t.id);
      onTagsChange(newTagIds);
    } else {
      const newTagIds = [...selectedTags.map(t => t.id), tag.id];
      onTagsChange(newTagIds);
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim() || activeCategory === 'all') return;

    try {
      const newTag = await api.createTag({
        name: newTagName.trim(),
        category: activeCategory as TagCategory,
      });
      useAppStore.getState().fetchAllTags();
      const newTagIds = [...selectedTags.map(t => t.id), newTag.id];
      onTagsChange(newTagIds);
      setNewTagName('');
      setSearchQuery('');
    } catch (e) {
      console.error('Failed to create tag:', e);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className="min-h-[38px] p-1.5 border border-warm-200 rounded-lg cursor-text flex flex-wrap gap-1.5 bg-white"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedTags.length === 0 ? (
          <span className="text-warm-400 text-sm px-2 py-0.5">点击添加标签...</span>
        ) : (
          selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size="sm"
              className="group"
            />
          ))
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warm-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-2 border-b border-warm-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索标签..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-warm-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex border-b border-warm-100">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                  activeCategory === 'all'
                    ? 'bg-warm-50 text-primary-600 border-b-2 border-primary-500'
                    : 'text-warm-500 hover:bg-warm-50'
                )}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                    activeCategory === cat.value
                      ? 'bg-warm-50 border-b-2 border-primary-500'
                      : 'text-warm-500 hover:bg-warm-50'
                  )}
                >
                  <span className={cat.color}>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {displayTags.length === 0 && !searchQuery ? (
                <div className="p-4 text-center text-sm text-warm-400">
                  暂无标签
                </div>
              ) : (
                displayTags.map(tag => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-warm-50 transition-colors',
                        isSelected && 'bg-primary-50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                        <span className="text-xs text-warm-400">
                          {categories.find(c => c.value === tag.category)?.label}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="text-primary-600">✓</span>
                      )}
                    </button>
                  );
                })
              )}

              {searchQuery && activeCategory !== 'all' && !searchResults.some(
                t => t.name.toLowerCase() === searchQuery.toLowerCase()
              ) && (
                <div className="p-2 border-t border-warm-100">
                  <button
                    onClick={handleCreateTag}
                    className="w-full px-3 py-2 text-sm text-primary-600 hover:bg-warm-50 rounded flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    创建「{searchQuery}」标签
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
