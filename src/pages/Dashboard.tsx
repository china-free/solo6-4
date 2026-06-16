import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileAudio,
  FileText,
  User,
  MapPin,
  Clock,
  PlayCircle,
  Plus,
  Upload,
  FileInput,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { stats, interviews, fetchStats, fetchRecentInterviews } = useAppStore();

  useEffect(() => {
    fetchStats();
    useAppStore.getState().fetchRecentInterviews?.(5);
  }, [fetchStats]);

  useEffect(() => {
    fetchRecentInterviews();
  }, [fetchRecentInterviews]);

  const recentInterviews = useAppStore((state) => state.interviews);

  const statCards = [
    {
      label: '访谈总数',
      value: stats?.totalInterviews || 0,
      icon: FileAudio,
      color: 'bg-primary-600',
    },
    {
      label: '段落总数',
      value: stats?.totalSegments || 0,
      icon: FileText,
      color: 'bg-accent-500',
    },
    {
      label: '人物标签',
      value: stats?.totalPersonTags || 0,
      icon: User,
      color: 'bg-emerald-600',
    },
    {
      label: '地点标签',
      value: stats?.totalLocationTags || 0,
      icon: MapPin,
      color: 'bg-rose-600',
    },
  ];

  const quickActions = [
    { label: '新建访谈', icon: Plus, color: 'bg-primary-600 hover:bg-primary-700', to: '/interviews?action=new' },
    { label: '上传音频', icon: Upload, color: 'bg-accent-500 hover:bg-accent-600', to: '/interviews' },
    { label: '导入转写稿', icon: FileInput, color: 'bg-emerald-600 hover:bg-emerald-700', to: '/interviews' },
  ];

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary-900">工作台</h1>
        <p className="text-warm-500 mt-1">欢迎回来，开始今天的档案整理工作</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm border border-warm-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warm-500">{card.label}</p>
                <p className="text-3xl font-serif font-bold text-primary-800 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={cn('p-3 rounded-lg text-white', card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-warm-200">
            <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-primary-800">最近访谈</h2>
              <Link
                to="/interviews"
                className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-warm-100">
              {recentInterviews.length === 0 ? (
                <div className="p-8 text-center text-warm-400">
                  <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无访谈记录</p>
                </div>
              ) : (
                recentInterviews.slice(0, 5).map((interview) => (
                  <Link
                    key={interview.id}
                    to={`/interviews/${interview.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-warm-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary-900 truncate">
                        {interview.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-warm-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {interview.interviewee || '未填写'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(interview.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full',
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
                      <p className="text-xs text-warm-400 mt-2">
                        {formatDate(interview.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-warm-200">
            <div className="px-6 py-4 border-b border-warm-100">
              <h2 className="text-lg font-serif font-semibold text-primary-800">快捷操作</h2>
            </div>
            <div className="p-4 space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg text-white transition-all duration-200',
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-lg p-6 text-white">
            <h3 className="font-serif text-lg font-semibold">整理进度</h3>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-primary-200">已完成</span>
                  <span>{stats?.completedInterviews || 0} 份</span>
                </div>
                <div className="h-2 bg-primary-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-400 rounded-full transition-all"
                    style={{
                      width: `${stats?.totalInterviews ? (stats.completedInterviews / stats.totalInterviews) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-primary-200">校对中</span>
                  <span>{stats?.editingInterviews || 0} 份</span>
                </div>
                <div className="h-2 bg-primary-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full transition-all"
                    style={{
                      width: `${stats?.totalInterviews ? (stats.editingInterviews / stats.totalInterviews) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
