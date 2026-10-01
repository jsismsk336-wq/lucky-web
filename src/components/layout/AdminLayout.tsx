import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { NeonLogo } from '../ui/NeonLogo';
import { useStore } from '../../store/useStore';
import { Navigate } from 'react-router-dom';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentAdmin = useStore(s => s.currentAdmin);

  if (!currentAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0d] text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[#0c0c0d]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7">
              <NeonLogo className="w-full h-full" />
            </div>
            <span className="font-bold text-white tracking-wider text-xs sm:text-sm">LUCKY แอดมิน</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-[#101012] border border-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
