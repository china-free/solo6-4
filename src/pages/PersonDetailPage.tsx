import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  Users,
  PlayCircle,
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { PersonDetail, Segment, Tag } from '@shared/types.js';
import TagBadge from '@/components/TagBadge.js';

interface InterviewGroup {
  interviewId: number;
  interviewTitle: string;
  interviewDate: string | null;
  segments: (Segment & { interviewTitle?: string })[];
  totalDuration: number;
}

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = parseInt(id || '0');
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInterviews, setExpandedInterviews] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (personId) {
      loadPerson();
    }
  }, [personId]);

  async function loadPerson() {
    setIsLoading(true);
    try {
      const data = await api.getPersonDetail(personId);
      setPerson(data);
      if (data?.relatedSegments.length > 0) {
        const firstInterviewId = data.relatedSegments[0].interviewId;
        setExpandedInterviews(new Set([firstInterviewId]));
      }
    } catch (e) {
      console.error('Failed to load person:', e);
    } finally {
      setIsLoading(false);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (secs === 0) {
      return `${mins}分钟`;
    }
    return `${mins}分${secs}秒`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '日期未知';
    return dateStr;
  }

  function handleSegmentClick(segment: Segment & { interviewTitle?: string }) {
    navigate(`/interviews/${segment.interviewId}?t=${segment.startTime}`);
  }

  const interviewGroups = useMemo((): InterviewGroup[] => {
    if (!person) return [];

    const groups = new Map<number, InterviewGroup>();

    for (const segment of person.relatedSegments as any) {
      const interviewId = segment.interviewId;
      if (!groups.has(interviewId)) {
        groups.set(interviewId, {
          interviewId,
          interviewTitle: segment.interviewTitle || '未知访谈',
          interviewDate: segment.interviewDate || null,
          segments: [],
          totalDuration: 0,
        });
      }
      const group = groups.get(interviewId)!;
      group.segments.push(segment);
      group.totalDuration += (segment.endTime - segment.startTime);
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.interviewDate && b.interviewDate) {
        return b.interviewDate.localeCompare(a.interviewDate);
      }
      return b.segments.length - a.segments.length;
    });
  }, [person]);

  const relatedTags = useMemo(() => {
    if (!person) return { locations: [], events: [], eras: [] };

    const tagMap = new Map<number, Tag & { count: number }>();

    for (const segment of person.relatedSegments as any) {
      if (segment.tags) {
        for (const tag of segment.tags) {
          if (tag.category !== 'person') {
            const existing = tagMap.get(tag.id);
            if (existing) {
              existing.count++;
            } else {
              tagMap.set(tag.id, { ...tag, count: 1 });
            }
          }
        }
      }
    }

    const allTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

    return {
      locations: allTags.filter(t => t.category === 'location'),
      events: allTags.filter(t => t.category === 'event'),
      eras: allTags.filter(t => t.category === 'era'),
    };
  }, [person]);

  const totalMentionDuration = useMemo(() => {
    if (!person) return 0;
    return person.relatedSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  }, [person]);

  const firstInterviewYear = useMemo(() => {
    if (!person || interviewGroups.length === 0) return null;
    const dates = interviewGroups.filter(g => g.interviewDate).map(g => g.interviewDate!.substring(0, 4));
    if (dates.length === 0) return null;
    return Math.min(...dates.map(d => parseInt(d)));
  }, [person, interviewGroups]);

  function toggleInterview(interviewId: number) {
    setExpandedInterviews(prev => {
      const next = new Set(prev);
      if (next.has(interviewId)) {
        next.delete(interviewId);
      } else {
        next.add(interviewId);
      }
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse max-w-5xl mx-auto">
          <div className="h-8 bg-warm-200 rounded w-1/3 mb-6" />
          <div className="h-40 bg-warm-200 rounded mb-6" />
          <div className="h-64 bg-warm-200 rounded mb-6" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-warm-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8 text-center">
        <User className="w-16 h-16 mx-auto text-warm-300 mb-4" />
        <h2 className="text-xl font-serif font-semibold text-primary-800 mb-2">
          人物不存在
        </h2>
        <Link
          to="/people"
          className="text-primary-600 hover:text-primary-800"
        >
          返回人物列表
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/people"
          className="inline-flex items-center gap-2 text-warm-500 hover:text-primary-600 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回人物档案
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary-700 to-primary-600 relative">
                <div className="absolute -bottom-10 left-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-md"
                    style={{ backgroundColor: '#fef3c7' }}
                  >
                    <User className="w-10 h-10 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="pt-14 pb-6 px-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-primary-900">
                      {person.name}
                    </h1>
                    {person.aliases.length > 0 && (
                      <p className="text-warm-500 mt-1 text-sm">
                        别名：{person.aliases.join('、')}
                      </p>
                    )}
                    {(person.birthYear || person.deathYear) && (
                      <p className="text-warm-500 mt-1 text-sm">
                        {person.birthYear || '?'} — {person.deathYear || '?'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-warm-50 rounded-lg">
                    <p className="text-2xl font-serif font-bold text-primary-700">
                      {interviewGroups.length}
                    </p>
                    <p className="text-xs text-warm-500 mt-1">访谈数</p>
                  </div>
                  <div className="text-center p-3 bg-warm-50 rounded-lg">
                    <p className="text-2xl font-serif font-bold text-primary-700">
                      {person.relatedSegments.length}
                    </p>
                    <p className="text-xs text-warm-500 mt-1">提及次数</p>
                  </div>
                  <div className="text-center p-3 bg-warm-50 rounded-lg">
                    <p className="text-2xl font-serif font-bold text-primary-700">
                      {formatDuration(totalMentionDuration)}
                    </p>
                    <p className="text-xs text-warm-500 mt-1">总时长</p>
                  </div>
                  <div className="text-center p-3 bg-warm-50 rounded-lg">
                    <p className="text-2xl font-serif font-bold text-primary-700">
                      {person.relatedPeople.length}
                    </p>
                    <p className="text-xs text-warm-500 mt-1">相关人物</p>
                  </div>
                </div>

                {person.description && (
                  <div className="mt-6 pt-5 border-t border-warm-100">
                    <h3 className="text-sm font-medium text-warm-600 mb-2">人物简介</h3>
                    <p className="text-warm-700 leading-relaxed text-sm">
                      {person.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(relatedTags.locations.length > 0 || relatedTags.events.length > 0 || relatedTags.eras.length > 0) && (
              <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6">
                <h2 className="text-lg font-serif font-semibold text-primary-800 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-accent-600" />
                  提及重点
                </h2>

                <div className="space-y-4">
                  {relatedTags.eras.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-warm-400" />
                        <span className="text-sm font-medium text-warm-600">涉及年代</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedTags.eras.map(tag => (
                          <TagBadge key={tag.id} tag={tag} count={tag.count} />
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedTags.locations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-warm-400" />
                        <span className="text-sm font-medium text-warm-600">涉及地点</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedTags.locations.map(tag => (
                          <TagBadge key={tag.id} tag={tag} count={tag.count} />
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedTags.events.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-warm-400" />
                        <span className="text-sm font-medium text-warm-600">涉及事件</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedTags.events.map(tag => (
                          <TagBadge key={tag.id} tag={tag} count={tag.count} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-semibold text-primary-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    访谈记录
                  </h2>
                  <p className="text-sm text-warm-500 mt-0.5">
                    共 {interviewGroups.length} 份访谈，{person.relatedSegments.length} 段提及
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (expandedInterviews.size === interviewGroups.length) {
                      setExpandedInterviews(new Set());
                    } else {
                      setExpandedInterviews(new Set(interviewGroups.map(g => g.interviewId)));
                    }
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                >
                  {expandedInterviews.size === interviewGroups.length ? '全部收起' : '全部展开'}
                </button>
              </div>

              <div className="divide-y divide-warm-100">
                {interviewGroups.map((group, groupIndex) => (
                  <div key={group.interviewId} className="group">
                    <button
                      onClick={() => toggleInterview(group.interviewId)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-warm-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-serif font-bold text-primary-600">
                          {groupIndex + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-primary-800 truncate">
                          {group.interviewTitle}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-warm-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(group.interviewDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {group.segments.length} 段提及
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(group.totalDuration)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedInterviews.has(group.interviewId) ? (
                          <ChevronUp className="w-5 h-5 text-warm-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-warm-400" />
                        )}
                      </div>
                    </button>

                    {expandedInterviews.has(group.interviewId) && (
                      <div className="bg-warm-50/50 border-t border-warm-100">
                        <div className="px-6 py-4">
                          <div className="relative pl-4 border-l-2 border-primary-200 space-y-4">
                            {group.segments.map((segment, segIndex) => (
                              <div key={segment.id} className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary-400 border-2 border-white" />
                                <div
                                  onClick={() => handleSegmentClick(segment)}
                                  className="bg-white rounded-lg border border-warm-200 p-4 hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all ml-2"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
                                        <PlayCircle className="w-3.5 h-3.5 text-primary-600" />
                                      </div>
                                      <span className="text-xs font-medium text-primary-600">
                                        第 {segIndex + 1} 段
                                      </span>
                                    </div>
                                    <span className="text-xs text-warm-500 font-mono">
                                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-warm-700 leading-relaxed line-clamp-3">
                                    {segment.text}
                                  </p>
                                  {segment.tags && segment.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-warm-100">
                                      {segment.tags.filter(t => t.category !== 'person').map(tag => (
                                        <TagBadge key={tag.id} tag={tag} size="sm" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {person.relatedPeople.length > 0 && (
              <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
                <h2 className="text-base font-serif font-semibold text-primary-800 flex items-center gap-2 mb-4">
                  <Users className="w-4.5 h-4.5" />
                  相关人物
                </h2>
                <div className="space-y-2">
                  {person.relatedPeople.map(rp => (
                    <Link
                      key={rp.id}
                      to={`/people/${rp.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-warm-50 transition-colors"
                    >
                      <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4.5 h-4.5 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-800 truncate">
                          {rp.name}
                        </p>
                        <p className="text-xs text-warm-500">
                          {rp.interviewCount} 次共同访谈
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5">
              <h2 className="text-base font-serif font-semibold text-primary-800 flex items-center gap-2 mb-4">
                <Clock className="w-4.5 h-4.5" />
                时间分布
              </h2>
              <div className="space-y-3">
                {interviewGroups.slice(0, 5).map((group, idx) => {
                  const maxDuration = Math.max(...interviewGroups.map(g => g.totalDuration));
                  const percentage = maxDuration > 0 ? (group.totalDuration / maxDuration) * 100 : 0;
                  return (
                    <div key={group.interviewId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-warm-600 truncate flex-1" title={group.interviewTitle}>
                          {group.interviewDate?.substring(0, 4) || '未知'}
                        </span>
                        <span className="text-xs text-warm-500 ml-2 whitespace-nowrap">
                          {formatDuration(group.totalDuration)}
                        </span>
                      </div>
                      <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(percentage, 5)}%`,
                            background: `linear-gradient(90deg, #1e3a5f 0%, #c9a962 100%)`,
                            animationDelay: `${idx * 100}ms`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {interviewGroups.length > 5 && (
                <p className="text-xs text-warm-400 mt-3 text-center">
                  还有 {interviewGroups.length - 5} 份访谈
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100 p-5">
              <h2 className="text-base font-serif font-semibold text-primary-800 mb-3">
                快速统计
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-warm-600">最早记录</span>
                  <span className="font-medium text-primary-700">
                    {firstInterviewYear ? `${firstInterviewYear}年` : '未知'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-warm-600">访谈总数</span>
                  <span className="font-medium text-primary-700">
                    {interviewGroups.length} 份
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-warm-600">平均每份</span>
                  <span className="font-medium text-primary-700">
                    {interviewGroups.length > 0
                      ? Math.round(person.relatedSegments.length / interviewGroups.length)
                      : 0} 段
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
