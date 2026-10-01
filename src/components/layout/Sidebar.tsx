import { NavLink } from 'react-router-dom';
import { ShieldAlert, Users, Key, Lock, X, RefreshCw, Globe, Megaphone, PackagePlus } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const resetRequests = useStore(state => state.resetRequests || []);
  const pendingCount = resetRequests.filter(r => r.status === 'pending').length;
  const { t, language, toggleLanguage } = useTranslation();

  const menuItems = [
    { path: '/dashboard', label: t('sidebar.overview'), icon: ShieldAlert },
    { path: '/dashboard/products', label: 'สินค้า & หมวดหมู่', icon: PackagePlus },
    { path: '/dashboard/partners', label: t('sidebar.partners'), icon: Users },
    { path: '/dashboard/keys', label: t('sidebar.keys'), icon: Key },
    { path: '/dashboard/announcements', label: t('sidebar.announcements'), icon: Megaphone },
    { path: '/dashboard/settings', label: t('sidebar.settings'), icon: Lock },
    { path: '/dashboard/reset-requests', label: t('sidebar.resetRequests'), icon: RefreshCw, badge: pendingCount > 0 ? pendingCount : null },
  ];

  return (
    <aside
      className={`w-64 bg-[#101012] border-r border-white/10 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Brand & Profile */}
      <div className="p-4 sm:p-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 flex-shrink-0">
          <NeonLogo className="w-full h-full scale-105" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-white font-bold tracking-wider text-sm sm:text-base">{t('sidebar.adminTitle')}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-green-500 text-[10px] font-bold">{t('sidebar.adminRole')}</span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-white border border-primary/30 shadow-[0_0_15px_rgba(0,145,255,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className="opacity-80" />
              <span className="text-xs sm:text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/20 font-num">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Switcher */}
      <div className="p-3.5 border-t border-white/10">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all text-xs font-bold tracking-wide"
        >
          <Globe size={16} className={language === 'th' ? 'text-blue-400' : 'text-purple-400'} />
          <span>{language.toUpperCase()}</span>
        </button>
      </div>
    </aside>
  );
}
