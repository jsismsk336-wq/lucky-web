import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, AlertCircle, Loader2, Link2, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showGuide, setShowGuide] = useState(false);
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
        // Add credit to partner balance in Store & Firestore
        topupPartnerBalance(currentReseller.id, result.amount, result.voucherHash);
        
        setSuccessInfo({
          amount: result.amount,
          ownerName: result.ownerName || 'ผู้สร้างซอง',
        });
        toast.success(`เติมเงินสำเร็จ +฿${result.amount.toLocaleString()} บาท!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#0F121B] border border-orange-500/30 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden text-white"
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
        
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                เติมเงินด้วยซองทรูมันนี่
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-semibold">
                  TrueMoney Wallet
                </span>
              </h3>
              <p className="text-xs text-gray-400">ระบบอ่านลิงก์ซองขวัญและเติมเครดิตให้อัตโนมัติทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {successInfo ? (
            <div className="py-6 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="spring"
                className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <div>
                <h4 className="text-2xl font-black text-emerald-400">เติมเงินสำเร็จ!</h4>
                <p className="text-gray-400 text-sm mt-1">ได้รับเงินจาก {successInfo.ownerName}</p>
              </div>
              <div className="bg-[#181B28] border border-emerald-500/20 rounded-xl p-4 max-w-xs mx-auto">
                <div className="text-xs text-gray-400">ยอดเงินที่ได้รับ</div>
                <div className="text-3xl font-bold text-emerald-400 mt-1">
                  +฿{successInfo.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleResetSuccess}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  เติมเงินซองอื่นเพิ่ม
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Voucher Link input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 size={14} className="text-orange-400" />
                  วางลิงก์ซองทรูมันนี่ (TrueMoney Angpao Link)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={voucherUrl}
                    onChange={(e) => setVoucherUrl(e.target.value)}
                    placeholder="https://gift.truemoney.com/v2/verify/?v=..."
                    required
                    className="w-full bg-[#161925] border border-gray-800 focus:border-orange-500/80 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-mono text-xs pr-20"
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

                {/* Voucher Hash Detection Status */}
                <div className="mt-2">
                  {detectedHash ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                      <span>พบรหัสซอง: <strong className="font-mono">{detectedHash}</strong></span>
                    </div>
                  ) : voucherUrl ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>รูปแบบลิงก์ไม่ถูกต้อง กรุณาวางลิงก์ซองทรูมันนี่</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      ตัวอย่าง: <span className="font-mono text-gray-400">https://gift.truemoney.com/v2/verify/?v=...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Guide */}
              <div className="border-t border-gray-800/60 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="flex items-center gap-1.5 text-xs text-orange-400/90 hover:text-orange-300 transition-colors font-medium"
                >
                  <HelpCircle size={14} />
                  <span>วิธีสร้างและส่งซองทรูมันนี่?</span>
                </button>

                <AnimatePresence>
                  {showGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-[#141724] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1.5"
                    >
                      <p className="font-semibold text-white">ขั้นตอนการส่งซองง่ายๆ:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-400">
                        <li>เปิดแอป <strong>TrueMoney Wallet</strong> บนมือถือ</li>
                        <li>เลือกเมนู <strong>"ส่งซองขวัญ"</strong></li>
                        <li>ใส่จำนวนเงินที่ต้องการเติม แล้วกด <strong>"สร้างซองขวัญ"</strong></li>
                        <li>กด <strong>"คัดลอกลิงก์"</strong> แล้วนำมาวางในช่องด้านบน</li>
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !detectedHash}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isLoading || !detectedHash
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
                    : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>กำลังตรวจสอบและรับซองเงิน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>⚡ ยืนยันการเติมเงิน</span>
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
