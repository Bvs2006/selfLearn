'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Clock, 
  Layers, 
  Globe, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Send,
  RotateCcw
} from 'lucide-react';
import { CourseId, UserSettings } from '@/types';
import { loadSettings, saveSettings } from '@/lib/storage';
import { requestNotificationPermission, sendBrowserNotification, generateNotificationContent } from '@/lib/notifications';
import { getCourse, generateStudyDays } from '@/lib/learning-engine';
import { loadProgress } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testNotifResult, setTestNotifResult] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const s = await loadSettings();
      const autoTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (s.timezone !== autoTz) {
        s.timezone = autoTz;
      }
      setSettings(s);
    };
    init();
  }, []);

  if (!settings) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const handleSave = async (updated: UserSettings) => {
    setSettings(updated);
    await saveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    window.dispatchEvent(new Event('algomaster_progress_updated'));
  };

  const handleTestNotification = async () => {
    setTestNotifResult(null);
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      setTestNotifResult('Notification permission was denied. Please allow notifications in your browser settings.');
      return;
    }

    const { completedResourceIds, dayCompletionMap } = await loadProgress(settings.activeCourse);
    const days = generateStudyDays(
      settings.activeCourse,
      settings.dailyResourceCount,
      completedResourceIds,
      dayCompletionMap
    );
    const course = getCourse(settings.activeCourse);
    const activeDay = days.find((d) => d.isActive);
    const allCompleted = days.length > 0 && days.every((d) => d.isCompleted);

    const payload = generateNotificationContent(course.name, activeDay, allCompleted);
    const sent = await sendBrowserNotification(payload);

    if (sent) {
      setTestNotifResult(`Notification sent! Content: "${payload.title} — ${payload.body}"`);
    } else {
      setTestNotifResult('Could not trigger notification. Ensure browser notifications are enabled.');
    }
  };

  const handleResetCourseProgress = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`algomaster_progress_${settings.activeCourse}`);
      localStorage.removeItem(`algomaster_days_${settings.activeCourse}`);
    }
    setResetConfirmOpen(false);
    window.dispatchEvent(new Event('algomaster_progress_updated'));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Tracker Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Configure your learning preferences, pacing, notifications, and timezone.
        </p>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Check className="h-4 w-4 flex-shrink-0" />
          Settings updated successfully.
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* 1. Course Selection */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Active Course</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose which AlgoMaster learning track is tracked on your dashboard:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={() => handleSave({ ...settings, activeCourse: 'lld' })}
              className={`flex items-center justify-between rounded-xl border p-3.5 sm:p-4 text-left transition-all cursor-pointer min-h-[52px] ${
                settings.activeCourse === 'lld'
                  ? 'border-teal-500 bg-teal-500/10 text-foreground font-bold shadow-xs ring-1 ring-teal-500'
                  : 'border-border/60 bg-background hover:bg-muted/40 text-muted-foreground'
              }`}
            >
              <div>
                <span className="block text-xs sm:text-sm">Low Level Design</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">134 AlgoMaster Resources</span>
              </div>
              {settings.activeCourse === 'lld' && (
                <Check className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              )}
            </button>

            <button
              onClick={() => handleSave({ ...settings, activeCourse: 'system-design' })}
              className={`flex items-center justify-between rounded-xl border p-3.5 sm:p-4 text-left transition-all cursor-pointer min-h-[52px] ${
                settings.activeCourse === 'system-design'
                  ? 'border-teal-500 bg-teal-500/10 text-foreground font-bold shadow-xs ring-1 ring-teal-500'
                  : 'border-border/60 bg-background hover:bg-muted/40 text-muted-foreground'
              }`}
            >
              <div>
                <span className="block text-xs sm:text-sm">System Design</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">160 AlgoMaster Resources</span>
              </div>
              {settings.activeCourse === 'system-design' && (
                <Check className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Daily Resource Count */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Daily Resource Pacing</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Select how many AlgoMaster resources you study per day. AlgoMaster's original ordering is strictly preserved:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {([1, 2, 3, 5] as const).map((count) => (
              <button
                key={count}
                onClick={() => handleSave({ ...settings, dailyResourceCount: count })}
                className={`flex flex-col items-center justify-center rounded-xl border py-3 sm:py-3.5 transition-all cursor-pointer min-h-[58px] ${
                  settings.dailyResourceCount === count
                    ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold shadow-xs ring-1 ring-teal-500'
                    : 'border-border/60 bg-background hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <span className="text-lg sm:text-xl font-extrabold">{count}</span>
                <span className="text-[10px] sm:text-[11px] font-medium opacity-80">
                  {count === 1 ? 'res/day' : 'res/day'}
                </span>
                {count === 3 && (
                  <span className="mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Daily Notifications & Time */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Daily Study Reminders</span>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationEnabled}
                onChange={(e) =>
                  handleSave({ ...settings, notificationEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Get notified at your scheduled hour with a reminder tailored to your active or pending lesson.
          </p>

          {settings.notificationEnabled && (
            <div className="space-y-3 sm:space-y-4 border-t border-border/40 pt-3 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <label className="text-xs font-bold text-foreground">
                  Reminder Time (Default 08:00 PM):
                </label>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={(e) =>
                    handleSave({ ...settings, notificationTime: e.target.value })
                  }
                  className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-teal-600 min-h-[40px]"
                />
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  Timezone: <strong className="font-semibold text-foreground">{settings.timezone}</strong>
                </span>
              </div>

              {/* Test Button */}
              <div className="pt-1">
                <button
                  onClick={handleTestNotification}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Test Notification Now
                </button>

                {testNotifResult && (
                  <p className="mt-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
                    {testNotifResult}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Reset Course Progress */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <RotateCcw className="h-4 w-4" />
            <span>Reset Active Course Progress</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Clear progress for <strong className="text-foreground">{settings.activeCourse === 'lld' ? 'Low Level Design' : 'System Design'}</strong>. The other course remains intact.
          </p>

          {!resetConfirmOpen ? (
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="w-full sm:w-auto rounded-xl border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-[38px]"
            >
              Reset {settings.activeCourse === 'lld' ? 'LLD' : 'System Design'} Progress
            </button>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleResetCourseProgress}
                className="flex-1 sm:flex-none rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer min-h-[38px]"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 sm:flex-none rounded-xl bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 cursor-pointer min-h-[38px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
