import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  PlayCircle,
  User,
  Clock,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { InterviewStatus } from '@shared/types.js';

export default function InterviewList() {
  const navigate = useNavigate();
  const { interviews, interviewTotal, fetchInterviews } = useAppStore();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | ''>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    interviewee: '',
    interviewer: '',
  });
  const pageSize = 10;

  useEffect(() => {
    fetchInterviews({
      page,
      pageSize,
      search: searchQuery || undefined,
      status: statusFilter || undefined,
    });
  }, [page, searchQuery, statusFilter, fetchInterviews]);

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  async function handleCreateInterview() {
    if (!newForm.title.trim()) return;

    try {
      const interview = await api.createInterview({
        title: newForm.title.trim(),
        interviewee: newForm.interviewee.trim() || undefined,
        interviewer: newForm.interviewer.trim() || undefined,
      });
      setShowNewModal(false);
      setNewForm({ title: '', interviewee: '', interviewer: '' });
      navigate(`/interviews/${interview.id}`);
    } catch (e) {
      alert('创建失败，请重试');
    }
  }

  const totalPages = Math.ceil(interviewTotal / pageSize);

  const statusOptions: { value: InterviewStatus | ''; label: string }[] = [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'editing', label: '校对中' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-900">访谈管理</h1>
          <p className="text-warm-500 mt-1">共 {interviewTotal} 份访谈记录</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建访谈
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-warm-200 mb-6">
        <div className="p-4 border-b border-warm-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
            <input
              type="text"
              placeholder="搜索访谈标题或受访者..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-warm-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InterviewStatus | '');
                setPage(1);
              }}
              className="px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-warm-100">
          {interviews.length === 0 ? (
            <div className="p-12 text-center text-warm-400">
              <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无访谈记录</p>
              <p className="text-sm mt-1">点击右上角「新建访谈」开始添加</p>
            </div>
          ) : (
            interviews.map((interview) => (
              <div
                key={interview.id}
                className="p-4 hover:bg-warm-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Link
                    to={`/interviews/${interview.id}`}
                    className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-primary-200 transition-colors"
                  >
                    <PlayCircle className="w-8 h-8 text-primary-600" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/interviews/${interview.id}`}
                      className="font-serif font-semibold text-lg text-primary-800 hover:text-primary-600 block truncate"
                    >
                      {interview.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-warm-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {interview.interviewee || '未填写'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(interview.duration)}
                      </span>
                      {interview.interviewDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {interview.interviewDate}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          interview.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : interview.status === 'editing'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {interview.status === 'completed'
                          ? '已完成'
                          : interview.status === 'editing'
                          ? '校对中'
                          : '草稿'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-warm-400">
                      {interview.segmentCount} 个段落 · 更新于 {formatDate(interview.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/interviews/${interview.id}`}
                      className="p-2 text-warm-500 hover:text-primary-600 hover:bg-warm-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button className="p-2 text-warm-500 hover:text-rose-600 hover:bg-warm-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-warm-500 hover:bg-warm-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-warm-100 flex items-center justify-between">
            <p className="text-sm text-warm-500">
              第 {page} / {totalPages} 页，共 {interviewTotal} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-warm-200 rounded-lg hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-warm-200 rounded-lg hover:bg-warm-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-warm-100">
              <h2 className="text-xl font-serif font-semibold text-primary-800">
                新建访谈
              </h2>
              <p className="text-sm text-warm-500 mt-1">创建新的访谈记录</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  访谈标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => setNewForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例如：某某某访谈录"
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  受访者
                </label>
                <input
                  type="text"
                  value={newForm.interviewee}
                  onChange={(e) => setNewForm(f => ({ ...f, interviewee: e.target.value }))}
                  placeholder="受访者姓名"
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  采访者
                </label>
                <input
                  type="text"
                  value={newForm.interviewer}
                  onChange={(e) => setNewForm(f => ({ ...f, interviewer: e.target.value }))}
                  placeholder="采访者姓名"
                  className="w-full px-3 py-2 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateInterview}
                disabled={!newForm.title.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
