
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, DayData, MonthData } from './types';
import { MONTH_NAMES, COLORS } from './constants';
import TaskModal from './components/TaskModal';
import JSZip from 'jszip';

// Helper to get local YYYY-MM-DD string
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MOOD_OPTIONS = [
  { id: 'stressed', label: 'Stressed', aura: '#f43f5e', points: 16, scale: 0.75, innerRatio: 0.12, rounded: false }, // Thorny/Jagged
  { id: 'sad', label: 'Sad', aura: '#3b82f6', points: 4, scale: 0.8, innerRatio: 0.35, rounded: true },   // 4-Petal Flower
  { id: 'none', label: 'Neutral', aura: '#94a3b8', points: 10, scale: 0.85, innerRatio: 0.82, rounded: true }, // Opening/Soft
  { id: 'calm', label: 'Calm', aura: '#10b981', points: 22, scale: 0.9, innerRatio: 0.65, rounded: true },  // Blooming Petals
  { id: 'happy', label: 'Happy', aura: '#fde047', points: 38, scale: 1.0, innerRatio: 0.78, rounded: true },   // Full Radiant Bloom
  { id: 'energetic', label: 'Energetic', aura: '#fb923c', points: 64, scale: 1.1, innerRatio: 0.86, rounded: true }, // Cosmic Radiance
];

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan";

interface ThemeConfig {
  accentColor: string;
  backgroundPreset: string;
  showParticles: boolean;
  particleType: string;
  journalStyle: 'astral' | 'mono';
  showMoodStar: boolean;
  showResonance: boolean;
}

// --- Visual Components ---

const MapleLeafStream: React.FC<{ accentColor?: string }> = ({ accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const getColors = () => {
      if (accentColor?.includes('rose')) return ['#fb7185', '#e11d48', '#9f1239'];
      if (accentColor?.includes('emerald')) return ['#34d399', '#059669', '#064e3b'];
      if (accentColor?.includes('blue')) return ['#60a5fa', '#2563eb', '#1e3a8a'];
      return ['#fbbf24', '#f59e0b', '#ea580c', '#dc2626'];
    };

    const colors = getColors();
    const leafPath = new Path2D("M10 0 C12 5, 18 2, 20 8 C16 10, 25 15, 20 20 C18 18, 15 25, 10 20 C5 25, 2 18, 0 20 C-5 15, 4 10, 0 8 C2 2, 8 5, 10 0 Z");

    class Leaf {
      x: number; y: number; vY: number; swing: number; swingSpeed: number; 
      rotation: number; vRotation: number; size: number; color: string; opacity: number;

      constructor(initial: boolean = false) {
        this.x = 0; this.y = 0; this.vY = 0; this.swing = 0; this.swingSpeed = 0;
        this.rotation = 0; this.vRotation = 0; this.size = 0; this.color = ''; this.opacity = 0;
        this.reset(initial);
      }

      reset(initial: boolean = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : -50;
        this.vY = 0.5 + Math.random() * 1.2;
        this.swing = Math.random() * Math.PI * 2;
        this.swingSpeed = 0.01 + Math.random() * 0.02;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRotation = (Math.random() - 0.5) * 0.02;
        this.size = 0.4 + Math.random() * 0.8;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = 0.1 + Math.random() * 0.4;
      }

      update() {
        this.y += this.vY;
        this.x += Math.sin(this.swing) * 0.5;
        this.swing += this.swingSpeed;
        this.rotation += this.vRotation;
        if (this.y > canvas.height + 50) this.reset(false);
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.size, this.size);
        ctx.shadowBlur = 20; // Increased leaf glow
        ctx.shadowColor = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.fill(leafPath);
        ctx.restore();
      }
    }

    const leaves = Array.from({ length: 40 }, () => new Leaf(true));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves.forEach(l => { l.update(); l.draw(); });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, [accentColor]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

const StellarStream: React.FC<{ variant?: 'timeAware' | 'gold' | 'custom', accentColor?: string }> = ({ variant = 'timeAware', accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const getBaseColor = () => {
      if (variant === 'gold') return { h: 45, s: 95, l: 75 };
      if (variant === 'custom' && accentColor) {
          if (accentColor.includes('rose')) return { h: 345, s: 95, l: 80 };
          if (accentColor.includes('amber')) return { h: 38, s: 100, l: 70 };
          if (accentColor.includes('emerald')) return { h: 160, s: 90, l: 65 };
          if (accentColor.includes('indigo')) return { h: 235, s: 90, l: 80 };
          if (accentColor.includes('purple')) return { h: 270, s: 90, l: 80 };
          return { h: 210, s: 100, l: 75 };
      }
      const hour = new Date().getHours();
      return (hour >= 5 && hour < 12) ? { h: 38, s: 95, l: 75 } :
             (hour >= 12 && hour < 17) ? { h: 210, s: 100, l: 70 } :
             (hour >= 17 && hour < 21) ? { h: 245, s: 85, l: 80 } :
             { h: 280, s: 80, l: 70 };
    };

    const color = getBaseColor();

    class Meteor {
      x: number; y: number; speed: number; length: number; width: number; opacity: number;
      constructor(initial: boolean = false) {
        this.x = 0; this.y = 0; this.speed = 0; this.length = 0; this.width = 0; this.opacity = 0;
        this.reset(initial);
      }
      reset(initialLoad: boolean = false) {
        const overscanX = 400; const overscanY = 400;
        if (initialLoad) {
          this.x = Math.random() * (canvas.width + overscanX);
          this.y = Math.random() * (canvas.height + overscanY) - overscanY;
        } else {
          if (Math.random() > 0.4) {
            this.x = Math.random() * (canvas.width + overscanX);
            this.y = -Math.random() * overscanY - 50;
          } else {
            this.x = canvas.width + Math.random() * overscanX;
            this.y = Math.random() * canvas.height - overscanY;
          }
        }
        this.speed = 0.8 + Math.random() * 2.5;
        this.length = 120 + Math.random() * 280;
        this.width = 1.2 + Math.random() * 1.8; // Wider meteors
        this.opacity = 0.25 + Math.random() * 0.45; // Higher opacity
      }
      update() {
        this.x -= this.speed * 1.2; this.y += this.speed;
        if (this.y > canvas.height + 200 || this.x < -400) this.reset(false);
      }
      draw() {
        const tailX = this.x + (this.length * 0.9);
        const tailY = this.y - this.length;
        const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`);
        gradient.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${this.opacity})`);
        ctx.beginPath(); ctx.strokeStyle = gradient; ctx.lineWidth = this.width; ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y); ctx.lineTo(tailX, tailY); ctx.stroke();
        if (this.opacity > 0.2) {
          ctx.beginPath();
          const headGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 6); // Larger head glow
          headGrad.addColorStop(0, `hsla(${color.h}, ${color.s}%, 100%, ${this.opacity})`);
          headGrad.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0)`);
          ctx.fillStyle = headGrad; ctx.arc(this.x, this.y, 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const meteors = Array.from({ length: 60 }, () => new Meteor(true));
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'screen';
      meteors.forEach(m => { m.update(); m.draw(); });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, [variant, accentColor]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

const MoodStar: React.FC<{ moodId: string, isReadOnly: boolean, onMoodSelect: (id: string) => void, minimal?: boolean }> = ({ moodId, isReadOnly, onMoodSelect, minimal = false }) => {
  const currentMood = MOOD_OPTIONS.find(m => m.id === moodId) || MOOD_OPTIONS[2];
  const containerRef = useRef<HTMLDivElement>(null);
  
  const generateStarPath = (points: number, outerRadius: number, innerRatio: number, rounded: boolean) => {
    const innerRadius = outerRadius * innerRatio; 
    const centerX = 150; 
    const centerY = 150; 
    let path = "";
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / points) * i;
      const x = centerX + radius * Math.cos(angle); 
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        path += `M ${x},${y}`;
      } else if (rounded) {
        const prevAngle = (Math.PI / points) * (i - 1); 
        const prevRadius = (i - 1) % 2 === 0 ? outerRadius : innerRadius;
        const bulge = 1.05 + (1 - innerRatio) * 0.15;
        const cpX = centerX + ((radius + prevRadius) / 2) * Math.cos((angle + prevAngle) / 2) * bulge;
        const cpY = centerY + ((radius + prevRadius) / 2) * Math.sin((angle + prevAngle) / 2) * bulge;
        path += ` Q ${cpX},${cpY} ${x},${y}`;
      } else {
        path += ` L ${x},${y}`;
      }
    }
    return path + " Z";
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isReadOnly || minimal) return;
    const currentIndex = MOOD_OPTIONS.findIndex(m => m.id === moodId);
    const nextIndex = (currentIndex + 1) % MOOD_OPTIONS.length;
    onMoodSelect(MOOD_OPTIONS[nextIndex].id);
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible transition-transform duration-300 ${isReadOnly ? 'pointer-events-none' : 'cursor-pointer active:scale-90 hover:scale-[1.05]'}`}
    >
      <div className="relative w-full h-full flex items-center justify-center transition-all duration-700 overflow-visible" style={{ transform: `scale(${currentMood.scale})` }}>
        <svg viewBox="0 0 300 300" className="w-full h-full absolute overflow-visible drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] pointer-events-none">
          <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: currentMood.aura, stopOpacity: 0.95 }} />
              <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          <path d={generateStarPath(currentMood.points, 120, currentMood.innerRatio, currentMood.rounded)} fill="url(#moodGradient)" className="animate-mood-spin-slow opacity-25" />
          <path d={generateStarPath(currentMood.points, 105, currentMood.innerRatio, currentMood.rounded)} fill="url(#moodGradient)" className="animate-mood-spin-reverse opacity-45" />
          <path d={generateStarPath(currentMood.points, 90, currentMood.innerRatio, currentMood.rounded)} fill="url(#moodGradient)" className="animate-mood-spin opacity-80" />
          <circle cx="150" cy="150" r="25" fill="white" className="opacity-25 blur-2xl animate-pulse" />
        </svg>
        {!minimal && (
          <div className="z-10 text-center pointer-events-none flex flex-col items-center">
            <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.6)] leading-none">{currentMood.label}</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const AethericResonance: React.FC<{ aura: string, moodId: string }> = ({ aura, moodId }) => {
  const pulseDuration = useMemo(() => {
    if (moodId === 'stressed') return '1.5s';
    if (moodId === 'energetic') return '3s';
    if (moodId === 'happy') return '5s';
    if (moodId === 'sad') return '12s';
    return '8s';
  }, [moodId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
      <style>{`
        @keyframes aether-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; filter: blur(60px); }
          50% { transform: scale(1.8); opacity: 0.45; filter: blur(80px); }
        }
      `}</style>
      <div 
        className="w-[90%] aspect-square rounded-full mix-blend-screen transition-all duration-1000"
        style={{ 
          background: `radial-gradient(circle, ${aura} 0%, transparent 80%)`,
          animation: `aether-pulse ${pulseDuration} ease-in-out infinite` 
        }} 
      />
    </div>
  );
};

// --- View Components ---

const DashboardView: React.FC<{ 
  selectedDate: Date, selectedDateKey: string, tasks: Record<string, Task[]>, setView: (v: any) => void, toggleTaskCompletion: (d: string, id: string) => void, isReadOnly: boolean, onBackToToday: () => void, profileImage: string, userName: string, theme: ThemeConfig
}> = ({ selectedDate, selectedDateKey, tasks, setView, toggleTaskCompletion, isReadOnly, onBackToToday, profileImage, userName, theme }) => {
  const dayTasks = [...(tasks[selectedDateKey] || [])].sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1);
  const dateDisplay = selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const accentBase = theme.accentColor.split(' ')[0].replace('bg-', 'text-');
  const accentBg = theme.accentColor.split(' ')[0];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32 no-scrollbar animate-in fade-in duration-500 bg-transparent relative">
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="custom" accentColor={theme.accentColor} />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div onClick={() => setView('settings')} className={`relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${accentBg} to-black/40 p-0.5 shadow-[0_0_40px_rgba(0,0,0,0.7)] cursor-pointer hover:scale-105 active:scale-95 transition-all`}>
            {/* Enhanced Profile Glow Effect */}
            <div className={`absolute -inset-8 ${accentBg} opacity-50 blur-[60px] animate-pulse rounded-full pointer-events-none`}></div>
            <div className="relative w-full h-full bg-[#0F1014] rounded-[22px] flex items-center justify-center overflow-hidden z-10 shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]">
               <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="cursor-pointer" onClick={() => setView('settings')}><p className={`text-[10px] font-black ${accentBase} opacity-70 tracking-[0.3em] uppercase`}>Good Day</p><h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{userName}</h1></div>
        </div>
        {!isToday && <button onClick={onBackToToday} className={`px-4 py-2 ${theme.accentColor.split(' ')[0]}/40 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md active:scale-95 transition-all`}>Back to Today</button>}
      </div>
      <div className="space-y-1 relative z-10">
        {isReadOnly && <div className="flex items-center gap-2 mb-1 opacity-80 text-white/80"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span className="text-[9px] font-black uppercase tracking-widest">Archive Locked</span></div>}
        <h2 className="text-lg font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{dateDisplay}</h2>
      </div>
      <div className="space-y-6 relative z-10">
        <div className="flex justify-between items-center"><h2 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">{isToday ? 'Upcoming Today' : 'Task History'}</h2><span className={`text-[10px] font-black uppercase ${accentBase} tracking-[0.2em] cursor-pointer hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`} onClick={() => setView('calendar')}>Switch Date</span></div>
        <div className="space-y-4">
          {dayTasks.length ? dayTasks.map(task => (
            <div key={task.id} className={`p-6 rounded-[2.5rem] flex items-center justify-between group transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden border border-white/20 backdrop-blur-md ${task.color.split(' ')[0]} ${task.completed ? 'opacity-50 grayscale-[0.2]' : ''} ${isReadOnly ? 'grayscale-[0.4] opacity-80 cursor-default' : 'hover:brightness-110 cursor-pointer active:scale-[0.98]'}`} onClick={() => !isReadOnly && toggleTaskCompletion(selectedDateKey, task.id)}>
              <div className="flex items-center gap-4 z-10"><div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-white border-white' : 'border-white group-hover:border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'}`}>{task.completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div><div className="space-y-0.5"><h3 className={`font-bold text-white text-base transition-all ${task.completed ? 'line-through opacity-70' : 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`}>{task.title}</h3><div className="flex items-center gap-2"><span className={`text-[10px] font-bold uppercase tracking-widest ${task.completed ? 'text-white/70' : 'text-white'}`}>{task.startTime} • {task.duration} mins</span></div></div></div>
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center text-xl z-10 backdrop-blur-sm border border-white/30 shadow-inner group-hover:scale-110 transition-transform">{task.icon}</div>
            </div>
          )) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-300 bg-white/[0.04] border border-dashed border-white/30 rounded-[2.5rem]"><svg className="mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20m10-10H2"/></svg><p className="text-xs font-bold uppercase tracking-widest opacity-60">No activities recorded</p></div>
          )}
        </div>
      </div>
      {isReadOnly && <div className="p-6 bg-amber-500/20 border border-amber-500/30 rounded-3xl flex items-center gap-4 text-amber-300 backdrop-blur-md relative z-10 shadow-[0_0_40px_rgba(245,158,11,0.2)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p className="text-[10px] font-black uppercase tracking-widest leading-tight">History is read-only. Editing capabilities are locked.</p></div>}
    </div>
  );
};

const ToggleSwitch: React.FC<{ active: boolean, onChange: (v: boolean) => void, colorClass?: string }> = ({ active, onChange, colorClass = "bg-blue-600" }) => (
  <button onClick={() => onChange(!active)} className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${active ? `${colorClass} shadow-[0_0_20px_rgba(255,255,255,0.4)]` : 'bg-white/10 border border-white/5'}`}>
    <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${active ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SettingsViewComponent: React.FC<{ 
  setView: (v: any) => void, 
  profileImage: string, 
  onUpdateProfileImage: (img: string) => void,
  userName: string,
  onUpdateUserName: (name: string) => void,
  notificationSettings: { advance: boolean, boundaries: boolean },
  onUpdateNotifications: (s: { advance: boolean, boundaries: boolean }) => void,
  vibrationEnabled: boolean,
  onUpdateVibration: (v: boolean) => void,
  theme: ThemeConfig,
  onExport: () => void,
  onImport: () => void
}> = ({ setView, profileImage, onUpdateProfileImage, userName, onUpdateUserName, notificationSettings, onUpdateNotifications, vibrationEnabled, onUpdateVibration, theme, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentBase = theme.accentColor.split(' ')[0].replace('bg-', 'text-');
  const accentBg = theme.accentColor.split(' ')[0];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onUpdateProfileImage(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const requestNotifs = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8 space-y-8 animate-in slide-in-from-bottom-10 duration-500 overflow-y-auto no-scrollbar pb-40 relative">
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="custom" accentColor={theme.accentColor} />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      
      <div className={`absolute top-0 inset-x-0 h-[60%] bg-gradient-to-b ${accentBg}/20 to-transparent pointer-events-none blur-[100px] z-0`} />

      <div className="w-full flex items-center justify-between relative z-10">
        <button onClick={() => setView('home')} className="p-3 bg-white/10 rounded-full text-gray-200 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Application Settings</h2>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md space-y-12 relative z-10">
        <div className="relative p-10 bg-white/[0.05] border border-white/20 rounded-[3rem] overflow-hidden backdrop-blur-3xl flex flex-col items-center text-center space-y-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
           <div className={`absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b ${accentBg}/30 to-transparent pointer-events-none`} />
           <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className={`absolute -inset-10 ${accentBg} opacity-50 blur-[70px] rounded-full animate-pulse transition-opacity group-hover:opacity-70`} />
              <div className={`relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-white/40 group-hover:border-white transition-all shadow-[0_0_50px_rgba(0,0,0,0.8)]`}>
                 <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                 </div>
              </div>
           </div>
           <div className="space-y-2 w-full px-4">
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => onUpdateUserName(e.target.value)} 
                className={`w-full bg-transparent border-b border-white/30 text-3xl font-bold text-white text-center outline-none focus:border-white/60 transition-colors py-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]`}
                placeholder="Your Name"
              />
              <p className={`text-[10px] font-black ${accentBase} opacity-70 uppercase tracking-[0.4em] drop-shadow-sm`}>Premium Identity</p>
           </div>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
        </div>

        <div className="space-y-4">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase drop-shadow-sm`}>Style & Aesthetics</label>
          <button 
            onClick={() => setView('theme')}
            className="w-full flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md hover:bg-white/[0.1] transition-all group shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accentBg} to-indigo-700 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-base drop-shadow-sm">Theme Customization</h3>
                <p className="text-xs text-gray-400">Accent colors, particles & journal styles</p>
              </div>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 group-hover:text-white transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase drop-shadow-sm`}>Data & Privacy</label>
          <div className="grid gap-4">
            <button 
              onClick={onExport}
              className="w-full flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md hover:bg-white/[0.1] transition-all group shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accentBg} to-blue-900 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-base drop-shadow-sm">Export Workspace</h3>
                  <p className="text-xs text-gray-400">Download ZIP of all tasks & memories</p>
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 group-hover:text-white transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button 
              onClick={onImport}
              className="w-full flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md hover:bg-white/[0.1] transition-all group shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-900 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-base drop-shadow-sm">Import Workspace</h3>
                  <p className="text-xs text-gray-400">Restore from a previous backup file</p>
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 group-hover:text-white transition-colors"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] uppercase drop-shadow-sm`}>Intelligence (AI)</label>
            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
              <button onClick={requestNotifs} className="text-[9px] font-bold text-amber-400 underline">Request Permissions</button>
            )}
          </div>
          <div className="grid gap-4">
             <div className="flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md shadow-lg hover:border-white/20 transition-all">
                <div className="space-y-1">
                   <h3 className="font-bold text-white text-base drop-shadow-sm">Advance Reminders</h3>
                   <p className="text-xs text-gray-400">15m and 5m alerts before start/end.</p>
                </div>
                <ToggleSwitch colorClass={accentBg} active={notificationSettings.advance} onChange={(v) => onUpdateNotifications({...notificationSettings, advance: v})} />
             </div>
             <div className="flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md shadow-lg hover:border-white/20 transition-all">
                <div className="space-y-1">
                   <h3 className="font-bold text-white text-base drop-shadow-sm">Event Boundary Alerts</h3>
                   <p className="text-xs text-gray-400">Notify exactly at start and end times.</p>
                </div>
                <ToggleSwitch colorClass={accentBg} active={notificationSettings.boundaries} onChange={(v) => onUpdateNotifications({...notificationSettings, boundaries: v})} />
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase drop-shadow-sm`}>Sensory Engine</label>
          <div className="grid gap-4">
             <div className="flex items-center justify-between p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md shadow-lg hover:border-white/20 transition-all">
                <div className="space-y-1">
                   <h3 className="font-bold text-white text-base drop-shadow-sm">Haptic Feedback</h3>
                   <p className="text-xs text-gray-400">Vibrate for 5s at task boundaries.</p>
                </div>
                <ToggleSwitch colorClass={accentBg} active={vibrationEnabled} onChange={onUpdateVibration} />
             </div>
          </div>
        </div>

        <div className="pt-8">
           <button 
             onClick={() => { localStorage.clear(); window.location.reload(); }}
             className="w-full py-6 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-3xl text-rose-500 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(244,63,94,0.15)]"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             Secure Sign Out
           </button>
        </div>
      </div>
    </div>
  );
};

const ThemeViewComponent: React.FC<{
  setView: (v: any) => void,
  theme: ThemeConfig,
  onUpdateTheme: (newTheme: ThemeConfig) => void
}> = ({ setView, theme, onUpdateTheme }) => {
  const accentBase = theme.accentColor.split(' ')[0].replace('bg-', 'text-');
  const accentBg = theme.accentColor.split(' ')[0];

  const presets = [
    { id: 'midnight', label: 'Midnight', bg: 'radial-gradient(circle at 50% 0%, #161821 0%, #090A0D 100%)' },
    { id: 'cosmic', label: 'Cosmic', bg: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)' },
    { id: 'obsidian', label: 'Obsidian', bg: '#000000' }
  ];

  const particleTypes = [
    { id: 'meteors', label: 'Stellar Stream', icon: '✨' },
    { id: 'leaves', label: 'Dream cloud', icon: '☁️' }
  ];

  const journalStyles = [
    { id: 'astral', label: 'Astral Glass', desc: 'Luminous translucent aesthetic' },
    { id: 'mono', label: 'Deep Ink', desc: 'Pure minimal dark mode' }
  ];

  return (
    <div className="flex-1 flex flex-col items-center p-8 space-y-10 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-40 relative">
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="custom" accentColor={theme.accentColor} />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      <div className="w-full flex items-center justify-between relative z-10">
        <button onClick={() => setView('settings')} className="p-3 bg-white/10 rounded-full text-gray-200 hover:text-white transition-all shadow-md">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">Theme & Aesthetics</h2>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md space-y-12 relative z-10">
        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Accent Palette</label>
          <div className="grid grid-cols-3 gap-6">
            {COLORS.map((color, idx) => (
              <button 
                key={idx} 
                onClick={() => onUpdateTheme({ ...theme, accentColor: color })}
                className={`relative aspect-square rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${color.split(' ')[0]} ${theme.accentColor === color ? 'border-white scale-110 shadow-[0_0_50px_rgba(255,255,255,0.6)]' : 'border-transparent opacity-60 hover:opacity-100 shadow-xl'}`}
              >
                {theme.accentColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Journal Aesthetic</label>
          <div className="grid gap-4">
            {journalStyles.map((style) => (
              <button 
                key={style.id}
                onClick={() => onUpdateTheme({ ...theme, journalStyle: style.id as any })}
                className={`w-full p-6 rounded-3xl border transition-all flex flex-col items-start gap-1 group ${theme.journalStyle === style.id ? 'border-white/50 bg-white/15 shadow-2xl scale-[1.02]' : 'border-white/5 bg-white/[0.03] hover:border-white/25'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-bold text-lg ${theme.journalStyle === style.id ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'text-gray-400 group-hover:text-gray-200'}`}>{style.label}</span>
                  {theme.journalStyle === style.id && (
                    <div className={`w-5 h-5 rounded-full ${accentBg} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]`}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400 uppercase tracking-widest">{style.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Journal Dynamic Effects</label>
          <div className="space-y-4">
            <div className="p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                 <h3 className="font-bold text-white text-base drop-shadow-sm">Mood Star Aura</h3>
                 <p className="text-xs text-gray-400">Growth of the Heart visualization</p>
              </div>
              <ToggleSwitch colorClass={accentBg} active={theme.showMoodStar} onChange={(v) => onUpdateTheme({ ...theme, showMoodStar: v })} />
            </div>
            <div className="p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                 <h3 className="font-bold text-white text-base drop-shadow-sm">Aetheric Resonance</h3>
                 <p className="text-xs text-gray-400">Emotional pulse engine</p>
              </div>
              <ToggleSwitch colorClass={accentBg} active={theme.showResonance} onChange={(v) => onUpdateTheme({ ...theme, showResonance: v })} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Environment</label>
          <div className="space-y-4">
            {presets.map((preset) => (
              <button 
                key={preset.id}
                onClick={() => onUpdateTheme({ ...theme, backgroundPreset: preset.id })}
                className={`w-full p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group ${theme.backgroundPreset === preset.id ? 'border-white/50 bg-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' : 'border-white/5 bg-white/[0.03] hover:border-white/25'}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl border border-white/25 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" style={{ background: preset.bg }}>
                     <div className="w-full h-full bg-gradient-to-br from-white/15 to-transparent" />
                  </div>
                  <span className={`font-bold text-lg ${theme.backgroundPreset === preset.id ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-gray-400 group-hover:text-gray-200'}`}>{preset.label}</span>
                </div>
                {theme.backgroundPreset === preset.id && (
                  <div className={`w-6 h-6 rounded-full ${accentBg} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <label className={`text-[11px] font-black ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Atmospheric Effects</label>
          <div className="space-y-4">
            <div className="p-7 bg-white/[0.05] border border-white/10 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                 <h3 className="font-bold text-white text-base drop-shadow-sm">Enable Particles</h3>
                 <p className="text-xs text-gray-400">Atmospheric background engine</p>
              </div>
              <ToggleSwitch colorClass={accentBg} active={theme.showParticles} onChange={(v) => onUpdateTheme({ ...theme, showParticles: v })} />
            </div>
            
            {theme.showParticles && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {particleTypes.map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => onUpdateTheme({ ...theme, particleType: type.id })}
                    className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3 shadow-xl ${theme.particleType === type.id ? 'bg-white/20 border-white/60 shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-[1.05]' : 'bg-white/[0.02] border-white/10 hover:border-white/30'}`}
                  >
                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{type.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme.particleType === type.id ? 'text-white drop-shadow-sm' : 'text-gray-400'}`}>{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarListView: React.FC<{
  scrollContainerRef: React.RefObject<HTMLDivElement | null>, todayRef: React.RefObject<HTMLDivElement | null>, selectedYear: number, setSelectedYear: (y: number) => void, months: MonthData[], tasks: Record<string, Task[]>, moods: Record<string, string>, onDateSelect: (d: Date) => void, onAddTask: (d: Date) => void, scrollToToday: (b?: ScrollBehavior) => void, isPastDate: (d: Date) => boolean, theme: ThemeConfig, mode: 'normal' | 'mood', setMode: (m: 'normal' | 'mood') => void
}> = ({ scrollContainerRef, todayRef, selectedYear, setSelectedYear, months, tasks, moods, onDateSelect, onAddTask, scrollToToday, isPastDate, theme, mode, setMode }) => {
  const years = [2024, 2025, 2026, 2027]; const [isMenuOpen, setIsMenuOpen] = useState(false);
  const accentBg = theme.accentColor.split(' ')[0];
  const accentBase = accentBg.replace('bg-', 'text-');

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 scroll-smooth no-scrollbar pb-32 animate-in slide-in-from-right-10 duration-500 relative">
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="custom" accentColor={theme.accentColor} />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      <div className="pt-8 pb-4 flex flex-col gap-5 sticky top-0 z-30">
         <div className="flex items-center justify-between"><div className="relative"><button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-3 group"><h2 className={`text-3xl font-bold tracking-tighter group-hover:${accentBase} transition-colors text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`}>Calendar</h2><svg className={`text-gray-400 group-hover:${accentBase} transition-all ${isMenuOpen ? 'rotate-180' : ''}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg></button>
              {isMenuOpen && <div className="absolute top-full mt-2 left-0 w-56 bg-[#1A1B23]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-2 shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-[100] animate-in fade-in zoom-in-95 duration-200"><button onClick={() => { setMode('normal'); setIsMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${mode === 'normal' ? `${accentBg} text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]` : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}><span className="text-sm font-bold">Normal View</span>{mode === 'normal' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}</button><button onClick={() => { setMode('mood'); setIsMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${mode === 'mood' ? `${accentBg} text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]` : 'text-gray-200 hover:bg-white/10 hover:text-white'}`}><span className="text-sm font-bold">Mood View</span>{mode === 'mood' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}</button></div>}
            </div><button onClick={() => { setSelectedYear(new Date().getFullYear()); setTimeout(() => scrollToToday('smooth'), 50); }} className={`px-5 py-2 rounded-full ${accentBg}/45 ${accentBase} text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>Today</button></div>
         <div className="flex gap-2 p-1.5 bg-white/15 rounded-2xl border border-white/15 self-start backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">{years.map(y => (<button key={y} onClick={() => setSelectedYear(y)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === y ? `${accentBg} text-white shadow-[0_0_20px_rgba(255,255,255,0.25)] scale-[1.05]` : 'text-gray-300 hover:text-white'}`}>{y}</button>))}</div>
      </div>
      {months.map((m) => (
        <React.Fragment key={`${m.year}-${m.month}`}><div className="py-8"><h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/90 leading-none text-center relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{MONTH_NAMES[m.month]} {m.year}</h2></div><div className="space-y-4 relative z-10">{m.days.map((day, dIdx) => {
              const dateKey = formatDateKey(day.date); const dayTasks = tasks[dateKey] || []; const dayMoodId = moods[dateKey]; const moodData = dayMoodId ? MOOD_OPTIONS.find(mo => mo.id === dayMoodId) : null; const isPast = isPastDate(day.date); const isToday = day.isToday; const isMoodView = mode === 'mood'; const moodColor = moodData?.aura || '#ffffff';
              const cardStyles: React.CSSProperties = isMoodView && dayMoodId ? { background: 'transparent', borderColor: isToday ? `${moodColor}` : `${moodColor}60`, boxShadow: `0 0 60px ${moodColor}30, inset 0 0 20px ${moodColor}20`, borderWidth: '2.5px' } : {};
              return (
                <div key={dIdx} ref={isToday ? todayRef : null} className={`relative flex items-center p-6 rounded-[2.5rem] border transition-all duration-700 transform group backdrop-blur-md ${isToday && !isMoodView ? `${accentBg} border-white/60 shadow-[0_0_60px_rgba(0,0,0,0.7)] text-white z-10 scale-[1.02]` : (isPast ? 'bg-white/[0.02] border-white/10 opacity-40 grayscale-[0.5]' : 'bg-white/[0.1] border-white/25 hover:border-white/60 text-gray-100 shadow-2xl')}`} style={cardStyles}>
                  <div onClick={() => onDateSelect(day.date)} className="flex-1 flex items-center cursor-pointer">
                    <div className="flex flex-col items-center justify-center min-w-[50px] mr-6 tabular-nums">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isToday && !isMoodView ? 'text-white drop-shadow-md' : 'text-gray-400'}`}>{day.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      <span className={`text-3xl font-bold ${isToday && !isMoodView ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'text-white'}`} style={isMoodView && dayMoodId ? { color: moodColor, textShadow: `0 0 20px ${moodColor}B0` } : {}}>{day.date.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      {isMoodView && dayMoodId ? (
                        <div className="flex items-center gap-4">
                          <div className="relative"><div className="absolute inset-0 bg-white/40 blur-2xl animate-pulse" /><div className="w-1.5 h-8 rounded-full shadow-[0_0_25px_white] relative z-10" style={{ backgroundColor: moodColor }} /></div>
                          <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Frequency State</span><span className="text-base font-black tracking-widest italic" style={{ color: '#fff', textShadow: `0 0 15px ${moodColor}, 0 0 30px ${moodColor}, 0 0 45px ${moodColor}B0`, filter: 'brightness(2.0)' }}>{moodData?.label}</span></div>
                        </div>
                      ) : (
                        dayTasks.length > 0 ? (
                          <div className="flex gap-2 overflow-hidden max-w-full">
                            {dayTasks.slice(0, 3).map((t, i) => (<div key={i} className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-sm backdrop-blur-sm ${isToday && !isMoodView ? 'bg-white/50 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] border border-white/40' : 'bg-white/20 border border-white/30 shadow-lg scale-105'}`}>{t.icon}</div>))}
                            {dayTasks.length > 3 && <div className={`text-[10px] font-black flex items-center ml-2 ${isToday ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-200'}`}>+{dayTasks.length - 3}</div>}
                          </div>
                        ) : (<div className={`text-sm font-medium italic ${isToday && !isMoodView ? 'text-white drop-shadow-sm' : 'text-gray-400'}`}>{isPast ? 'Activity Logged' : 'No activity recorded'}</div>)
                      )}
                    </div>
                  </div>
                  {!isPast && (<button onClick={() => onAddTask(day.date)} className={`ml-4 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 border-2 ${isToday && !isMoodView ? 'bg-white/45 border-white/70 text-white backdrop-blur-xl shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'bg-white/30 border-white/50 text-gray-100 hover:text-white shadow-[0_0_20px_rgba(0,0,0,0.4)]'}`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>)}
                  {isToday && isMoodView && (<div className="absolute -top-1.5 -right-1.5"><div className={`w-4 h-4 rounded-full ${moodColor === '#ffffff' ? accentBg : ''} animate-ping shadow-[0_0_20px_white]`} style={{ backgroundColor: moodColor }} /></div>)}
                </div>
              );
            })}</div></React.Fragment>
      ))}
    </div>
  );
};

const TimelineViewComponent: React.FC<{ 
  selectedDate: Date, 
  currentDayTasks: Task[], 
  selectedDateStr: string, 
  setView: (v: any) => void, 
  toggleTaskCompletion: (d: string, id: string) => void, 
  onAddTaskAtTime: (time: string) => void,
  isReadOnly: boolean,
  theme: ThemeConfig
}> = ({ selectedDate, currentDayTasks, selectedDateStr, setView, toggleTaskCompletion, onAddTaskAtTime, isReadOnly, theme }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const HOUR_HEIGHT = 120; // Pixels per hour
  const PX_PER_MIN = HOUR_HEIGHT / 60;
  const TIMELINE_START_HOUR = 0; // Show full 24h
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const accentBase = theme.accentColor.split(' ')[0].replace('bg-', 'text-');
  const accentBg = theme.accentColor.split(' ')[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const processedTasks = useMemo(() => {
    const sorted = [...currentDayTasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const columns: Task[][] = [];
    sorted.forEach(task => {
      let placed = false;
      const taskStart = timeToMinutes(task.startTime);
      for (let i = 0; i < columns.length; i++) {
        const lastInCol = columns[i][columns[i].length - 1];
        const lastEnd = timeToMinutes(lastInCol.startTime) + lastInCol.duration;
        if (taskStart >= lastEnd) { columns[i].push(task); placed = true; break; }
      }
      if (!placed) columns.push([task]);
    });
    return columns.flatMap((col, colIdx) => col.map(task => ({ ...task, colIdx, totalCols: columns.length })));
  }, [currentDayTasks]);

  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const nowMinutes = (currentTime.getHours() * 60) + currentTime.getMinutes();
  const nowTop = (nowMinutes - (TIMELINE_START_HOUR * 60)) * PX_PER_MIN;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-left-10 duration-500 relative">
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="custom" accentColor={theme.accentColor} />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      <style>{`
        @keyframes spine-shimmer { 0%, 100% { opacity: 0.85; filter: brightness(1.2); } 50% { opacity: 1; filter: brightness(2.0) drop-shadow(0 0 15px white); } }
        @keyframes sweep { 0% { left: -100%; opacity: 0; } 50% { opacity: 0.7; } 100% { left: 200%; opacity: 0; } }
        @keyframes breathe { 0%, 100% { box-shadow: 0 0 30px -5px rgba(255,255,255,0.3); } 50% { box-shadow: 0 0 55px 8px rgba(255,255,255,0.5); } }
        .animate-spine-shimmer { animation: spine-shimmer 2.0s ease-in-out infinite; }
        .group-hover\\:animate-sweep { animation: sweep 1.5s ease-in-out infinite; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
      `}</style>
      <div className="px-6 py-8 flex items-center justify-between shrink-0 bg-transparent z-20 relative">
        <div className="flex items-center gap-4">
           <button onClick={() => setView('calendar')} className="p-2.5 bg-white/25 rounded-full text-gray-100 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg></button>
           <h2 className="font-bold text-2xl tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">Timeline</h2>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-[10px] font-black uppercase tracking-widest ${accentBase} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}>{selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span className="text-sm font-bold text-gray-300 drop-shadow-sm">{selectedDate.getFullYear()}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar relative select-none z-10">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          <div className="absolute left-[70px] top-0 bottom-0 w-[2.5px] bg-white/30 z-0">
            <div className="absolute inset-0 w-full h-full bg-white/80 animate-spine-shimmer" />
            <div className="absolute -left-[3px] w-[8px] h-full bg-blue-100/50 blur-[3px] pointer-events-none" />
            {isToday && (<div className="absolute -left-2.5 w-6 h-6 rounded-full bg-white blur-lg opacity-100 animate-pulse z-40 shadow-[0_0_30px_white]" style={{ top: `${nowTop - 12}px` }} />)}
          </div>
          {HOURS.map(h => (
            <div key={h} className="absolute w-full flex items-start group" style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
              <div className="w-[60px] pr-4 flex flex-col items-end"><span className="text-[10px] font-black text-gray-100 uppercase tracking-widest drop-shadow-sm">{h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}</span></div>
              {!isReadOnly && (<div onClick={() => onAddTaskAtTime(`${String(h).padStart(2, '0')}:00`)} className={`flex-1 border-t border-white/25 h-full transition-colors hover:${accentBg}/20 cursor-crosshair group-hover:border-white/60`} />)}
              {isReadOnly && <div className="flex-1 border-t border-white/10 h-full opacity-20" />}
            </div>
          ))}
          <div className="ml-[72px] relative h-full pointer-events-none">
            {processedTasks.map(task => {
              const startMin = timeToMinutes(task.startTime);
              const top = (startMin - (TIMELINE_START_HOUR * 60)) * PX_PER_MIN;
              const height = Math.max(task.duration * PX_PER_MIN, 45);
              const width = 100 / task.totalCols;
              const left = task.colIdx * width;
              const isInProgress = isToday && nowMinutes >= startMin && nowMinutes <= (startMin + task.duration);
              return (
                <div key={task.id} className={`absolute p-1 transition-all duration-500 pointer-events-auto group ${task.completed ? 'opacity-60 grayscale-[0.2]' : ''}`} style={{ top: `${top}px`, height: `${height}px`, left: `${left}%`, width: `${width}%` }} onClick={() => !isReadOnly && toggleTaskCompletion(selectedDateStr, task.id)}>
                  <div className="absolute -left-4 top-[1.5rem] h-[2.5px] bg-gradient-to-r from-white to-transparent opacity-80 transition-all duration-300 group-hover:w-10 group-hover:opacity-100 group-hover:from-white group-hover:shadow-[0_0_20px_white]" style={{ width: '18px' }} />
                  <div className={`w-full h-full rounded-[1.5rem] p-4 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/45 backdrop-blur-md overflow-hidden relative group-hover:brightness-110 group-hover:scale-[1.04] group-hover:-translate-y-1 transition-all duration-500 ${task.color.split(' ')[0]} ${isInProgress && !task.completed ? 'animate-breathe shadow-[0_0_40px_rgba(255,255,255,0.35)]' : ''}`}>
                    <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[35deg] pointer-events-none opacity-0 group-hover:animate-sweep" />
                    <div className="flex justify-between items-start gap-2 relative z-10">
                      <div className="overflow-hidden"><h3 className={`font-bold text-white text-sm leading-tight truncate drop-shadow-sm ${task.completed ? 'line-through' : ''}`}>{task.title}</h3><p className="text-[9px] font-bold text-white uppercase tracking-widest mt-0.5 opacity-95 drop-shadow-sm">{task.startTime} • {task.duration}m</p></div>
                      <span className="text-xl shrink-0 drop-shadow-[0_0_12px_rgba(0,0,0,0.4)] group-hover:scale-135 transition-transform duration-500">{task.icon}</span>
                    </div>
                    {task.duration > 30 && (<div className="mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 relative z-10"><div className={`h-1.5 rounded-full bg-black/45 w-full overflow-hidden shadow-inner`}><div className={`h-full bg-white transition-all shadow-[0_0_15px_white]`} style={{ width: task.completed ? '100%' : '25%' }} /></div></div>)}
                  </div>
                </div>
              );
            })}
          </div>
          {isToday && nowTop > 0 && nowTop < (24 * HOUR_HEIGHT) && (
            <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none animate-in fade-in zoom-in duration-500" style={{ top: `${nowTop}px` }}>
               <div className="w-[60px] pr-4 flex justify-end"><span className="px-2 py-1 rounded-md bg-rose-500 text-[9px] font-black text-white uppercase shadow-[0_0_35px_rgba(244,63,94,0.7)] border border-white/40">Now</span></div>
               <div className="relative flex-1"><div className="h-[4.5px] w-full bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,1)]" /><div className="absolute left-0 -top-[8px] w-[20px] h-[20px] rounded-full bg-rose-500 border-2 border-white shadow-[0_0_20px_rgba(244,63,94,0.9)]" /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GoalViewComponent: React.FC<{ goals: Record<string, string>, updateGoal: (t: string, v: string) => void, isReadOnly: boolean, theme: ThemeConfig }> = ({ goals, updateGoal, isReadOnly, theme }) => {
  const goalTypes = [
    { id: '1week', label: '1 Week Goal', icon: '🌱', color: 'from-emerald-400 to-teal-600', glow: 'rgba(52, 211, 153, 0.6)' },
    { id: '1month', label: '1 Month Goal', icon: '🌿', color: 'from-blue-400 to-indigo-600', glow: 'rgba(96, 165, 250, 0.6)' },
    { id: '6month', label: '6 Month Goal', icon: '🌳', color: 'from-purple-400 to-fuchsia-600', glow: 'rgba(192, 132, 252, 0.6)' },
    { id: '1year', label: '1 Year Goal', icon: '⛰️', color: 'from-amber-400 to-orange-600', glow: 'rgba(251, 191, 36, 0.6)' }
  ];
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 p-6 space-y-8 no-scrollbar overflow-y-auto pb-32 bg-transparent relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-blue-600/15 blur-[160px] pointer-events-none z-0 rounded-full" />
      {theme.showParticles && theme.particleType === 'meteors' && <StellarStream variant="gold" />}
      {theme.showParticles && theme.particleType === 'leaves' && <MapleLeafStream accentColor={theme.accentColor} />}
      <div className="shrink-0 space-y-2 relative z-10">
        <h2 className="text-4xl font-bold tracking-tighter text-white drop-shadow-[0_0_45px_rgba(255,255,255,0.4)]">{isReadOnly ? 'Record of Goals' : 'Life Targets'}</h2>
        <p className="text-sm font-medium text-gray-200 uppercase tracking-[0.3em] opacity-90 drop-shadow-lg">{isReadOnly ? 'Historical Focus' : 'Define your path forward'}</p>
      </div>
      <div className="grid gap-6 relative z-10">
        {goalTypes.map((type) => (
          <div key={type.id} className="relative group">
            <div className={`absolute -inset-3 bg-gradient-to-r ${type.color} rounded-[2.5rem] blur-[40px] opacity-30 group-hover:opacity-50 transition duration-1000`}></div>
            <div className={`absolute -inset-1.5 bg-gradient-to-r ${type.color} rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-75 transition duration-700`}></div>
            <div className={`relative flex flex-col p-8 bg-white/[0.12] border border-white/25 rounded-[2.5rem] space-y-5 shadow-[0_20px_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl transition-all ${isReadOnly ? 'grayscale-[0.4] opacity-80' : 'group-hover:bg-white/[0.22] group-hover:border-white/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative"><div className="absolute inset-0 bg-white/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" /><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl border border-white/30 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-120 group-hover:rotate-6 transition-all duration-500 z-10 relative">{type.icon}</div></div>
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white transition-all duration-500 drop-shadow-md" style={{ textShadow: `0 0 25px ${type.glow}` }}>{type.label}</span>
                </div>
              </div>
              <textarea readOnly={isReadOnly} className={`w-full bg-transparent border-none p-0 text-lg font-medium outline-none placeholder:text-gray-400 resize-none h-24 transition-colors ${isReadOnly ? 'text-gray-300' : 'text-white focus:text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]'}`} placeholder={isReadOnly ? "No targets set for this period." : `What's your vision for ${type.label.toLowerCase()}?`} value={goals[type.id] || ''} onChange={(e) => updateGoal(type.id, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AudioPlayer: React.FC<{ src: string, onDelete?: () => void, isReadOnly: boolean, accentColor?: string }> = ({ src, onDelete, isReadOnly, accentColor = "bg-blue-600" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const smoothedAmplitude = useRef<number>(0.2);
  const amplitudeVelocity = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const idlePhase = useRef<number>(0);
  const ribbonCount = 12;
  const ribbonPhases = useRef<number[]>(Array.from({ length: ribbonCount }, () => Math.random() * 1000));
  const ribbonSpeeds = useRef<number[]>(Array.from({ length: ribbonCount }, () => 0.5 + Math.random() * 0.5));
  useEffect(() => { return () => { if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); if (audioCtxRef.current) audioCtxRef.current.close(); }; }, []);
  const drawVolumetricAura = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')!;
    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw); timeRef.current += 0.012; idlePhase.current += 0.001; let bass = 0, mids = 0, highs = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount); analyserRef.current.getByteFrequencyData(dataArray);
        const bEnd = Math.floor(dataArray.length * 0.1), mEnd = Math.floor(dataArray.length * 0.4);
        for (let i = 0; i < bEnd; i++) bass += dataArray[i];
        for (let i = bEnd; i < mEnd; i++) mids += dataArray[i];
        for (let i = mEnd; i < dataArray.length; i++) highs += dataArray[i];
        bass = (bass / bEnd) / 255; mids = (mids / (mEnd - bEnd)) / 255; highs = (highs / (dataArray.length - mEnd)) / 255;
      }
      const targetAmp = 0.2 + (Math.pow(mids, 1.2) * 5.5) + (bass * 0.6) + (Math.sin(idlePhase.current * 0.5) * 0.05);
      const isRising = targetAmp > smoothedAmplitude.current, springK = isRising ? 0.65 : 0.15, damping = isRising ? 0.7 : 0.95;
      const force = (targetAmp - smoothedAmplitude.current) * springK; amplitudeVelocity.current += force; amplitudeVelocity.current *= damping; smoothedAmplitude.current += amplitudeVelocity.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height); const width = canvas.width, centerY = canvas.height / 2;
      for (let r = 0; r < ribbonCount; r++) {
        const baseTime = timeRef.current, nR = r / ribbonCount, ribbonTime = baseTime + ribbonPhases.current[r], localSpeed = ribbonSpeeds.current[r], auraOffset = (nR - 0.5) * (canvas.height * 0.9) * smoothedAmplitude.current, parallax = ribbonTime * 0.8 * localSpeed;
        const drawPass = (pass: 'nebula' | 'core') => {
          ctx.beginPath(); ctx.globalCompositeOperation = 'screen'; let alpha, weight, blur;
          if (pass === 'nebula') { alpha = 0.015 * (1 - nR * 0.5); weight = 32; blur = 20; } else { alpha = 0.6 / (1 + r * 0.15); weight = 1.6; blur = 0; }
          const h = 200 + (r * 4) + (bass * 60), s = 85 + (highs * 15), l = 50 + (nR * 5) + (smoothedAmplitude.current * 20);
          const gradient = ctx.createLinearGradient(0, 0, width, 0); gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0)`); gradient.addColorStop(0.3, `hsla(${h}, ${s}%, ${l}%, ${alpha})`); gradient.addColorStop(0.7, `hsla(${h}, ${s}%, ${l}%, ${alpha})`); gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
          ctx.strokeStyle = gradient; ctx.lineWidth = weight; if (blur) ctx.filter = `blur(${blur}px)`;
          for (let x = 0; x <= width; x += 6) {
            const nX = x / width, window = Math.pow(Math.sin(nX * Math.PI), 1.5), staticCurve = Math.sin(nX * Math.PI * 0.7 + ribbonPhases.current[r] * 0.1) * 0.2, torsion = Math.sin(ribbonTime * 1.5 + nX * 3) * highs * 1.2, h1 = Math.sin(nX * Math.PI * 0.6 + parallax + torsion + staticCurve), h2 = Math.sin(nX * Math.PI * 1.4 - parallax * 0.5), amp = (smoothedAmplitude.current + 0.15) * (canvas.height * 0.6), yOffset = (h1 * 0.5 + h2 * 0.3) * amp * window, y = centerY + yOffset + auraOffset;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke(); ctx.filter = 'none';
        };
        drawPass('nebula'); drawPass('core');
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    draw();
  }, []);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); analyserRef.current = audioCtxRef.current.createAnalyser(); analyserRef.current.fftSize = 512; sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current); sourceRef.current.connect(analyserRef.current); analyserRef.current.connect(audioCtxRef.current.destination); }
    if (isPlaying) audioRef.current.pause(); else { if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };
  useEffect(() => { drawVolumetricAura(); return () => { if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current); }; }, [drawVolumetricAura]);
  return (<div className="flex items-center gap-4 bg-transparent border-none p-4 rounded-3xl group transition-all"><button onClick={togglePlay} className={`w-12 h-12 shrink-0 rounded-full ${accentColor} flex items-center justify-center text-white active:scale-90 transition-all shadow-lg z-10`}>{isPlaying ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>)}</button><div className="flex-1 h-24 flex flex-col justify-center gap-0.5 relative"><canvas ref={canvasRef} width={800} height={200} className="w-full h-24 opacity-100 pointer-events-none"/><p className="absolute bottom-0 left-2 text-[9px] font-black text-gray-200 uppercase tracking-widest leading-none">Voice Memory</p></div>{!isReadOnly && onDelete && (<button onClick={onDelete} className="p-2 text-gray-200 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 z-10"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>)}<audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" crossOrigin="anonymous" /></div>);
};

const JournalViewComponent: React.FC<{ 
  selectedDateStr: string, 
  currentMoodId: string, 
  setMoodForDate: (d: string, m: string) => void, 
  journalEntries: Record<string, string>, 
  updateJournalEntry: (d: string, t: string) => void, 
  currentImages: string[], 
  fileInputRef: React.RefObject<HTMLInputElement | null>, 
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  removeImage: (d: string, i: number, e: React.MouseEvent) => void, 
  currentAudios: string[], 
  addAudio: (d: string, a: string) => void, 
  removeAudio: (d: string, i: number) => void, 
  setPreviewImage: (i: string) => void, 
  isReadOnly: boolean,
  theme: ThemeConfig
}> = ({ selectedDateStr, currentMoodId, setMoodForDate, journalEntries, updateJournalEntry, currentImages, fileInputRef, handleImageUpload, removeImage, currentAudios, addAudio, removeAudio, setPreviewImage, isReadOnly, theme }) => {
  const currentMood = useMemo(() => MOOD_OPTIONS.find(m => m.id === currentMoodId) || MOOD_OPTIONS[2], [currentMoodId]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const accentBase = theme.accentColor.split(' ')[0].replace('bg-', 'text-');
  const accentBg = theme.accentColor.split(' ')[0];

  const getStyleClasses = useCallback(() => {
    switch (theme.journalStyle) {
      case 'mono': return {
        container: 'bg-black border-none shadow-none',
        card: 'bg-[#0a0a0a] border-white/5 rounded-none shadow-none',
        text: 'text-white/80 font-light tracking-wide',
        glow: 'hidden'
      };
      default: return {
        container: 'bg-white/[0.03] border-white/10 backdrop-blur-3xl',
        card: 'bg-white/[0.12] border-white/20 backdrop-blur-md rounded-[2.5rem]',
        text: 'text-white font-medium',
        glow: 'opacity-30'
      };
    }
  }, [theme.journalStyle]);

  const styles = getStyleClasses();

  const startRecording = async () => { 
    try { 
      if (!navigator.mediaDevices?.getUserMedia) return; 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); 
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'; 
      const mediaRecorder = new MediaRecorder(stream, { mimeType }); 
      mediaRecorderRef.current = mediaRecorder; 
      audioChunksRef.current = []; 
      mediaRecorder.ondataavailable = (event: any) => { if (event.data && (event.data as any).size > 0) audioChunksRef.current.push(event.data as Blob); }; 
      mediaRecorder.onstop = () => { 
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType }); 
        const reader = new FileReader(); reader.readAsDataURL(audioBlob); 
        reader.onloadend = () => { addAudio(selectedDateStr, reader.result as string); }; 
        stream.getTracks().forEach(track => track.stop()); 
      }; 
      mediaRecorder.start(); setIsRecording(true); 
    } catch (err) { console.error("Recording error:", err); } 
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-700 relative transition-all duration-1000 ${styles.container}`}>
      <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none z-0 ${styles.glow}`} style={{ backgroundColor: theme.journalStyle === 'mono' ? 'transparent' : currentMood.aura }} />
      {theme.showResonance && <AethericResonance aura={currentMood.aura} moodId={currentMoodId} />}
      {theme.showMoodStar && (
        <div className="absolute -top-16 -right-16 w-80 h-80 opacity-40 transition-all duration-1000 pointer-events-none z-0">
          <MoodStar moodId={currentMoodId} isReadOnly={isReadOnly} onMoodSelect={(id) => setMoodForDate(selectedDateStr, id)} minimal={true} />
        </div>
      )}
      <div className="px-6 py-8 shrink-0 relative z-10"><h2 className={`font-bold text-4xl tracking-tighter ${styles.text.split(' ')[0]}`} style={{ textShadow: `0 0 30px ${currentMood.aura}60` }}>Daily Journal</h2>{!isReadOnly && (<div className="w-full mt-4"><div className="relative h-12 flex flex-col justify-center"><div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-visible"><div className="absolute left-0 top-0 h-full transition-all duration-700 rounded-full shadow-[0_0_10px_white]" style={{ width: `${(MOOD_OPTIONS.findIndex(m => m.id === currentMoodId) / (MOOD_OPTIONS.length - 1)) * 100}%`, backgroundColor: currentMood.aura }} /><div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-0">{MOOD_OPTIONS.map((m) => (<button key={m.id} onClick={() => setMoodForDate(selectedDateStr, m.id)} className="relative z-10 w-8 h-8 flex items-center justify-center"><div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 border ${currentMoodId === m.id ? 'bg-white border-white scale-150 shadow-[0_0_15px_white]' : 'bg-transparent border-white/40 hover:border-white/70'}`} /></button>))}</div></div><div className="mt-8 self-start"><div className={`backdrop-blur-md px-5 py-2.5 rounded-full border shadow-xl flex items-center justify-center min-w-[100px] transition-all duration-500 ${currentMoodId === 'none' ? 'bg-white/40 border-white/50' : 'bg-white/20 border-white/20'}`}><span className="text-[11px] font-black uppercase tracking-[0.2em] drop-shadow-sm" style={{ color: currentMoodId === 'none' ? '#FFFFFF' : currentMood.aura, textShadow: currentMoodId === 'none' ? '0 0 10px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.5)' }}>{currentMood.label}</span></div></div></div></div>)}</div>
      <div className="flex-1 px-6 space-y-10 overflow-y-auto no-scrollbar pb-32 relative z-10 mt-6">
        <div className="space-y-4 relative group"><label className={`text-[11px] font-bold ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Audio Journal</label><div className="relative"><div className={`absolute -inset-0.5 rounded-[2.5rem] blur-md opacity-30 ${theme.journalStyle === 'mono' ? 'hidden' : ''}`} style={{ background: currentMood.aura }}></div><div className={`relative p-6 space-y-6 transition-all duration-1000 ${styles.card}`}>{!isReadOnly && (<button onClick={isRecording ? () => { mediaRecorderRef.current?.stop(); setIsRecording(false); } : startRecording} className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 border-2 ${isRecording ? 'bg-rose-500/30 border-rose-500 text-white animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.4)]' : 'bg-white/10 border-white/30 text-white hover:border-white/50'}`}><div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-rose-500 shadow-[0_0_12px_rose]' : 'bg-gray-400'}`} /><span className="text-[11px] font-black uppercase tracking-widest">{isRecording ? 'Stop Recording Memory...' : 'Tap to Capture Voice Journal'}</span></button>)}<div className="grid gap-4">{currentAudios.map((audio, idx) => (<AudioPlayer key={idx} src={audio} isReadOnly={isReadOnly} accentColor={accentBg} onDelete={() => removeAudio(selectedDateStr, idx)} />))}{currentAudios.length === 0 && (<div className="py-8 text-center text-gray-200 border border-dashed border-white/20 rounded-3xl bg-white/[0.04]"><p className="text-[10px] font-black uppercase tracking-widest opacity-60">No voice recordings preserved</p></div>)}</div></div></div></div>
        <div className="space-y-4 relative group"><label className={`text-[11px] font-bold ${accentBase} tracking-[0.4em] ml-2 uppercase`}>Day's Perspective</label><div className="relative"><div className={`absolute -inset-0.5 rounded-[2.5rem] blur-md opacity-30 ${theme.journalStyle === 'mono' ? 'hidden' : ''}`} style={{ background: currentMood.aura }}></div><div className={`relative p-2 overflow-hidden shadow-2xl transition-all duration-1000 ${styles.card}`}><textarea readOnly={isReadOnly} className={`w-full h-48 bg-transparent p-6 text-lg outline-none transition-all placeholder:text-gray-400 resize-none ${styles.text}`} placeholder={isReadOnly ? "No written perspective for this day." : "Transcribe your day into memory..."} value={journalEntries[selectedDateStr] || ''} onChange={(e) => updateJournalEntry(selectedDateStr, e.target.value)} /></div></div></div>
        <div className="space-y-4 pb-10 relative group"><div className="flex items-center justify-between ml-2"><label className={`text-[11px] font-bold ${accentBase} tracking-[0.4em] uppercase`}>Visual Records</label>{!isReadOnly && (<><button onClick={() => fileInputRef.current?.click()} className={`px-5 py-2 ${accentBg}/30 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg`}>Preserve Photo</button><input type="file" autoFocus={false} ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} /></>)}</div><div className="relative"><div className={`absolute -inset-0.5 rounded-[2.5rem] blur-md opacity-30 ${theme.journalStyle === 'mono' ? 'hidden' : ''}`} style={{ background: currentMood.aura }}></div><div className={`relative p-6 min-h-[160px] flex items-center justify-center transition-all duration-1000 ${styles.card}`}>{currentImages.length > 0 ? (<div className="grid grid-cols-2 gap-4 w-full">{currentImages.map((img, idx) => (<div key={idx} onClick={() => setPreviewImage(img)} className={`relative aspect-square rounded-2xl overflow-hidden border border-white/30 cursor-pointer hover:scale-[1.03] transition-transform shadow-lg`}><img src={img} alt="" className="w-full h-full object-cover" />{!isReadOnly && (<button onClick={(e) => removeImage(selectedDateStr, idx, e)} className="absolute top-2 right-2 p-2 bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>)}</div>))}</div>) : (!isReadOnly ? (<button onClick={() => fileInputRef.current?.click()} className="w-full py-12 rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] flex flex-col items-center gap-4 group/btn"><div className="p-4 bg-white/20 rounded-2xl text-gray-100 group-hover/btn:text-white transition-colors shadow-inner"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div><p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Save a Moment</p></button>) : (<p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-center">No visual memories preserved</p>))}</div></div></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'goal' | 'calendar' | 'timeline' | 'journal' | 'profile' | 'settings' | 'theme'>('home');
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [journalEntries, setJournalEntries] = useState<Record<string, string>>({});
  const [journalImages, setJournalImages] = useState<Record<string, string[]>>({});
  const [journalAudios, setJournalAudios] = useState<Record<string, string[]>>({});
  const [goals, setGoals] = useState<Record<string, string>>({ '1week': '', '1month': '', '6month': '', '1year': '' });
  const [calendarMode, setCalendarMode] = useState<'normal' | 'mood'>('normal');

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    accentColor: COLORS[0],
    backgroundPreset: 'midnight',
    showParticles: true,
    particleType: 'meteors',
    journalStyle: 'astral',
    showMoodStar: true,
    showResonance: true
  });

  const [profileImage, setProfileImage] = useState<string>(DEFAULT_AVATAR);
  const [userName, setUserName] = useState<string>("Jordan N.");
  const [notifSettings, setNotifSettings] = useState({ advance: true, boundaries: true });
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState<MonthData[]>([]);
  const [forcedStartTime, setForcedStartTime] = useState<string | undefined>(undefined);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const todayAtMidnight = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const isPastDate = useCallback((date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d.getTime() < todayAtMidnight.getTime(); }, [todayAtMidnight]);
  const selectedDateStr = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const isReadOnly = useMemo(() => isPastDate(selectedDate), [selectedDate, isPastDate]);

  const generateMonthData = useCallback((month: number, year: number): MonthData => {
    const lastDay = new Date(year, month + 1, 0); const days: DayData[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i); days.push({ date: d, isCurrentMonth: true, isToday: d.toDateString() === new Date().toDateString(), tasks: [] });
    }
    return { month, year, days };
  }, []);

  const sentinels = useRef<Set<string>>(new Set());

  useEffect(() => {
    const yearMonths: MonthData[] = []; for (let i = 0; i < 12; i++) yearMonths.push(generateMonthData(i, selectedYear)); setMonths(yearMonths);
    const hydrate = (key: string, setter: Function) => {
      const val = localStorage.getItem(key);
      if (val) { try { setter(JSON.parse(val)); } catch (e) { setter(val); } }
    };
    hydrate('chronos_tasks', setTasks);
    hydrate('chronos_moods', setMoods);
    hydrate('chronos_journal', setJournalEntries);
    hydrate('chronos_journal_images', setJournalImages);
    hydrate('chronos_journal_audios', setJournalAudios);
    hydrate('chronos_goals', setGoals);
    hydrate('chronos_profile_image', setProfileImage);
    hydrate('chronos_user_name', setUserName);
    hydrate('chronos_notif_settings', setNotifSettings);
    hydrate('chronos_vibration_enabled', setVibrationEnabled);
    hydrate('chronos_theme_config', setThemeConfig);
    hydrate('chronos_calendar_mode', setCalendarMode);
  }, [selectedYear, generateMonthData]);

  useEffect(() => {
    const presets: Record<string, string> = {
        midnight: 'radial-gradient(circle at 50% 0%, #161821 0%, #090A0D 100%)',
        cosmic: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)',
        obsidian: '#000000'
    };
    document.body.style.background = presets[themeConfig.backgroundPreset] || presets.midnight;
    document.body.style.backgroundAttachment = 'fixed';
  }, [themeConfig.backgroundPreset]);

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date(); const dateKey = formatDateKey(now);
      const todayTasks = tasks[dateKey] || []; const currentMinutes = now.getHours() * 60 + now.getMinutes();
      todayTasks.forEach(task => {
        const [h, m] = task.startTime.split(':').map(Number);
        const startMins = h * 60 + m; const endMins = startMins + task.duration;
        const checkTime = (targetMins: number, label: string, isActual: boolean) => {
          const diff = targetMins - currentMinutes; const key = `${task.id}-${label}`;
          if (diff === 0 && !sentinels.current.has(key)) {
            sentinels.current.add(key);
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if ((isActual && notifSettings.boundaries) || (!isActual && notifSettings.advance)) {
                try { new Notification(`Chronos: ${task.title}`, { body: `${task.icon} ${label}`, icon: profileImage }); } catch (e) {}
              }
            }
            if (isActual && vibrationEnabled && 'vibrate' in navigator) { navigator.vibrate(5000); }
          }
        };
        checkTime(startMins - 15, "Starts in 15 minutes", false);
        checkTime(startMins - 5, "Starts in 5 minutes", false);
        checkTime(endMins - 15, "Ends in 15 minutes", false);
        checkTime(endMins - 5, "Ends in 5 minutes", false);
        checkTime(startMins, "Task starting now", true);
        checkTime(endMins, "Task completed", true);
      });
      if (sentinels.current.size > 100) sentinels.current.clear();
    };
    const timer = setInterval(checkAlerts, 30000);
    return () => clearInterval(timer);
  }, [tasks, notifSettings, vibrationEnabled, profileImage]);

  const scrollToToday = useCallback((behavior: ScrollBehavior = 'auto') => { if (todayRef.current) todayRef.current.scrollIntoView({ behavior, block: 'center' }); else if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: 0, behavior }); }, []);
  useEffect(() => { if (view === 'calendar' && months.length > 0) { const timer = setTimeout(() => scrollToToday('auto'), 100); return () => clearTimeout(timer); } }, [view, months.length, scrollToToday]);
  
  const handleBackToToday = useCallback(() => { const today = new Date(); setSelectedDate(today); setSelectedYear(today.getFullYear()); setView('home'); }, []);
  const handleSaveTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = { ...newTaskData, id: Math.random().toString(36).substr(2, 9), completed: false };
    const updatedTasks = { ...tasks, [newTask.date]: [...(tasks[newTask.date] || []), newTask] };
    setTasks(updatedTasks); localStorage.setItem('chronos_tasks', JSON.stringify(updatedTasks)); setIsModalOpen(false); setForcedStartTime(undefined);
  };

  const toggleTaskCompletion = useCallback((date: string, taskId: string) => { setTasks(prev => { const updatedDayTasks = (prev[date] || []).map(task => task.id === taskId ? { ...task, completed: !task.completed } : task); const updatedTasks = { ...prev, [date]: updatedDayTasks }; localStorage.setItem('chronos_tasks', JSON.stringify(updatedTasks)); return updatedTasks; }); }, []);
  const setMoodForDate = useCallback((date: string, moodId: string) => { setMoods(prev => { const updatedMoods = { ...prev, [date]: moodId }; localStorage.setItem('chronos_moods', JSON.stringify(updatedMoods)); return updatedMoods; }); }, []);
  const updateJournalEntry = useCallback((date: string, text: string) => { setJournalEntries(prev => { const updated = { ...prev, [date]: text }; localStorage.setItem('chronos_journal', JSON.stringify(updated)); return updated; }); }, []);
  const updateGoal = useCallback((type: string, value: string) => { setGoals(prev => { const updated = { ...prev, [type]: value }; localStorage.setItem('chronos_goals', JSON.stringify(updated)); return updated; }); }, []);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return; const dateKey = selectedDateStr;
    Array.from(e.target.files).forEach(file => { const reader = new FileReader(); reader.onloadend = () => { setJournalImages(prev => { const updatedImages = [...(prev[dateKey] || []), reader.result as string]; const allImages = { ...prev, [dateKey]: updatedImages }; localStorage.setItem('chronos_journal_images', JSON.stringify(allImages)); return allImages; }); }; reader.readAsDataURL(file); });
  };
  const removeImage = (dateKey: string, index: number, e: React.MouseEvent) => { e.stopPropagation(); setJournalImages(prev => { const updatedImages = (prev[dateKey] || []).filter((_, i) => i !== index); const allImages = { ...prev, [dateKey]: updatedImages }; localStorage.setItem('chronos_journal_images', JSON.stringify(allImages)); return allImages; }); };
  const addAudio = useCallback((dateKey: string, base64Audio: string) => { setJournalAudios(prev => { const updatedAudios = [...(prev[dateKey] || []), base64Audio]; const allAudios = { ...prev, [dateKey]: updatedAudios }; localStorage.setItem('chronos_journal_audios', JSON.stringify(allAudios)); return allAudios; }); }, []);
  const removeAudio = useCallback((dateKey: string, index: number) => { setJournalAudios(prev => { const updatedAudios = (prev[dateKey] || []).filter((_, i) => i !== index); const allAudios = { ...prev, [dateKey]: updatedAudios }; localStorage.setItem('chronos_journal_audios', JSON.stringify(allAudios)); return allAudios; }); }, []);
  
  const handleUpdateUserName = (name: string) => { setUserName(name); localStorage.setItem('chronos_user_name', name); };
  const handleUpdateProfileImage = (newImage: string) => { setProfileImage(newImage); localStorage.setItem('chronos_profile_image', newImage); };
  const handleUpdateNotifs = (s: any) => { setNotifSettings(s); localStorage.setItem('chronos_notif_settings', JSON.stringify(s)); };
  const handleUpdateVibration = (v: boolean) => { setVibrationEnabled(v); localStorage.setItem('chronos_vibration_enabled', JSON.stringify(v)); };
  const handleUpdateTheme = (newTheme: ThemeConfig) => { setThemeConfig(newTheme); localStorage.setItem('chronos_theme_config', JSON.stringify(newTheme)); };
  const handleUpdateCalendarMode = (m: 'normal' | 'mood') => { setCalendarMode(m); localStorage.setItem('chronos_calendar_mode', JSON.stringify(m)); };

  const handleExportData = async () => {
    const zip = new JSZip();
    const dataFolder = zip.folder("data")!;
    const journalFolder = zip.folder("journal")!;
    const mediaFolder = journalFolder.folder("media")!;
    const imagesFolder = mediaFolder.folder("images")!;
    const audioFolder = mediaFolder.folder("audio")!;

    // Helper for base64 to blob
    const b64toBlob = (b64: string) => {
      const parts = b64.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) { uInt8Array[i] = raw.charCodeAt(i); }
      return new Blob([uInt8Array], { type: contentType });
    };

    const workspaceData: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith('chronos_')) {
        const val = localStorage.getItem(key);
        try {
          const parsed = JSON.parse(val!);
          if (key === 'chronos_journal_images') {
            Object.entries(parsed as Record<string, string[]>).forEach(([date, imgs]) => {
              imgs.forEach((img, idx) => {
                imagesFolder.file(`${date}_${idx}.png`, b64toBlob(img));
              });
            });
          } else if (key === 'chronos_journal_audios') {
             Object.entries(parsed as Record<string, string[]>).forEach(([date, audios]) => {
              audios.forEach((audio, idx) => {
                audioFolder.file(`${date}_${idx}.webm`, b64toBlob(audio));
              });
            });
          } else {
            workspaceData[key.replace('chronos_', '')] = parsed;
          }
        } catch (e) {
          workspaceData[key.replace('chronos_', '')] = val;
        }
      }
    }

    zip.file("chronos_workspace.json", JSON.stringify(workspaceData, null, 2));
    
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (!confirm("Importing a workspace will overwrite your current tasks and memories. Are you sure you want to proceed?")) {
      e.target.value = '';
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const workspaceJson = await zip.file("chronos_workspace.json")?.async("string");
      
      if (!workspaceJson) {
        alert("Invalid backup file: chronos_workspace.json missing.");
        return;
      }

      const parsedWorkspace = JSON.parse(workspaceJson);
      
      // Basic restore of simple JSON fields
      Object.entries(parsedWorkspace).forEach(([key, val]) => {
        localStorage.setItem(`chronos_${key}`, JSON.stringify(val));
      });

      // Restore Media (Images)
      const reconstructedImages: Record<string, string[]> = {};
      const imageFiles = zip.folder("journal/media/images")?.files;
      if (imageFiles) {
        for (const [path, fileObj] of Object.entries(imageFiles)) {
          if (fileObj.dir) continue;
          const fileName = path.split('/').pop()!;
          const date = fileName.split('_')[0];
          const blob = await fileObj.async("blob");
          const reader = new FileReader();
          const base64: string = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          if (!reconstructedImages[date]) reconstructedImages[date] = [];
          reconstructedImages[date].push(base64);
        }
      }
      localStorage.setItem('chronos_journal_images', JSON.stringify(reconstructedImages));

      // Restore Media (Audio)
      const reconstructedAudios: Record<string, string[]> = {};
      const audioFiles = zip.folder("journal/media/audio")?.files;
      if (audioFiles) {
        for (const [path, fileObj] of Object.entries(audioFiles)) {
          if (fileObj.dir) continue;
          const fileName = path.split('/').pop()!;
          const date = fileName.split('_')[0];
          const blob = await fileObj.async("blob");
          const reader = new FileReader();
          const base64: string = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          if (!reconstructedAudios[date]) reconstructedAudios[date] = [];
          reconstructedAudios[date].push(base64);
        }
      }
      localStorage.setItem('chronos_journal_audios', JSON.stringify(reconstructedAudios));

      alert("Workspace restored successfully! The app will now reload.");
      window.location.reload();
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to restore workspace. The file might be corrupted.");
    }
  };

  const currentDayTasks = useMemo(() => tasks[selectedDateStr] || [], [tasks, selectedDateStr]);
  const currentMoodId = useMemo(() => moods[selectedDateStr] || 'none', [moods, selectedDateStr]);
  const currentImages = useMemo(() => journalImages[selectedDateStr] || [], [journalImages, selectedDateStr]);
  const currentAudios = useMemo(() => journalAudios[selectedDateStr] || [], [journalAudios, selectedDateStr]);
  const accentBg = themeConfig.accentColor.split(' ')[0];

  const NavItem: React.FC<{ viewId: any, active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`relative p-2.5 transition-all duration-300 group active:scale-90`}>
      {active && (
        <div className={`absolute inset-0 -m-3 rounded-2xl bg-white/10 blur-[40px] opacity-100 z-0 scale-[1.35]`}></div>
      )}
      <div className={`relative z-10 transition-all duration-300 flex items-center justify-center ${active ? 'text-white scale-[1.3]' : 'text-gray-500 group-hover:text-gray-300 hover:translate-y-[-4px]'}`}>
        {children}
      </div>
      {active && <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${accentBg} shadow-[0_0_20px_white] animate-pulse`}></div>}
    </button>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent text-white overflow-hidden transition-colors duration-500">
      <style>{`
        @keyframes mood-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mood-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mood-spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-mood-spin { animation: mood-spin 25s linear infinite; transform-origin: center; }
        .animate-mood-spin-slow { animation: mood-spin-slow 45s linear infinite; transform-origin: center; }
        .animate-mood-spin-reverse { animation: mood-spin-reverse 35s linear infinite; transform-origin: center; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-area-bottom { padding-bottom: max(2.5rem, env(safe-area-inset-bottom)); }
        .cursor-crosshair { cursor: crosshair; }
      `}</style>
      
      {view === 'home' && <DashboardView selectedDate={selectedDate} selectedDateKey={selectedDateStr} tasks={tasks} setView={setView} toggleTaskCompletion={toggleTaskCompletion} isReadOnly={isReadOnly} onBackToToday={handleBackToToday} profileImage={profileImage} userName={userName} theme={themeConfig} />}
      {view === 'goal' && <GoalViewComponent goals={goals} updateGoal={updateGoal} isReadOnly={isReadOnly} theme={themeConfig} />}
      {view === 'calendar' && (
        <CalendarListView scrollContainerRef={scrollContainerRef} todayRef={todayRef} selectedYear={selectedYear} setSelectedYear={setSelectedYear} months={months} tasks={tasks} moods={moods} onDateSelect={(d) => { setSelectedDate(d); setView('home'); }} onAddTask={(d) => { setSelectedDate(d); setIsModalOpen(true); }} scrollToToday={scrollToToday} isPastDate={isPastDate} theme={themeConfig} mode={calendarMode} setMode={handleUpdateCalendarMode} />
      )}
      {view === 'timeline' && <TimelineViewComponent selectedDate={selectedDate} currentDayTasks={currentDayTasks} selectedDateStr={selectedDateStr} setView={setView} toggleTaskCompletion={toggleTaskCompletion} onAddTaskAtTime={(t) => { setForcedStartTime(t); setIsModalOpen(true); }} isReadOnly={isReadOnly} theme={themeConfig} />}
      {view === 'journal' && <JournalViewComponent selectedDateStr={selectedDateStr} currentMoodId={currentMoodId} setMoodForDate={setMoodForDate} journalEntries={journalEntries} updateJournalEntry={updateJournalEntry} currentImages={currentImages} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} removeImage={removeImage} currentAudios={currentAudios} addAudio={addAudio} removeAudio={removeAudio} setPreviewImage={setPreviewImage} isReadOnly={isReadOnly} theme={themeConfig} />}
      {view === 'settings' && (
        <SettingsViewComponent 
          setView={setView} 
          profileImage={profileImage} 
          onUpdateProfileImage={handleUpdateProfileImage} 
          userName={userName} 
          onUpdateUserName={handleUpdateUserName} 
          notificationSettings={notifSettings} 
          onUpdateNotifications={handleUpdateNotifs} 
          vibrationEnabled={vibrationEnabled} 
          onUpdateVibration={handleUpdateVibration} 
          theme={themeConfig} 
          onExport={handleExportData} 
          onImport={() => importInputRef.current?.click()}
        />
      )}
      {view === 'theme' && (
        <ThemeViewComponent setView={setView} theme={themeConfig} onUpdateTheme={handleUpdateTheme} />
      )}

      <input 
        type="file" 
        ref={importInputRef} 
        className="hidden" 
        accept=".zip" 
        onChange={handleImportData} 
      />

      <nav className="shrink-0 bg-[#090A0D]/95 backdrop-blur-3xl border-t border-white/10 pb-10 pt-5 px-10 flex items-center justify-between z-[100] safe-area-bottom shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
        <NavItem active={view === 'home'} onClick={() => setView('home')} viewId="home">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </NavItem>
        <NavItem active={view === 'goal'} onClick={() => setView('goal')} viewId="goal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
        </NavItem>
        
        <button onClick={() => { if (view === 'calendar') scrollToToday('smooth'); else setView('calendar'); }} className={`relative group w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 transform active:scale-90 ${view === 'calendar' ? `${accentBg} shadow-[0_25px_50px_rgba(0,0,0,0.7)] text-white scale-[1.15]` : 'bg-white/15 text-gray-500 hover:text-gray-200 shadow-xl'}`}>
          {view === 'calendar' && (
            <div className={`absolute -inset-4 ${accentBg} opacity-40 blur-[40px] animate-pulse rounded-[2rem]`}></div>
          )}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>

        <NavItem active={view === 'timeline'} onClick={() => setView('timeline')} viewId="timeline">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 12 2"/></svg>
        </NavItem>

        <NavItem active={view === 'journal'} onClick={() => setView('journal')} viewId="journal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M9 7h6" />
            <path d="M9 11h6" />
          </svg>
        </NavItem>
      </nav>
      <TaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setForcedStartTime(undefined); }} onSave={handleSaveTask} selectedDate={selectedDateStr} defaultStartTime={forcedStartTime} />
      {previewImage && (<div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}><img src={previewImage} alt="" className="max-w-full max-h-full object-contain rounded-2xl animate-in zoom-in-95 shadow-[0_0_100px_rgba(0,0,0,0.95)] border border-white/25" /></div>)}
    </div>
  );
};
export default App;
