import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, LogOut, Delete } from 'lucide-react';
import toast from 'react-hot-toast';

interface PinKeypadModalProps {
  username: string;
  isSetupMode?: boolean; // True if setting PIN for the first time or after admin reset
  correctPin?: string;  // Correct PIN for unlock mode
  onSuccess: (pin: string) => void;
  onLogout: () => void;
}

export function PinKeypadModal({
  username,
  isSetupMode = false,
  correctPin = '',
  onSuccess,
  onLogout,
}: PinKeypadModalProps) {
  const [pin, setPin] = useState<string>('');
  const [firstPin, setFirstPin] = useState<string>(''); // For setup mode 2-step confirm
  const [step, setStep] = useState<1 | 2>(1);
  const [isError, setIsError] = useState(false);

  // Handle number click
  const handleNumClick = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);

      if (nextPin.length === 6) {
        handleCompletePin(nextPin);
      }
    }
  };

  // Clear single digit
  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // Clear all digits
  const handleClearAll = () => {
    setPin('');
  };

  // Complete 6 digits logic
  const handleCompletePin = (enteredPin: string) => {
    if (isSetupMode) {
      if (step === 1) {
        // Store first PIN and prompt for confirmation
        setFirstPin(enteredPin);
        setStep(2);
        setPin('');
        toast.success('กรุณากรอกรหัส PIN 6 หลักอีกครั้งเพื่อยืนยัน');
      } else {
        // Step 2 confirm
        if (enteredPin === firstPin) {
          toast.success('ตั้งรหัส PIN 6 หลักเรียบร้อยแล้ว!');
          onSuccess(enteredPin);
        } else {
          setIsError(true);
          toast.error('รหัส PIN ไม่ตรงกัน กรุณาตั้งใหม่');
          setTimeout(() => {
            setStep(1);
            setFirstPin('');
            setPin('');
            setIsError(false);
          }, 600);
        }
      }
    } else {
      // Unlock mode
      if (enteredPin === correctPin) {
        onSuccess(enteredPin);
      } else {
        setIsError(true);
        toast.error('รหัส PIN 6 หลักไม่ถูกต้อง');
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500);
      }
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        handleNumClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, step, firstPin, isSetupMode, correctPin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans text-white select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isError ? [-12, 12, -10, 10, -5, 5, 0] : 0,
        }}
        transition={{ duration: isError ? 0.4 : 0.25 }}
        className="w-full max-w-[360px] sm:max-w-[400px] bg-[#101012] border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center relative shadow-[0_0_50px_rgba(168,85,247,0.2)]"
      >
        {/* Top Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.3)] mb-4">
          <Lock size={26} />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide text-center">
          {isSetupMode
            ? step === 1
              ? 'ตั้งรหัส PIN 6 หลักใหม่'
              : 'ยืนยันรหัส PIN 6 หลัก'
            : 'ระบบล็อคความปลอดภัย'}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-gray-400 mt-1 mb-3 text-center font-medium">
          {isSetupMode
            ? step === 1
              ? 'กำหนดรหัส PIN 6 หลักสำหรับเข้าใช้งานระบบ'
              : 'กรุณากรอกรหัส PIN 6 หลักซ้ำอีกครั้งเพื่อยืนยัน'
            : 'กรุณากรอกรหัส PIN 6 หลักเพื่อเข้าใช้งาน'}
        </p>

        {/* Username Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-purple-300 mb-4">
          <User size={13} className="text-purple-400" />
          <span>{username}</span>
        </div>

        {/* 6 PIN Indicator Circles */}
        <div className="flex items-center justify-center gap-3.5 my-4">
          {Array.from({ length: 6 }).map((_, idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-purple-400 shadow-[0_0_12px_rgba(236,72,153,0.8)] scale-110'
                    : 'bg-transparent border-2 border-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* 12 Keypad Grid */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[290px] my-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map(val => {
            if (val === 'C') {
              return (
                <button
                  key={val}
                  type="button"
                  onClick={handleClearAll}
                  className="h-13 rounded-2xl bg-[#16181b] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                >
                  C
                </button>
              );
            }
            if (val === 'DEL') {
              return (
                <button
                  key={val}
                  type="button"
                  onClick={handleDelete}
                  className="h-13 rounded-2xl bg-[#16181b] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 text-xs font-bold transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                >
                  <Delete size={18} />
                </button>
              );
            }
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleNumClick(val)}
                className="h-13 rounded-2xl bg-[#16181b] border border-white/10 hover:border-purple-500/60 hover:bg-white/10 text-white text-xl font-bold transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              >
                {val}
              </button>
            );
          })}
        </div>

        {/* Footer Row */}
        <div className="pt-4 border-t border-white/10 w-full flex items-center justify-between text-xs text-gray-400 mt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-xs font-bold cursor-pointer"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
          <span className="text-[11px] text-gray-500 font-medium">กดคีย์บอร์ด 0-9 ได้</span>
        </div>
      </motion.div>
    </div>
  );
}
