
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  savedPin: string | null;
  onSetPin: (pin: string) => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ isLocked, onUnlock, savedPin, onSetPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(!savedPin);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>( 'enter');

  useEffect(() => {
    if (pin.length === 4) {
      if (isSettingPin) {
        if (step === 'enter') {
          setStep('confirm');
          setPin('');
        } else {
          if (pin === confirmPin) {
            onSetPin(pin);
            onUnlock();
          } else {
            setError(true);
            setTimeout(() => {
              setError(false);
              setPin('');
              setStep('enter');
              setConfirmPin('');
            }, 1000);
          }
        }
      } else {
        if (pin === savedPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            setPin('');
          }, 1000);
        }
      }
    }
    if (step === 'confirm' && pin.length === 0 && confirmPin === '') {
        // This is just to store the first pin
    }
  }, [pin, isSettingPin, savedPin, onUnlock, step, confirmPin, onSetPin]);

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (isSettingPin && step === 'enter' && newPin.length === 4) {
            setConfirmPin(newPin);
        }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-[#090A0D] flex flex-col items-center justify-center p-8 backdrop-blur-3xl"
        >
          <div className="mb-12 text-center">
            <motion.div
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-6 mx-auto border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isSettingPin 
                ? (step === 'enter' ? 'Set Security PIN' : 'Confirm Your PIN')
                : 'Chronos Locked'}
            </h2>
            <p className="text-sm text-gray-400 mt-2 uppercase tracking-widest">
              {isSettingPin ? 'Create a 4-digit code' : 'Enter your access code'}
            </p>
          </div>

          <div className="flex gap-4 mb-16">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-white border-white scale-125 shadow-[0_0_15px_white]' 
                    : 'border-white/20'
                } ${error ? 'border-rose-500 bg-rose-500' : ''}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumber(num)}
                className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleNumber('0')}
              className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-20 h-20 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>

          {savedPin && (
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="mt-12 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity"
            >
              Forgot PIN? Reset App
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LockScreen;
