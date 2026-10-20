import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  Bell, FileText, Settings, Zap, ChevronRight, ChevronDown,
  CalendarDays, Building2, MessagesSquare, ScrollText
} from 'lucide-react';
import { cn } from '../components/ui/utils';

interface SubNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SubNavItem[];
}

const navigation: NavItem[] = [
  { name: '企业列表', href: '/enterprises', icon: Building2 },
  {
    name: '消息管理',
    icon: MessagesSquare,
    children: [
      { name: '消息模板', href: '/templates', icon: FileText },
      { name: '推送记录', href: '/notifications', icon: Bell },
      { name: '消息设置', href: '/settings', icon: Settings },
    ],
  },
  { name: '政策管理', href: '/policies', icon: ScrollText },
  { name: '节假日情况', href: '/holidays', icon: CalendarDays },
];

const services = [
  { name: '能源管理',   color: '#34d399' },
  { name: '智能微网',   color: '#60a5fa' },
  { name: '虚拟电厂',   color: '#f59e0b' },
];

export default function Layout() {
  const location = useLocation();

  // Check if any child of 消息管理 is active
  const isMessageActive = ['/templates', '/notifications', '/settings'].some(
    p => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  const [msgMenuOpen, setMsgMenuOpen] = useState(true);

  // Keep open when navigating inside message management
  useEffect(() => {
    if (isMessageActive) {
      setMsgMenuOpen(true);
    }
  }, [isMessageActive]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4f6f8' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#0f1f2e' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3" style={{ background: '#2563eb' }}>
            <Zap className="size-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              零碳 SaaS
            </div>
            <div className="text-xs" style={{ color: '#475569' }}>消息推送管理</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.children) {
              const hasActiveChild = item.children.some(
                sub => location.pathname === sub.href || location.pathname.startsWith(sub.href + '/')
              );

              return (
                <div key={item.name} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setMsgMenuOpen(p => !p)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left select-none',
                      hasActiveChild
                        ? 'text-white bg-slate-800/80 font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          'size-4 mr-3',
                          hasActiveChild ? 'text-blue-400' : 'text-slate-500'
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {msgMenuOpen ? (
                      <ChevronDown className="size-3.5 text-slate-400 transition-transform" />
                    ) : (
                      <ChevronRight className="size-3.5 text-slate-400 transition-transform" />
                    )}
                  </button>

                  {/* Submenu */}
                  {msgMenuOpen && (
                    <div className="pt-0.5 pl-3 space-y-0.5 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-700/50">
                      {item.children.map((sub) => {
                        const isSubActive =
                          location.pathname === sub.href ||
                          location.pathname.startsWith(sub.href + '/');

                        return (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className={cn(
                              'flex items-center justify-between pl-6 pr-3 py-2 rounded-lg text-xs font-medium transition-colors',
                              isSubActive
                                ? 'text-white bg-blue-600/30 font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            )}
                          >
                            <div className="flex items-center">
                              <sub.icon
                                className={cn(
                                  'size-3.5 mr-2.5',
                                  isSubActive ? 'text-blue-400' : 'text-slate-500'
                                )}
                              />
                              {sub.name}
                            </div>
                            {isSubActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-0.5" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/') ||
              (item.href === '/enterprises' && location.pathname === '/');

            return (
              <Link
                key={item.name}
                to={item.href!}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                )}
                style={isActive ? { background: '#1e3a5f' } : undefined}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn('size-4 mr-3', isActive ? 'text-blue-400' : 'text-slate-600')}
                  />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="size-3 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Service legend */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-medium mb-3 px-1" style={{ color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            服务模块
          </p>
          <div className="space-y-1.5">
            {services.map((s) => (
              <div key={s.name} className="flex items-center px-1">
                <span className="w-2 h-2 rounded-full mr-2.5 flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs" style={{ color: '#64748b' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-xs" style={{ color: '#1e3a5f' }}>© 2026 零碳科技 v2.4.1</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
