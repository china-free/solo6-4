import { cn } from '@/lib/utils';
import type { Tag } from '@shared/types.js';

const categoryColors: Record<string, string> = {
  person: 'bg-rose-100 text-rose-700 border-rose-200',
  location: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  era: 'bg-violet-100 text-violet-700 border-violet-200',
  event: 'bg-amber-100 text-amber-700 border-amber-200',
};

const categoryLabels: Record<string, string> = {
  person: '人物',
  location: '地点',
  era: '年代',
  event: '事件',
};

interface TagBadgeProps {
  tag: Tag;
  showCategory?: boolean;
  size?: 'sm' | 'md';
  count?: number;
  className?: string;
}

export default function TagBadge({ tag, showCategory = false, size = 'sm', count, className = '' }: TagBadgeProps) {
  const colorClass = categoryColors[tag.category] || categoryColors.person;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border rounded-full font-medium',
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
      style={{ borderColor: tag.color + '40', backgroundColor: tag.color + '15', color: tag.color }}
    >
      {showCategory && (
        <span className="opacity-60">{categoryLabels[tag.category]}·</span>
      )}
      <span>{tag.name}</span>
      {count !== undefined && count > 0 && (
        <span className="opacity-60">×{count}</span>
      )}
    </span>
  );
}

export { categoryColors, categoryLabels };
