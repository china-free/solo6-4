import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Search,
  ChevronRight,
  FileAudio,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Tag } from '@shared/types.js';

export default function PeoplePage() {
  const [people, setPeople] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    setIsLoading(true);
    try {
      const tags = await api.getTags('person');
      setPeople(tags.sort((a, b) => b.usageCount - a.usageCount));
    } catch (e) {
      console.error('Failed to load people:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPeople = searchQuery
    ? people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : people;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-primary-900">人物档案</h1>
          <p className="text-warm-500 mt-1">
            共 {people.length} 位人物 · 点击查看关联访谈片段
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索人物姓名..."
            className="w-full pl-12 pr-4 py-3 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>

        <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-warm-500">加载中...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="p-12 text-center text-warm-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无人物记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-warm-100">
              {filteredPeople.map(person => (
                <Link
                  key={person.id}
                  to={`/people/${person.id}`}
                  className="bg-white p-5 hover:bg-warm-50 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: person.color + '20' }}
                    >
                      <User
                        className="w-6 h-6"
                        style={{ color: person.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-lg text-primary-800 group-hover:text-primary-600 transition-colors">
                        {person.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-warm-500">
                        <span className="flex items-center gap-1">
                          <FileAudio className="w-4 h-4" />
                          {person.usageCount} 段
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-warm-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
