import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListVideo,
  Tags,
  Search,
  Users,
  BookOpen,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/interviews', icon: ListVideo, label: '访谈管理' },
  { path: '/tags', icon: Tags, label: '标签管理' },
  { path: '/search', icon: Search, label: '检索中心' },
  { path: '/people', icon: Users, label: '人物档案' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-primary-800 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-primary-700">
        <h1 className="text-xl font-serif font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-accent-400" />
          <span>口述历史档案</span>
        </h1>
        <p className="text-xs text-primary-300 mt-1">Oral History Archive</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-700 text-white border-r-4 border-accent-400'
                  : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-700">
        <div className="text-xs text-primary-400">
          <p>馆员工作站</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
