'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  Layers, 
  AlertTriangle, 
  Award,
  ArrowRight
} from 'lucide-react';
import { CourseProgressStats, UserSettings } from '@/types';
import { loadSettings, loadProgress } from '@/lib/storage';
import { generateStudyDays, computeCourseStats } from '@/lib/learning-engine';

export default function ProgressPage() {
  const [lldStats, setLldStats] = useState<CourseProgressStats | null>(null);
  const [sdStats, setSdStats] = useState<CourseProgressStats | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const s = await loadSettings();
      setSettings(s);

      const lldProg = await loadProgress('lld');
      const lldDays = generateStudyDays('lld', s.dailyResourceCount, lldProg.completedResourceIds, lldProg.dayCompletionMap);
      setLldStats(computeCourseStats('lld', lldDays, lldProg.completedResourceIds));

      const sdProg = await loadProgress('system-design');
      const sdDays = generateStudyDays('system-design', s.dailyResourceCount, sdProg.completedResourceIds, sdProg.dayCompletionMap);
      setSdStats(computeCourseStats('system-design', sdDays, sdProg.completedResourceIds));
    };

    fetchStats();
  }, []);

  if (!lldStats || !sdStats || !settings) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">Calculating learning progress...</p>
      </div>
    );
  }

  const activeStats = settings.activeCourse === 'lld' ? lldStats : sdStats;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Learning Progress & Analytics
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Clear, distraction-free metrics tracking your sequential journey across AlgoMaster courses.
        </p>
      </div>

      {/* Main Course Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* LOW LEVEL DESIGN */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              LOW LEVEL DESIGN
            </span>
            <span className="text-base sm:text-lg font-black text-foreground">
              {lldStats.percentage}%
            </span>
          </div>

          <div className="h-2.5 sm:h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${lldStats.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground">
            <span>{lldStats.completedDays} / {lldStats.totalDays} days</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {lldStats.completedResources} / {lldStats.totalResources} items
            </span>
          </div>
        </div>

        {/* SYSTEM DESIGN */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              SYSTEM DESIGN
            </span>
            <span className="text-base sm:text-lg font-black text-foreground">
              {sdStats.percentage}%
            </span>
          </div>

          <div className="h-2.5 sm:h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${sdStats.percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground">
            <span>{sdStats.completedDays} / {sdStats.totalDays} days</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {sdStats.completedResources} / {sdStats.totalResources} items
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics Grid - 2 columns on mobile, 3 on tablet, 6 on desktop */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Active Course Breakdown ({activeStats.courseName})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Metric 1: Completed Days */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Completed</span>
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              {activeStats.completedDays}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">days finished</span>
          </div>

          {/* Metric 2: Pending Days */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Pending</span>
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              {activeStats.pendingDays}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">active day due</span>
          </div>

          {/* Metric 3: Current Day */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Current</span>
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              Day {activeStats.currentDayNumber}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">of {activeStats.totalDays}</span>
          </div>

          {/* Metric 4: Total Resources Completed */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Resources</span>
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              {activeStats.completedResources}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">of {activeStats.totalResources} done</span>
          </div>

          {/* Metric 5: Current Streak */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Streak</span>
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              {activeStats.currentStreak}d
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">consecutive days</span>
          </div>

          {/* Metric 6: Missed Days */}
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] sm:text-xs font-medium">Missed</span>
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
            </div>
            <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground">
              {activeStats.missedDaysCount}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">unresolved days</span>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 sm:p-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Continue where you stopped
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay consistent. Master Day {activeStats.currentDayNumber} to unlock the next milestone.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition-colors min-h-[40px]"
        >
          <span>Open Today's Lesson</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
