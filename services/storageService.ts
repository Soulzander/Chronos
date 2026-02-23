
import Dexie, { Table } from 'dexie';
import { Task } from '../types';

export interface MoodEntry {
  date: string;
  moodId: string;
}

export interface JournalEntry {
  date: string;
  content: string;
}

export interface JournalMedia {
  date: string;
  data: string[]; // Array of base64 strings
}

export interface GoalEntry {
  id: string;
  content: string;
}

export interface SettingEntry {
  id: string;
  value: any;
}

export class ChronosDatabase extends Dexie {
  tasks!: Table<Task>;
  moods!: Table<MoodEntry>;
  journalEntries!: Table<JournalEntry>;
  journalImages!: Table<JournalMedia>;
  journalAudios!: Table<JournalMedia>;
  goals!: Table<GoalEntry>;
  settings!: Table<SettingEntry>;

  constructor() {
    super('ChronosDatabase');
    this.version(1).stores({
      tasks: 'id, date',
      moods: 'date',
      journalEntries: 'date',
      journalImages: 'date',
      journalAudios: 'date',
      goals: 'id',
      settings: 'id'
    });
  }
}

export const db = new ChronosDatabase();

export const storageService = {
  // Migration from localStorage
  async migrateFromLocalStorage() {
    const isMigrated = localStorage.getItem('chronos_migrated_to_db');
    if (isMigrated) return;

    console.log('Starting migration from localStorage to IndexedDB...');

    const safeParse = (key: string) => {
      const val = localStorage.getItem(key);
      if (!val) return {};
      try {
        return JSON.parse(val);
      } catch (e) {
        console.warn(`Failed to parse localStorage key "${key}":`, e);
        return {};
      }
    };

    const tasks = safeParse('chronos_tasks');
    const moods = safeParse('chronos_moods');
    const journal = safeParse('chronos_journal');
    const images = safeParse('chronos_journal_images');
    const audios = safeParse('chronos_journal_audios');
    const goals = safeParse('chronos_goals');

    // Migrate tasks
    for (const [date, dayTasks] of Object.entries(tasks)) {
      if (Array.isArray(dayTasks)) {
        await db.tasks.bulkPut(dayTasks);
      }
    }

    // Migrate moods
    for (const [date, moodId] of Object.entries(moods)) {
      await db.moods.put({ date, moodId: moodId as string });
    }

    // Migrate journal
    for (const [date, content] of Object.entries(journal)) {
      await db.journalEntries.put({ date, content: content as string });
    }

    // Migrate images
    for (const [date, data] of Object.entries(images)) {
      await db.journalImages.put({ date, data: data as string[] });
    }

    // Migrate audios
    for (const [date, data] of Object.entries(audios)) {
      await db.journalAudios.put({ date, data: data as string[] });
    }

    // Migrate goals
    for (const [id, content] of Object.entries(goals)) {
      await db.goals.put({ id, content: content as string });
    }

    // Migrate other settings
    const settingsToMigrate = [
      'chronos_user_name',
      'chronos_profile_image',
      'chronos_notif_settings',
      'chronos_vibration_enabled',
      'chronos_theme_config',
      'chronos_calendar_mode',
      'chronos_app_lock_pin' // If it exists
    ];

    for (const key of settingsToMigrate) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          await db.settings.put({ id: key.replace('chronos_', ''), value: JSON.parse(val) });
        } catch {
          await db.settings.put({ id: key.replace('chronos_', ''), value: val });
        }
      }
    }

    localStorage.setItem('chronos_migrated_to_db', 'true');
    console.log('Migration complete.');
  },

  // Tasks
  async getTasksByDate(date: string): Promise<Task[]> {
    return db.tasks.where('date').equals(date).toArray();
  },

  async getAllTasks(): Promise<Record<string, Task[]>> {
    const all = await db.tasks.toArray();
    const grouped: Record<string, Task[]> = {};
    all.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return grouped;
  },

  async saveTask(task: Task) {
    return db.tasks.put(task);
  },

  async deleteTask(id: string) {
    return db.tasks.delete(id);
  },

  // Moods
  async getMoods(): Promise<Record<string, string>> {
    const all = await db.moods.toArray();
    const map: Record<string, string> = {};
    all.forEach(m => map[m.date] = m.moodId);
    return map;
  },

  async saveMood(date: string, moodId: string) {
    return db.moods.put({ date, moodId });
  },

  // Journal
  async getJournalEntries(): Promise<Record<string, string>> {
    const all = await db.journalEntries.toArray();
    const map: Record<string, string> = {};
    all.forEach(j => map[j.date] = j.content);
    return map;
  },

  async saveJournalEntry(date: string, content: string) {
    return db.journalEntries.put({ date, content });
  },

  // Media
  async getJournalImages(): Promise<Record<string, string[]>> {
    const all = await db.journalImages.toArray();
    const map: Record<string, string[]> = {};
    all.forEach(i => map[i.date] = i.data);
    return map;
  },

  async saveJournalImages(date: string, data: string[]) {
    return db.journalImages.put({ date, data });
  },

  async getJournalAudios(): Promise<Record<string, string[]>> {
    const all = await db.journalAudios.toArray();
    const map: Record<string, string[]> = {};
    all.forEach(a => map[a.date] = a.data);
    return map;
  },

  async saveJournalAudios(date: string, data: string[]) {
    return db.journalAudios.put({ date, data });
  },

  // Goals
  async getGoals(): Promise<Record<string, string>> {
    const all = await db.goals.toArray();
    const map: Record<string, string> = {};
    all.forEach(g => map[g.id] = g.content);
    return map;
  },

  async saveGoal(id: string, content: string) {
    return db.goals.put({ id, content });
  },

  // Settings
  async getSetting(id: string, defaultValue: any): Promise<any> {
    const entry = await db.settings.get(id);
    return entry ? entry.value : defaultValue;
  },

  async saveSetting(id: string, value: any) {
    return db.settings.put({ id, value });
  },

  async getAllSettings(): Promise<Record<string, any>> {
    const all = await db.settings.toArray();
    const map: Record<string, any> = {};
    all.forEach(s => map[s.id] = s.value);
    return map;
  }
};
