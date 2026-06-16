import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  PlayCircle,
  FileText,
  ChevronRight,
  Tag as TagIcon,
  User,
  MapPin,
  Clock,
  Calendar,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import TagBadge from '@/components/TagBadge';
import type { SearchResult, Tag, TagCategory } from '@shared/types.js';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<Record<TagCategory, Tag[]>>({
    person: [],
    location: [],
    era: [],
    event: [],
  });
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const tags = await api.getTags();
      const byCategory: Record<TagCategory, Tag[]> = {
        person: [],
        location: [],
        era: [],
        event: [],
      };
      for (const tag of tags) {
        byCategory[tag.category].push(tag);
      }
      setAllTags(byCategory);
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      doSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, page, selectedTags]);

  async function doSearch() {
    if (!query.trim() && selectedTags.length === 0) {
      setResults([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.search({
        q: query,
        page,
        pageSize: 20,
        tagIds: selectedTags.map(t => t.id),
        type: 'segment',
      });
      setResults(result.results);
      setTotal(result.total);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleTag(tag: Tag) {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.id === tag.id);
      if (exists) {
        return prev.filter(t => t.id !== tag.id);
      }
      return [...prev, tag];
    });
    setPage(1);
  }

  function clearTags() {
    setSelectedTags([]);
    setPage(1);
  }

  function formatTime(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleResultClick(result: SearchResult) {
    navigate(`/interviews/${result.interviewId}?t=${result.startTime || 0}`);
  }

  const categories: { value: TagCategory; label: string; icon: typeof User; color: string }[] = [
    { value: 'person', label: '人物', icon: User, color: 'text-rose-600' },
    { value: 'location', label: '地点', icon: MapPin, color: 'text-emerald-600' },
    { value: 'era', label: '年代', icon: Clock, color: 'text-violet-600' },
    { value: 'event', label: '事件', icon: Calendar, color: 'text-amber-600' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">
            检索中心
          </h1>
          <p className="text-warm-500">
            全文搜索访谈内容，支持按人物、地点、年代、事件筛选
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="输入关键词搜索访谈内容..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors',
              showFilters ? 'bg-primary-100 text-primary-600' : 'text-warm-400 hover:bg-warm-100'
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {selectedTags.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-warm-500">已选标签：</span>
            {selectedTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag)}
                className="group flex items-center gap-1"
              >
                <TagBadge tag={tag} size="sm" />
                <X className="w-3 h-3 text-warm-400 group-hover:text-rose-500" />
              </button>
            ))}
            <button
              onClick={clearTags}
              className="text-xs text-warm-400 hover:text-primary-600"
            >
              清空全部
            </button>
          </div>
        )}

        {showFilters && (
          <div className="bg-white rounded-xl border border-warm-200 p-4 mb-6 shadow-sm">
            <h3 className="font-medium text-primary-800 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              标签筛选
            </h3>
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat.value}>
                  <h4 className={cn('text-sm font-medium mb-2 flex items-center gap-1', cat.color)}>
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags[cat.value].map(tag => {
                      const isSelected = selectedTags.some(t => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            'px-2 py-1 text-xs rounded-full border transition-colors',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-warm-200 bg-warm-50 text-warm-600 hover:border-warm-300'
                          )}
                        >
                          {tag.name}
                          <span className="ml-1 text-warm-400">({tag.usageCount})</span>
                        </button>
                      );
                    })}
                    {allTags[cat.value].length === 0 && (
                      <span className="text-xs text-warm-400">暂无</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-primary-800">
              搜索结果
              <span className="text-sm text-warm-500 font-normal ml-2">
                共 {total} 条
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-warm-500">搜索中...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-warm-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              {query || selectedTags.length > 0 ? (
                <>
                  <p className="text-lg">没有找到匹配的结果</p>
                  <p className="text-sm mt-1">试试其他关键词或调整筛选条件</p>
                </>
              ) : (
                <p className="text-lg">输入关键词开始搜索</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-warm-100">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="p-5 hover:bg-warm-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {result.type === 'segment' ? (
                        <PlayCircle className="w-5 h-5 text-primary-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-primary-800">
                          {result.interviewTitle}
                        </h3>
                        {result.startTime !== undefined && (
                          <span className="text-xs text-warm-400 font-mono">
                            {formatTime(result.startTime)}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm text-warm-600 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: result.highlightText
                            .replace(/<mark>/g, '<mark class="bg-accent-200 text-accent-800 px-0.5 rounded">')
                            .replace(/<\/mark>/g, '</mark>'),
                        }}
                      />
                      {result.matchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {result.matchedTags.slice(0, 5).map(tag => (
                            <TagBadge key={tag.id} tag={tag} size="sm" />
                          ))}
                          {result.matchedTags.length > 5 && (
                            <span className="text-xs text-warm-400">
                              +{result.matchedTags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-warm-300 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > 20 && (
            <div className="px-6 py-4 border-t border-warm-100 flex items-center justify-between">
              <p className="text-sm text-warm-500">
                第 {page} 页，共 {total} 条结果
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-warm-200 rounded hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                  className="px-3 py-1 text-sm border border-warm-200 rounded hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
