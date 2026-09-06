'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Minus, 
  ExternalLink, 
  X, 
  Clock, 
  BookOpen, 
  Layers 
} from 'lucide-react';
import { StudyDay, UserSettings } from '@/types';
import { loadSettings, loadProgress } from '@/lib/storage';
import { generateStudyDays, getCourse } from '@/lib/learning-engine';

export default function HistoryPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [days, setDays] = useState<StudyDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<StudyDay | null>(null);

  useEffect(() => {
    const init = async () => {
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
    };

    init();
  }, []);

  if (!settings) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading calendar history...</p>
      </div>
    );
  }

  const course = getCourse(settings.activeCourse);
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDaysFull = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Study History & Calendar
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Track your daily consistency in {course.name}. Tap any day to inspect lessons.
        </p>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-3.5 sm:p-8 shadow-2xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3 sm:pb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {currentMonthName} {currentYear}
            </h2>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 text-[10px] sm:text-[11px]">
                ✓
              </span>
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 text-[10px] sm:text-[11px]">
                ✗
              </span>
              <span className="text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-md bg-muted text-muted-foreground font-bold text-[10px] sm:text-[11px]">
                -
              </span>
              <span className="text-muted-foreground">Locked</span>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {weekDaysFull.map((wd, i) => (
            <div key={wd} className="py-1">
              <span className="sm:hidden">{weekDays[i]}</span>
              <span className="hidden sm:inline">{wd}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {days.map((day) => {
            const isDone = day.isCompleted;
            const isPending = day.isPending;

            return (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center justify-center rounded-lg sm:rounded-xl p-1.5 sm:p-4 text-center transition-all cursor-pointer border min-h-[48px] sm:min-h-[70px] ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : isPending
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 ring-1 sm:ring-2 ring-amber-500/30 font-bold'
                    : 'bg-muted/20 text-muted-foreground border-border/30 hover:bg-muted/40 opacity-60'
                }`}
              >
                <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  D{day.dayNumber}
                </span>
                <span className="mt-0.5 text-xs sm:text-base font-bold">
                  {isDone ? '✓' : isPending ? '✗' : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection Modal - Mobile Responsive */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Day Inspection
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Day {selectedDay.dayNumber} — {course.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Status:</span>
              {selectedDay.isCompleted ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </span>
              ) : selectedDay.isPending ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                  <Clock className="h-3.5 w-3.5" /> In Progress (Pending)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-muted-foreground">
                  <Minus className="h-3.5 w-3.5" /> Locked
                </span>
              )}
            </div>

            {/* Resources list */}
            <div className="space-y-2">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned AlgoMaster Resources:
              </h4>
              <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                {selectedDay.resources.map((item) => (
                  <div
                    key={item.resource.id}
                    className="flex items-center justify-between p-3 text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-border flex-shrink-0" />
                      )}
                      <span className={`font-semibold truncate ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.resource.title}
                      </span>
                    </div>

                    <a
                      href={item.resource.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted flex-shrink-0 min-h-[32px]"
                    >
                      <span>Read</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full sm:w-auto rounded-xl bg-muted px-5 py-2.5 text-xs font-bold text-foreground hover:bg-muted/80 cursor-pointer min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
