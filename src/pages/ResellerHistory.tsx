import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Copy, Check, Search, RefreshCw, XCircle, ChevronDown, ChevronUp, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../components/ui/PinModal';
import { useStore } from '../store/useStore';

interface GroupedTransaction {
  groupId: string;
  redeemedAt: number;
  userName: string;
  productTitle: string;
  planLabel: string;
  quantity: number;
  totalCost: number;
  keys: any[];
}

export function ResellerHistory() {
  const { currentReseller, keys, products, packages, resetRequests = [], requestReset } = useStore();
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [resetKeyTarget, setResetKeyTarget] = useState<{ id: string, keyString: string } | null>(null);

  const partner = currentReseller;
  if (!partner) return null;

  // Filter keys redeemed by this partner
  const myKeys = keys
    .filter(k => k.redeemedBy === partner.id)
    .sort((a, b) => (b.redeemedAt ?? 0) - (a.redeemedAt ?? 0));

  // Group keys redeemed around the same time (within 3 seconds) into single transactions
  const groupedTransactions: GroupedTransaction[] = [];
  const processedKeyIds = new Set<string>();

  myKeys.forEach(key => {
    if (processedKeyIds.has(key.id)) return;

    const timeWindow = 3000; // 3 seconds
    const keyTime = key.redeemedAt || 0;

    // Find all keys belonging to the same redemption batch
    const batch = myKeys.filter(k => 
      !processedKeyIds.has(k.id) &&
      Math.abs((k.redeemedAt || 0) - keyTime) <= timeWindow &&
      k.productId === key.productId &&
      k.durationDays === key.durationDays
    );

    batch.forEach(k => processedKeyIds.add(k.id));

    // Resolve product & plan details
    const product = products.find(p => p.id === key.productId);
    const plan = product?.plans.find(p => p.id === key.planId) || product?.plans.find(p => Number(p.days) === Number(key.durationDays));
    const pkg = packages.find(p => Number(p.days) === Number(key.durationDays));

    const unitCost = partner.customPrices?.[key.durationDays] ?? (plan?.cost || pkg?.cost || 0);
    const totalCost = unitCost * batch.length;

    const productTitle = product?.title || `แพ็กเกจ ${key.durationDays < 0 ? Math.abs(key.durationDays) + ' ชม.' : key.durationDays + ' วัน'}`;
    const planLabel = plan?.label || (key.durationDays < 0 ? `${Math.abs(key.durationDays)} ชม` : `${key.durationDays} วัน`);

    groupedTransactions.push({
      groupId: `grp_${key.id}_${keyTime}`,
      redeemedAt: keyTime,
      userName: partner.username,
      productTitle,
      planLabel,
      quantity: batch.length,
      totalCost,
      keys: batch,
    });
  });

  // Filter grouped transactions by search query
  const searchTerm = search.trim().toLowerCase();
  const filteredGroups = groupedTransactions.filter(group => {
    if (!searchTerm) return true;
    const matchUser = group.userName.toLowerCase().includes(searchTerm);
    const matchProduct = group.productTitle.toLowerCase().includes(searchTerm);
    const matchPlan = group.planLabel.toLowerCase().includes(searchTerm);
    const matchKey = group.keys.some(k => k.keyString.toLowerCase().includes(searchTerm) || (k.hwid && k.hwid.toLowerCase().includes(searchTerm)));
    return matchUser || matchProduct || matchPlan || matchKey;
  });

  // Copy all keys in a transaction
  const handleCopyGroup = (groupId: string, groupKeys: any[]) => {
    const allKeysString = groupKeys.map(k => k.keyString).join('\n');
    navigator.clipboard.writeText(allKeysString);
    setCopiedGroupId(groupId);
    toast.success(`คัดลอก ${groupKeys.length} คีย์เรียบร้อยแล้ว!`);
    setTimeout(() => setCopiedGroupId(null), 2000);
  };

  // Copy single key
  const handleCopySingle = (keyId: string, keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setCopiedKeyId(keyId);
    toast.success('คัดลอกคีย์เรียบร้อยแล้ว!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleResetRequest = (keyId: string, keyString: string) => {
    requestReset(keyId, keyString);
    toast.success('ส่งคำขอรีเซ็ต HWID เรียบร้อยแล้ว!');
  };

  // Helper format date: 30/9/69 23:49
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const yearStr = (d.getFullYear() + 543).toString().slice(-2);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${yearStr} ${hours}:${mins}`;
  };

  return (
    <div className="animate-in fade-in duration-500 relative max-w-[1400px] mx-auto pb-12">
      <AnimatePresence>
        {resetKeyTarget && (
          <PinModal
            isOpen={!!resetKeyTarget}
            onClose={() => setResetKeyTarget(null)}
            title="ยืนยันการขอรีเซ็ต HWID"
            subtitle={`ระบุ PIN 6 หลักเพื่อยืนยันขอรีเซ็ตคีย์: ${resetKeyTarget.keyString}`}
            correctPin="123456"
            onSuccess={() => {
              handleResetRequest(resetKeyTarget.id, resetKeyTarget.keyString);
              setResetKeyTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
            <History size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              ประวัติการเบิกคีย์
            </h1>
            <p className="text-xs text-gray-400">
              รายการคีย์ที่คุณ Generate เบิกไปทั้งหมด
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ใช้ (User), สินค้า หรือคีย์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101014] border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-all shadow-inner"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
        </div>
      </div>

      {/* Table Container */}
      {myKeys.length === 0 ? (
        <div className="bg-[#0e0c12]/80 border border-gray-800/80 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-gray-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
            <History size={32} />
          </div>
          <p className="text-gray-400 font-medium text-sm">ยังไม่มีประวัติการเบิกคีย์</p>
          <p className="text-gray-600 text-xs mt-1">เมื่อคุณเบิกคีย์แล้ว ประวัติจะแสดงในหน้านี้</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-[#0e0c12]/80 border border-gray-800/80 rounded-2xl p-16 text-center">
          <Search size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium text-sm">ไม่พบข้อมูลประวัติที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-[#0e0c12]/90 border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800/80 bg-[#14121a]/90 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">วันที่</th>
                  <th className="py-3.5 px-6">ผู้เบิก (User)</th>
                  <th className="py-3.5 px-6">สินค้า / ตัวเลือก</th>
                  <th className="py-3.5 px-6 text-center">จำนวน</th>
                  <th className="py-3.5 px-6 text-center">พอยท์ที่ใช้</th>
                  <th className="py-3.5 px-6 text-right">คีย์ที่ได้รับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {filteredGroups.map((group) => {
                  const isExpanded = expandedGroupId === group.groupId;
                  const isGroupCopied = copiedGroupId === group.groupId;

                  return (
                    <tr 
                      key={group.groupId}
                      className="hover:bg-[#181522]/60 transition-colors group"
                    >
                      {/* วันที่ */}
                      <td className="py-4 px-6 font-mono text-gray-400 whitespace-nowrap text-[11px]">
                        {formatDate(group.redeemedAt)}
                      </td>

                      {/* ผู้เบิก (User) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 bg-[#241334] border border-[#4a206b] rounded-full px-3 py-1">
                          <div className="w-5 h-5 rounded-full bg-[#aa3bff] text-white flex items-center justify-center text-[10px] font-bold uppercase shadow-sm">
                            {group.userName.charAt(0)}
                          </div>
                          <span className="text-white font-bold text-xs tracking-wide">{group.userName}</span>
                        </div>
                      </td>

                      {/* สินค้า / ตัวเลือก */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-white text-xs tracking-wide">{group.productTitle}</div>
                          <div className="text-[10px] font-medium text-pink-400 mt-0.5">{group.planLabel}</div>
                        </div>
                      </td>

                      {/* จำนวน */}
                      <td className="py-4 px-6 text-center font-bold font-mono text-white text-xs">
                        {group.quantity}
                      </td>

                      {/* พอยท์ที่ใช้ */}
                      <td className="py-4 px-6 text-center font-bold text-pink-400 whitespace-nowrap text-xs">
                        {group.totalCost} พอยท์
                      </td>

                      {/* คีย์ที่ได้รับ / ปุ่มคัดลอก */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyGroup(group.groupId, group.keys)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                              isGroupCopied
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-[#181924] border-gray-700/60 hover:border-pink-500/50 text-gray-200 hover:text-white hover:bg-[#202232]'
                            }`}
                          >
                            {isGroupCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isGroupCopied ? 'คัดลอกแล้ว' : `คัดลอก (${group.quantity})`}</span>
                          </button>

                          <button
                            onClick={() => setExpandedGroupId(isExpanded ? null : group.groupId)}
                            title="ดูรายละเอียดคีย์"
                            className="p-1.5 rounded-lg bg-[#181924] border border-gray-700/50 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded Key List Details Modal / Overlay */}
      <AnimatePresence>
        {expandedGroupId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#101014] border border-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-pink-400" />
                  <h3 className="text-sm font-bold text-white">รายละเอียดคีย์เบิก</h3>
                </div>
                <button 
                  onClick={() => setExpandedGroupId(null)}
                  className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-gray-800/60"
                >
                  ปิด
                </button>
              </div>

              {(() => {
                const targetGroup = groupedTransactions.find(g => g.groupId === expandedGroupId);
                if (!targetGroup) return null;

                return (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>สินค้า: <strong className="text-white">{targetGroup.productTitle}</strong> ({targetGroup.planLabel})</span>
                      <button
                        onClick={() => handleCopyGroup(targetGroup.groupId, targetGroup.keys)}
                        className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <Copy size={12} /> คัดลอกทั้งหมด ({targetGroup.keys.length})
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {targetGroup.keys.map((k) => {
                        const isCopied = copiedKeyId === k.id;
                        const latestRequest = resetRequests
                          .filter(r => r.keyId === k.id)
                          .sort((a, b) => b.createdAt - a.createdAt)[0];
                        
                        const isPending = latestRequest?.status === 'pending';

                        return (
                          <div 
                            key={k.id}
                            className="bg-[#161720] border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1 font-mono text-gray-200 truncate font-semibold">
                              {k.keyString}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => !isPending && setResetKeyTarget({ id: k.id, keyString: k.keyString })}
                                disabled={isPending}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  isPending
                                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                                    : 'bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-gray-700'
                                }`}
                              >
                                <RefreshCw size={11} className={isPending ? 'animate-spin' : ''} />
                                <span>{isPending ? 'รอรีเซ็ต' : 'ขอรีเซ็ต HWID'}</span>
                              </button>

                              <button
                                onClick={() => handleCopySingle(k.id, k.keyString)}
                                className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 border border-gray-700 text-[10px] font-bold flex items-center gap-1 transition-all"
                              >
                                {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
