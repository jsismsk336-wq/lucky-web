import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonLogo } from '../components/ui/NeonLogo';
import dnaBg from '../assets/dna-bg.png';
import { NeonInput } from '../components/ui/NeonInput';
import { GradientButton } from '../components/ui/GradientButton';
import { useStore } from '../store/useStore';
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
  formatLockoutTime,
  loginDelay,
  initSecurityHardening,
} from '../utils/security';
import toast from 'react-hot-toast';
import { ShieldCheck, Zap, Rocket, ArrowRight, ShoppingBag, ArrowLeft, PackageCheck } from 'lucide-react';

export function Login() {
  const [showLanding, setShowLanding] = useState(true);
  const [showStockModal, setShowStockModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(0);
  const navigate = useNavigate();
  const { login, globalLogoUrl, packages } = useStore();

  // Init security hardening (right-click, devtools keys)
  useEffect(() => {
    const cleanup = initSecurityHardening();
    return cleanup;
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutMs <= 0) return;
    const interval = setInterval(() => {
      setLockoutMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutMs]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || lockoutMs > 0) return;

    // 1. Rate limit check
    const { allowed, remainingMs } = checkLoginAllowed(username);
    if (!allowed) {
      setLockoutMs(remainingMs);
      toast.error(`บัญชีถูกล็อก กรุณารอ ${formatLockoutTime(remainingMs)}`);
      return;
    }

    setLoading(true);

    // 2. Anti-bot delay
    const result = login(username, password);
    await loginDelay(result !== 'error');

    setLoading(false);

    if (result === 'admin') {
      recordLoginSuccess(username);
      toast.success('ยินดีต้อนรับ Admin!');
      navigate('/dashboard');
    } else if (result === 'reseller') {
      recordLoginSuccess(username);
      toast.success(`ยินดีต้อนรับ ${username}!`);
      navigate('/reseller');
    } else {
      // 3. Record failure + check if now locked
      const { locked, attemptsLeft } = recordLoginFailure(username);
      if (locked) {
        setLockoutMs(5 * 60 * 1000);
        toast.error('เข้าสู่ระบบผิดพลาดเกินกำหนด บัญชีถูกล็อก 5 นาที!');
      } else {
        toast.error(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${attemptsLeft} ครั้ง)`);
      }
      setPassword('');
    }
  };

  const isLocked = lockoutMs > 0;
  const lockSeconds = Math.ceil(lockoutMs / 1000);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden bg-black font-sans text-white">
      {/* Exact X2SQUAD Background Banner Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity scale-105 transition-all duration-1000"
        style={{ backgroundImage: `url('https://th01.web2u.xyz/pic/uploads/20260917_035755_3d776747.png')` }}
      />
      
      {/* Red Glowing Orbs (X2SQUAD Style) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-red-600/25 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse duration-[4000ms]" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-red-800/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] z-0 pointer-events-none" />

      <AnimatePresence mode="wait">
        {showLanding ? (
          /* ========================================================================= */
          /* LANDING INTRO PAGE (X2SQUAD STORE STYLE)                                   */
          /* ========================================================================= */
          <motion.div
            key="landing-intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-12 px-4"
          >
            {/* Dynamic Logo (Connected to Admin Backend Settings) */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 relative group"
            >
              {globalLogoUrl ? (
                <div className="relative p-2">
                  <div className="absolute inset-0 bg-red-600/30 rounded-2xl blur-xl group-hover:bg-red-600/50 transition-all duration-500" />
                  <img 
                    src={globalLogoUrl} 
                    alt="LUCKY STORE Logo" 
                    className="w-24 h-24 md:w-28 md:h-28 object-contain relative z-10 filter drop-shadow-[0_0_20px_rgba(230,0,0,0.8)]"
                  />
                </div>
              ) : (
                <NeonLogo size="lg" />
              )}
            </motion.div>

            {/* Red Live Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-600/40 mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(230,0,0,0.3)]"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-red-200">
                WELCOME TO LUCKY STORE
              </span>
            </motion.div>

            {/* Hero Main Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-medium mb-4 text-white tracking-wide"
            >
              <span className="font-light text-gray-200">ยินดีต้อนรับสู่</span>{' '}
              <span className="font-bold bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(230,0,0,0.7)]">
                LUCKY STORE
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-xs md:text-sm font-light max-w-xl leading-relaxed mb-8 tracking-wide opacity-90"
            >
              LUCKY STORE — ร้านบริการจำหน่ายคีย์และสินค้าดิจิทัลอัตโนมัติ
              <br className="hidden md:inline" />
              ตอบโจทย์ทุกการใช้งาน ปลอดภัย ใช้งานง่าย ได้รับของทันที 24 ชั่วโมง
            </motion.p>

            {/* Feature Badges (X2SQUAD Pill Buttons) */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-10"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12141F]/80 border border-gray-800/80 text-xs font-light text-gray-300 backdrop-blur-sm">
                <Zap size={13} className="text-red-500" />
                <span>ระบบอัตโนมัติ 24 ชม.</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12141F]/80 border border-gray-800/80 text-xs font-light text-gray-300 backdrop-blur-sm">
                <ShieldCheck size={13} className="text-red-500" />
                <span>ปลอดภัย มั่นใจได้ 100%</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12141F]/80 border border-gray-800/80 text-xs font-light text-gray-300 backdrop-blur-sm">
                <Rocket size={13} className="text-red-500" />
                <span>บริการรวดเร็วทันใจ</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => setShowLanding(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs transition-all duration-300 shadow-[0_0_25px_rgba(230,0,0,0.5)] hover:shadow-[0_0_35px_rgba(230,0,0,0.8)] active:scale-95 cursor-pointer tracking-wider"
              >
                <span>เข้าสู่เว็บไซต์</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setShowStockModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#12141F]/90 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-medium text-xs transition-all duration-300 hover:bg-[#1A1D2B] cursor-pointer tracking-wider"
              >
                <ShoppingBag size={14} className="text-red-400" />
                <span>ดูสินค้าทั้งหมด</span>
              </button>
            </motion.div>

            {/* Footer */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-16 text-xs text-gray-600"
            >
              © 2026 LUCKY STORE — All rights reserved.
            </motion.p>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* LOGIN FORM MODAL CARD                                                     */
          /* ========================================================================= */
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[420px] relative z-10 my-8"
          >
            <button
              onClick={() => setShowLanding(true)}
              className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-black/40 border border-gray-800 backdrop-blur-md cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>ย้อนกลับหน้าแรก</span>
            </button>

            <GlassCard className="w-full p-8 md:p-10 flex flex-col items-center border-red-500/10 bg-[#0B0E14]/80 backdrop-blur-xl shadow-[0_0_50px_rgba(230,0,0,0.15)]">
              {/* Dynamic Logo inside Login Card */}
              <div className="mb-4 relative">
                {globalLogoUrl ? (
                  <img 
                    src={globalLogoUrl} 
                    alt="LUCKY Logo" 
                    className="w-20 h-20 object-contain filter drop-shadow-[0_0_15px_rgba(230,0,0,0.6)]" 
                  />
                ) : (
                  <NeonLogo size="lg" />
                )}
              </div>
              
              <h1 className="text-2xl font-bold tracking-wider text-white mb-1">LUCKY STORE</h1>
              <p className="text-xs text-gray-400 tracking-[0.2em] mb-6 font-medium uppercase">VOLUMETRIC GATEWAY</p>
              
              <div className="w-full flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-800 flex-1"></div>
                <span className="text-[10px] uppercase tracking-widest text-red-400/80 font-semibold">เข้าสู่ระบบหลังบ้าน</span>
                <div className="h-px bg-gray-800 flex-1"></div>
              </div>

              {isLocked && (
                <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                  <p className="text-red-400 text-sm font-medium">🔒 บัญชีถูกล็อกชั่วคราว</p>
                  <p className="text-red-300 text-xs mt-1">รอ {lockSeconds} วินาที</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
                <NeonInput
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  disabled={isLocked}
                />
                
                <NeonInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked}
                />

                <GradientButton
                  type="submit"
                  className="py-3.5 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_20px_rgba(230,0,0,0.4)]"
                  disabled={loading || isLocked}
                >
                  {loading ? 'กำลังตรวจสอบ...' : isLocked ? `ล็อก ${lockSeconds}s` : 'เข้าสู่ระบบ (Sign In)'}
                </GradientButton>
              </form>

              <p className="mt-8 text-[11px] text-gray-500 tracking-wide text-center">
                © 2026 <span className="text-gray-400 font-semibold">LUCKY STORE</span> · All rights reserved.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Preview Modal */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#12141F] border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <PackageCheck className="text-red-500" />
                  <span>รายการแพ็กเกจสินค้า (LUCKY STORE)</span>
                </div>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                รายการแพ็กเกจสินค้าพร้อมระบบส่งของอัตโนมัติ 24 ชั่วโมง
              </p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <div key={pkg.days} className="bg-[#0B0E14] border border-gray-800/80 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-sm">แพ็กเกจ {pkg.days} วัน</h4>
                        <p className="text-xs text-gray-400 mt-0.5">ระบบเบิกสินค้าอัตโนมัติ 1 อุปกรณ์</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
                          {pkg.cost} เครดิต
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm py-8">ไม่มีรายการสินค้าในขณะนี้</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setShowLanding(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-bold text-xs"
                >
                  เข้าสู่ระบบเพื่อสั่งซื้อ ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
