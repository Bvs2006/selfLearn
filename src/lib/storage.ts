import { CourseId, UserSettings } from '@/types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  SETTINGS: 'algomaster_user_settings',
  RESOURCE_PROGRESS: (courseId: CourseId) => `algomaster_progress_${courseId}`,
  DAY_PROGRESS: (courseId: CourseId) => `algomaster_days_${courseId}`,
};

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'default_user',
  activeCourse: 'lld',
  dailyResourceCount: 3,
  notificationEnabled: true,
  notificationTime: '20:00',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
};

export async function loadSettings(): Promise<UserSettings> {
  // Try local storage first for immediate rendering
  let settings = { ...DEFAULT_SETTINGS };
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (local) {
      try {
        settings = { ...settings, ...JSON.parse(local) };
      } catch (e) {
        console.error('Error reading local settings:', e);
      }
    }
  }

  // Then try Supabase in background
  try {
    const { data, error } = await supabase
      .from('algomaster_user_settings')
      .select('*')
      .eq('id', 'default_user')
      .single();

    if (data && !error) {
      settings = {
        id: data.id,
        activeCourse: data.active_course as CourseId,
        dailyResourceCount: data.daily_resource_count as (1 | 2 | 3 | 5),
        notificationEnabled: data.notification_enabled,
        notificationTime: data.notification_time || '20:00',
        timezone: data.timezone || settings.timezone,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('Supabase settings fetch warning (offline/local fallback):', err);
  }

  return settings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  try {
    await supabase.from('algomaster_user_settings').upsert({
      id: settings.id || 'default_user',
      active_course: settings.activeCourse,
      daily_resource_count: settings.dailyResourceCount,
      notification_enabled: settings.notificationEnabled,
      notification_time: settings.notificationTime,
      timezone: settings.timezone,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not sync settings to Supabase (offline):', err);
  }
}

export async function loadProgress(courseId: CourseId): Promise<{
  completedResourceIds: Set<string>;
  dayCompletionMap: Map<number, string>;
}> {
  const resourceIds = new Set<string>();
  const dayMap = new Map<number, string>();

  // Read local first
  if (typeof window !== 'undefined') {
    const localRes = localStorage.getItem(STORAGE_KEYS.RESOURCE_PROGRESS(courseId));
    if (localRes) {
      try {
        const arr = JSON.parse(localRes);
        if (Array.isArray(arr)) arr.forEach((id: string) => resourceIds.add(id));
      } catch (e) {
        console.error(e);
      }
    }

    const localDays = localStorage.getItem(STORAGE_KEYS.DAY_PROGRESS(courseId));
    if (localDays) {
      try {
        const obj = JSON.parse(localDays);
        Object.entries(obj).forEach(([dayNum, iso]) => {
          dayMap.set(Number(dayNum), iso as string);
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Fetch Supabase in parallel
  try {
    const [resResult, dayResult] = await Promise.all([
      supabase
        .from('algomaster_user_resource_progress')
        .select('resource_id, completed, completed_at')
        .eq('user_id', 'default_user')
        .eq('course_id', courseId)
        .eq('completed', true),
      supabase
        .from('algomaster_user_day_progress')
        .select('day_number, completed, completed_at')
        .eq('user_id', 'default_user')
        .eq('course_id', courseId)
        .eq('completed', true),
    ]);

    if (resResult.data) {
      resResult.data.forEach((r) => resourceIds.add(r.resource_id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.RESOURCE_PROGRESS(courseId),
          JSON.stringify(Array.from(resourceIds))
        );
      }
    }

    if (dayResult.data) {
      dayResult.data.forEach((d) => {
        dayMap.set(d.day_number, d.completed_at || new Date().toISOString());
      });
      if (typeof window !== 'undefined') {
        const obj: Record<number, string> = {};
        dayMap.forEach((val, key) => (obj[key] = val));
        localStorage.setItem(STORAGE_KEYS.DAY_PROGRESS(courseId), JSON.stringify(obj));
      }
    }
  } catch (err) {
    console.warn('Supabase progress sync warning (offline/local fallback):', err);
  }

  return { completedResourceIds: resourceIds, dayCompletionMap: dayMap };
}

export async function toggleResourceProgress(
  courseId: CourseId,
  resourceId: string,
  completed: boolean
): Promise<void> {
  // Update local storage
  if (typeof window !== 'undefined') {
    const key = STORAGE_KEYS.RESOURCE_PROGRESS(courseId);
    const existing = localStorage.getItem(key);
    const set = new Set<string>(existing ? JSON.parse(existing) : []);
    if (completed) {
      set.add(resourceId);
    } else {
      set.delete(resourceId);
    }
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  // Update Supabase
  try {
    await supabase.from('algomaster_user_resource_progress').upsert({
      id: `default_user_${resourceId}`,
      user_id: 'default_user',
      course_id: courseId,
      resource_id: resourceId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.warn('Could not sync resource progress to Supabase:', err);
  }
}

export async function markDayCompletedInStorage(
  courseId: CourseId,
  dayNumber: number,
  completed: boolean
): Promise<void> {
  const timestamp = completed ? new Date().toISOString() : null;

  if (typeof window !== 'undefined') {
    const key = STORAGE_KEYS.DAY_PROGRESS(courseId);
    const existing = localStorage.getItem(key);
    const map = existing ? JSON.parse(existing) : {};
    if (completed) {
      map[dayNumber] = timestamp;
    } else {
      delete map[dayNumber];
    }
    localStorage.setItem(key, JSON.stringify(map));
  }

  try {
    await supabase.from('algomaster_user_day_progress').upsert({
      id: `default_user_${courseId}_day_${dayNumber}`,
      user_id: 'default_user',
      course_id: courseId,
      day_number: dayNumber,
      completed,
      completed_at: timestamp,
    });
  } catch (err) {
    console.warn('Could not sync day progress to Supabase:', err);
  }
}
