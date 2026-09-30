import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Coins, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { extractVoucherHash, redeemTrueMoneyVoucher } from '../../utils/truemoney';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TopupModal({ isOpen, onClose }: TopupModalProps) {
  const { currentReseller, topupPartnerBalance, truemoneyPhone } = useStore();
  const [voucherUrl, setVoucherUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedHash, setDetectedHash] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; ownerName: string } | null>(null);

  useEffect(() => {
    const hash = extractVoucherHash(voucherUrl);
    setDetectedHash(hash);
  }, [voucherUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentReseller) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน');
      return;
    }

    const cleanPhone = truemoneyPhone ? truemoneyPhone.replace(/[^0-9]/g, '') : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('ระบบยังไม่ได้ตั้งค่าเบอร์ TrueMoney รับเงิน กรุณาแจ้งแอดมินให้ตั้งค่าหลังบ้าน');
      return;
    }

    if (!detectedHash) {
      toast.error('กรุณาวางลิงก์ซองทรูมันนี่ที่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    try {
      const result = await redeemTrueMoneyVoucher(voucherUrl, cleanPhone);

      if (result.success && result.amount && result.amount > 0) {
        // Add credit (points) to partner balance in Store & Firestore
        topupPartnerBalance(currentReseller.id, result.amount, result.voucherHash);
        
        setSuccessInfo({
          amount: result.amount,
          ownerName: result.ownerName || 'ผู้สร้างซอง',
        });
        toast.success(`เติมพอยท์สำเร็จ +${result.amount.toLocaleString()} พอยท์!`);
        setVoucherUrl('');
      } else {
        toast.error(result.message || 'ไม่สามารถรับซองทรูมันนี่ได้');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการเติมเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSuccess = () => {
    setSuccessInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-[95%] sm:w-full max-w-md max-h-[90vh] bg-[#101012] border border-white/12 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar text-white"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                เติมพอยท์ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">TrueMoney</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">อัตราเติม: 1 บาท = 1 พอยท์ (พอยท์เข้าทันที 24 ชม.)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {successInfo ? (
            <div className="py-6 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <div>
                <h4 className="text-2xl font-black text-emerald-400">เติมพอยท์สำเร็จ!</h4>
                <p className="text-gray-400 text-sm mt-1">ได้รับพอยท์จาก {successInfo.ownerName}</p>
              </div>
              <div className="bg-[#141622] border border-emerald-500/30 rounded-xl p-4 max-w-xs mx-auto">
                <div className="text-xs text-gray-400">พอยท์ที่ได้รับเพิ่ม</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">
                  +{successInfo.amount.toLocaleString()} พอยท์
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleResetSuccess}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs transition-all shadow-lg"
                >
                  เติมซองอื่นเพิ่ม
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Current Points Display Card */}
              <div className="bg-[#141622] border border-purple-900/40 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Coins size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">พอยท์ปัจจุบันของคุณ</div>
                    <div className="text-base font-black text-purple-300">
                      {currentReseller?.balance?.toLocaleString() || 0} พอยท์
                    </div>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>ระบบอัตโนมัติ</span>
                </span>
              </div>

              {/* Voucher Link Input */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  ลิงก์ซองของขวัญ TrueMoney <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={voucherUrl}
                    onChange={(e) => setVoucherUrl(e.target.value)}
                    placeholder="https://gift.truemoney.com/campaign/?v=..."
                    required
                    className="w-full bg-[#0B0D14] border border-purple-900/50 focus:border-pink-500 rounded-xl px-4 py-3 text-white text-xs focus:outline-none transition-all font-mono"
                  />
                  {voucherUrl && (
                    <button
                      type="button"
                      onClick={() => setVoucherUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                    >
                      ล้าง
                    </button>
                  )}
                </div>

                {/* Hash Status Indicator */}
                {detectedHash ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={14} className="flex-shrink-0" />
                    <span>พบรหัสซอง: <strong className="font-mono">{detectedHash}</strong></span>
                  </div>
                ) : voucherUrl ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>รูปแบบลิงก์ไม่ถูกต้อง</span>
                  </div>
                ) : null}
              </div>

              {/* Step-by-step Instructions Box */}
              <div className="bg-[#141622]/90 border border-gray-800/80 rounded-xl p-4 text-xs text-gray-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>วิธีสร้างซองของขวัญ TrueMoney:</span>
                </div>
                <ol className="space-y-1.5 text-gray-400 text-[11px] leading-relaxed pl-1">
                  <li>1. เปิดแอป <strong>TrueMoney Wallet</strong> กดที่เมนู <strong>"โอนเงิน"</strong> &rarr; <strong>"ส่งซองของขวัญ"</strong></li>
                  <li>2. ระบุจำนวนเงินที่ต้องการเติม (เช่น 50, 100, 500 บาท)</li>
                  <li>3. เลือกประเภทการสุ่มเป็น <strong>"แบ่งจำนวนเงินเท่ากัน"</strong></li>
                  <li>4. ระบุจำนวนคนรับซองเป็น <strong>"1 คน"</strong></li>
                  <li>5. กดสร้างซอง แล้วคัดลอกลิงก์ซองมาวางในช่องด้านบน</li>
                </ol>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading || !detectedHash}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isLoading || !detectedHash
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
                    : 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-600 hover:to-pink-500 text-white shadow-purple-500/25 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>กำลังตรวจสอบและรับซองเงิน...</span>
                  </>
                ) : (
                  <>
                    <Gift size={18} />
                    <span>🎁 ยืนยันเติมพอยท์ผ่านซอง</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
