import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Key, LogOut, Menu, X, Headset, Globe, Megaphone, Wallet } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { ContactAdminModal } from '../ui/ContactAdminModal';
import { TopupModal } from '../ui/TopupModal';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function ResellerLayout() {
  const { currentReseller, logoutReseller } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  if (!currentReseller) {
    return <Navigate to="/" replace />;
  }

  const partner = currentReseller;

  const handleLogout = () => {
    logoutReseller();
    toast.success('ออกจากระบบเรียบร้อย');
    navigate('/');
  };

  const menuItems = [
    { path: '/reseller/dashboard', label: t('reseller.dashboardTitle'), icon: LayoutDashboard },
    { path: '/reseller/history', label: t('reseller.history'), icon: Key },
    { path: '/reseller/announcements', label: t('reseller.announcements'), icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contact Admin Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <ContactAdminModal 
            isOpen={isContactModalOpen} 
            onClose={() => setIsContactModalOpen(false)} 
          />
        )}
        {isTopupOpen && (
          <TopupModal 
            isOpen={isTopupOpen} 
            onClose={() => setIsTopupOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#101012] border-r border-white/10 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 flex items-center gap-4 border-b border-gray-800/40">
          <div className="w-12 h-12 flex-shrink-0">
            <NeonLogo className="w-full h-full scale-110" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-white font-bold tracking-wider">LUCKY</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
              <span className="text-blue-400 text-[10px] font-bold truncate">{partner?.username ?? 'Reseller'}</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance badge */}
        {partner && (
          <div className="mx-4 mt-4 bg-[#1C1F2E] border border-gray-800/60 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{t('reseller.balance')}</div>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                TrueMoney
              </span>
            </div>
            <div className="text-xl font-bold text-primary">{partner.balance.toLocaleString()}</div>
            <button
              onClick={() => setIsTopupOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              <Wallet size={14} />
              <span>เติมเงิน (ซองทรูมันนี่)</span>
            </button>
          </div>
        )}

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-white border border-primary/30 shadow-[0_0_15px_rgba(66,133,244,0.15)]'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
                }`
              }
            >
              <item.icon size={18} className="opacity-80" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800/40">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-white transition-all text-sm font-medium border border-blue-500/20 hover:border-blue-500/40"
          >
            <Headset size={18} />
            {t('layout.contactAdmin')}
          </button>
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-[#1C1F2E] text-gray-300 hover:text-white hover:bg-gray-800 transition-all text-sm font-medium border border-gray-800/60"
          >
            <Globe size={18} className={language === 'th' ? 'text-blue-400' : 'text-purple-400'} />
            {language.toUpperCase()}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            {t('layout.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[#0c0c0d]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7">
              <NeonLogo className="w-full h-full" />
            </div>
            <span className="font-bold text-white tracking-wider text-xs sm:text-sm">
              {partner?.username ?? 'Reseller'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{partner?.balance.toLocaleString()} cr</span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-[#101012] border border-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-4 sm:space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
