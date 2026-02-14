import React, { useState, useEffect } from 'react';
import { Task } from '../types.ts';
import { COLORS } from '../constants.tsx';
import { suggestTaskIcon } from '../services/geminiService.ts';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed'>) => void;
  selectedDate: string;
  defaultStartTime?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, selectedDate, defaultStartTime }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('09:00');
  const [icon, setIcon] = useState('📅');
  const [color, setColor] = useState(COLORS[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDuration(60);
      setStartTime(defaultStartTime || '09:00');
      setIcon('📅');
      setColor(COLORS[0]);
      setPriority('medium');
    }
  }, [isOpen, defaultStartTime]);

  const handleSuggestIcon = async () => {
    if (!title.trim()) return;
    setIsSuggesting(true);
    const suggestedIcon = await suggestTaskIcon(title);
    setIcon(suggestedIcon);
    setIsSuggesting(false);
  };

  if (!isOpen) return null;

  const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#0F1014] w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] border border-white/10 overflow-hidden z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">New Activity</h2>
            <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="px-8 py-6 space-y-10 max-h-[75vh] overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Task Information</label>
            <div className="flex gap-6 items-start">
              <div className="relative group">
                <div className={`w-16 h-16 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-inner transition-transform ${isSuggesting ? 'animate-pulse scale-90' : ''}`}>
                  {isSuggesting ? '✨' : icon}
                </div>
                {title.trim() && !isSuggesting && (
                  <button 
                    onClick={handleSuggestIcon}
                    className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1.5 shadow-lg border border-white/20 hover:scale-110 active:scale-95 transition-all"
                    title="Suggest Icon with Gemini"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-5">
                <input type="text" autoFocus className="w-full bg-transparent border-b border-white/20 py-2 text-xl font-medium focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 text-white" placeholder="Redesign main page" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input type="text" className="w-full bg-transparent border-b border-white/20 py-1 text-sm text-gray-200 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" placeholder="Task description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex-1 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Start Time</label>
              <input type="time" className="w-full bg-white/[0.05] border border-white/10 rounded-[1.5rem] px-5 py-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-white" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="flex-1 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Duration (min)</label>
              <input type="number" className="w-full bg-white/[0.05] border border-white/10 rounded-[1.5rem] px-5 py-4 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-white" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Accent Color</label>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {COLORS.map((c, idx) => (
                <button key={idx} onClick={() => setColor(c)} className={`w-10 h-10 shrink-0 rounded-full transition-all border-2 ${c.split(' ')[0]} ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 pb-12">
          <button 
            onClick={() => onSave({ title, description, duration, startTime, icon, color, date: selectedDate, priority })} 
            disabled={!title.trim() || isSuggesting} 
            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-3xl transition-all disabled:opacity-30 active:scale-[0.98] shadow-2xl"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;