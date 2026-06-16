import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  Users,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { PersonDetail, Segment } from '@shared/types.js';

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = parseInt(id || '0');
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  function handleSegmentClick(segment: Segment & { interviewTitle?: string }) {
    navigate(`/interviews/${segment.interviewId}?t=${segment.startTime}`);
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-warm-200 rounded w-1/3 mb-6" />
          <div className="h-32 bg-warm-200 rounded mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-warm-200 rounded" />
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

  const interviewCount = new Set(person.relatedSegments.map(s => s.interviewId)).size;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/people"
          className="inline-flex items-center gap-2 text-warm-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回人物列表
        </Link>

        <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#fef3c7' }}
            >
              <User className="w-10 h-10 text-amber-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold text-primary-900">
                {person.name}
              </h1>
              {person.aliases.length > 0 && (
                <p className="text-warm-500 mt-1">
                  别名：{person.aliases.join('、')}
                </p>
              )}
              {(person.birthYear || person.deathYear) && (
                <p className="text-warm-500 mt-1">
                  {person.birthYear || '?'} — {person.deathYear || '?'}
                </p>
              )}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-serif font-bold text-primary-700">
                    {interviewCount}
                  </p>
                  <p className="text-xs text-warm-500">访谈数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-serif font-bold text-primary-700">
                    {person.relatedSegments.length}
                  </p>
                  <p className="text-xs text-warm-500">相关片段</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-serif font-bold text-primary-700">
                    {person.relatedPeople.length}
                  </p>
                  <p className="text-xs text-warm-500">相关人物</p>
                </div>
              </div>
            </div>
          </div>

          {person.description && (
            <div className="mt-6 pt-6 border-t border-warm-100">
              <h3 className="text-sm font-medium text-warm-600 mb-2">简介</h3>
              <p className="text-warm-700 leading-relaxed">
                {person.description}
              </p>
            </div>
          )}
        </div>

        {person.relatedPeople.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-serif font-semibold text-primary-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              相关人物
            </h2>
            <div className="flex flex-wrap gap-3">
              {person.relatedPeople.map(rp => (
                <Link
                  key={rp.id}
                  to={`/people/${rp.id}`}
                  className="flex items-center gap-2 px-3 py-2 bg-warm-50 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-800">
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

        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-100">
            <h2 className="text-lg font-serif font-semibold text-primary-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              关联访谈片段
            </h2>
            <p className="text-sm text-warm-500 mt-1">
              共 {person.relatedSegments.length} 段提及该人物的内容
            </p>
          </div>

          <div className="divide-y divide-warm-100">
            {person.relatedSegments.map((segment: any) => (
              <div
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                className="p-5 hover:bg-warm-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                    <PlayCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-800">
                      {segment.interviewTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-warm-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-warm-600 ml-11 line-clamp-2">
                  {segment.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
