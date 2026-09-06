'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  BellOff, 
  Layers, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { StudyDay, UserSettings, CourseProgressStats } from '@/types';
import { loadSettings, loadProgress } from '@/lib/storage';
import { generateStudyDays, computeCourseStats } from '@/lib/learning-engine';
import { TodayCard } from '@/components/today-card';

export default function DashboardPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [days, setDays] = useState<StudyDay[]>([]);
  const [stats, setStats] = useState<CourseProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const s = await loadSettings();
      setSettings(s);
      const { completedResourceIds, dayCompletionMap } = await loadProgress(s.activeCourse);
      const computedDays = generateStudyDays(
        s.activeCourse,
        s.dailyResourceCount,
        completedResourceIds,
        dayCompletionMap
      );
      setDays(computedDays);
      const computedStats = computeCourseStats(s.activeCourse, computedDays, completedResourceIds);
      setStats(computedStats);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const handleProgressUpdate = () => {
      refreshData();
    };

    window.addEventListener('algomaster_progress_updated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);

    return () => {
      window.removeEventListener('algomaster_progress_updated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [refreshData]);

  if (loading || !settings || !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
        <p className="mt-4 text-xs sm:text-sm text-muted-foreground">Loading your AlgoMaster study plan...</p>
      </div>
    );
  }

  const activeDay = days.find((d) => d.isActive);

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-8 space-y-5 sm:space-y-6">
      {/* Top Banner / Course Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              Personal Study Tracker
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">AlgoMaster Verified</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
            {stats.courseName}
          </h2>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted transition-colors text-[11px] sm:text-xs min-h-[34px]"
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            Switch Course
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted transition-colors text-[11px] sm:text-xs min-h-[34px]"
          >
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {settings.dailyResourceCount} res/day
          </Link>
        </div>
      </div>

      {/* Primary Card: Today's Learning */}
      <TodayCard
        day={activeDay}
        courseName={stats.courseName}
        totalDays={stats.totalDays}
        completedDays={stats.completedDays}
        isCourseCompleted={stats.isCourseCompleted}
        onProgressUpdated={refreshData}
      />

      {/* Grid of Minimal Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Card 1: Pending Learning */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Learning
            </span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2.5 sm:mt-3">
            {activeDay && !activeDay.isCompleted ? (
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Day {activeDay.dayNumber}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeDay.resources.filter((r) => !r.completed).length} resources pending. Next days remain locked.
                </p>
              </div>
            ) : stats.isCourseCompleted ? (
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  0 Days
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  All days in {stats.courseName} are completed!
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  Up to date
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ready for the next scheduled lesson.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Overall Progress */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Progress
            </span>
            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {stats.percentage}%
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ({stats.completedDays} / {stats.totalDays} days)
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.completedResources} of {stats.totalResources} AlgoMaster items marked complete.
            </p>
          </div>
        </div>

        {/* Card 3: Daily Notification Status */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daily Notification
            </span>
            {settings.notificationEnabled ? (
              <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {settings.notificationEnabled ? settings.notificationTime : 'Disabled'}
              </span>
              {settings.notificationEnabled && (
                <span className="text-xs font-semibold text-muted-foreground">
                  local time
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.notificationEnabled
                ? `Reminders scheduled for ${settings.notificationTime} (${settings.timezone.split('/').pop()}).`
                : 'Turn on daily reminders in Settings.'}
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline min-h-[30px]"
            >
              Configure in Settings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
