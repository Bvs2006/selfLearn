'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ExternalLink, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  FileCode, 
  HelpCircle, 
  Layers, 
  MessageSquare,
  Lock,
  ArrowRight
} from 'lucide-react';
import { StudyDay, Resource, ResourceType } from '@/types';
import { toggleResourceProgress, markDayCompletedInStorage } from '@/lib/storage';

interface TodayCardProps {
  day: StudyDay | undefined;
  courseName: string;
  totalDays: number;
  completedDays: number;
  isCourseCompleted: boolean;
  onProgressUpdated: () => void;
}

export function TodayCard({
  day,
  courseName,
  totalDays,
  completedDays,
  isCourseCompleted,
  onProgressUpdated,
}: TodayCardProps) {
  const [activeReadingResource, setActiveReadingResource] = useState<Resource | null>(null);
  const [completing, setCompleting] = useState(false);

  const getResourceTypeBadge = (type: ResourceType) => {
    switch (type) {
      case 'exercise':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FileCode className="h-3 w-3" /> Exercise
          </span>
        );
      case 'quiz':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <HelpCircle className="h-3 w-3" /> Quiz
          </span>
        );
      case 'design_problem':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Layers className="h-3 w-3" /> Design Problem
          </span>
        );
      case 'interview_resource':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <MessageSquare className="h-3 w-3" /> Interview Prep
          </span>
        );
      case 'chapter':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <BookOpen className="h-3 w-3" /> Reading
          </span>
        );
    }
  };

  const handleToggleResource = async (res: Resource, currentCompleted: boolean) => {
    if (!day) return;
    const nextCompleted = !currentCompleted;
    await toggleResourceProgress(day.courseId, res.id, nextCompleted);

    const otherResources = day.resources.filter((r) => r.resource.id !== res.id);
    const allOthersDone = otherResources.every((r) => r.completed);

    if (nextCompleted && allOthersDone) {
      await markDayCompletedInStorage(day.courseId, day.dayNumber, true);
      triggerCelebration();
    } else if (!nextCompleted && day.isCompleted) {
      await markDayCompletedInStorage(day.courseId, day.dayNumber, false);
    }

    onProgressUpdated();
  };

  const handleMarkDayComplete = async () => {
    if (!day) return;
    setCompleting(true);
    for (const item of day.resources) {
      if (!item.completed) {
        await toggleResourceProgress(day.courseId, item.resource.id, true);
      }
    }
    await markDayCompletedInStorage(day.courseId, day.dayNumber, true);
    triggerCelebration();
    setCompleting(false);
    onProgressUpdated();
  };

  const handleOpenAllResources = () => {
    if (!day) return;
    day.resources.forEach((item) => {
      window.open(item.resource.officialUrl, '_blank', 'noopener,noreferrer');
    });
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#14b8a6', '#f59e0b', '#3b82f6'],
      });
    } catch (e) {
      // Confetti fallback
    }
  };

  // 1. Entire course completed state
  if (isCourseCompleted) {
    return (
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6 sm:p-8 text-center shadow-lg shadow-teal-500/5 backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
          <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          🎉 You completed all available {courseName} resources!
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Outstanding discipline! You have mastered all {totalDays} days of the official AlgoMaster curriculum.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm">
          <CheckCircle2 className="h-4 w-4" /> 100% Curriculum Completed
        </div>
      </div>
    );
  }

  // 2. Loading state
  if (!day) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">Loading curriculum schedule...</p>
      </div>
    );
  }

  const allDayResourcesDone = day.resources.every((r) => r.completed);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-8 shadow-sm transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <span>Today's Learning</span>
            <span>•</span>
            <span>{courseName}</span>
          </div>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Day {day.dayNumber}
          </h1>
        </div>

        {/* Day Status Badge */}
        <div className="flex items-center self-start sm:self-center gap-2">
          {day.isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Day Completed
            </span>
          ) : day.isPending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> In Progress
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Locked
            </span>
          )}
        </div>
      </div>

      {/* Pending Alert Banner */}
      {day.isPending && (
        <div className="mt-3 sm:mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Day {day.dayNumber} is still pending.</span>
            <p className="mt-0.5 text-muted-foreground leading-relaxed">
              Complete all resources in Day {day.dayNumber} before Day {day.dayNumber + 1} unlocks.
            </p>
          </div>
        </div>
      )}

      {/* Currently Reading Bar */}
      {activeReadingResource && (
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 sm:px-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
            <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="truncate">
              Currently reading: <strong className="font-semibold">{activeReadingResource.title}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              const currentStatus = day.resources.find(
                (r) => r.resource.id === activeReadingResource.id
              )?.completed;
              handleToggleResource(activeReadingResource, !!currentStatus);
            }}
            className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer self-end sm:self-auto"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Resource Complete
          </button>
        </div>
      )}

      {/* Today's Resources List */}
      <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Assigned AlgoMaster Resources ({day.resources.filter((r) => r.completed).length} / {day.resources.length})
        </h3>

        <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-muted/15 overflow-hidden">
          {day.resources.map((item, idx) => {
            const res = item.resource;
            const isDone = item.completed;
            const isCurrentlyReading = activeReadingResource?.id === res.id;

            return (
              <div
                key={res.id}
                className={`flex flex-col gap-3 p-3.5 sm:p-4 transition-colors ${
                  isDone ? 'bg-muted/25 opacity-80' : isCurrentlyReading ? 'bg-teal-500/5' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Toggle Checkbox Button with generous touch area */}
                  <button
                    onClick={() => handleToggleResource(res, isDone)}
                    className="mt-0.5 text-muted-foreground hover:text-teal-600 transition-colors cursor-pointer flex-shrink-0 p-1 -m-1"
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/70 hover:text-teal-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      {getResourceTypeBadge(res.resourceType)}
                      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {res.estimatedMinutes}m
                      </span>
                      {res.difficulty && (
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground/80">
                          • {res.difficulty}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                        isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {res.title}
                    </h4>
                  </div>
                </div>

                {/* Resource Action Buttons - Touch-friendly */}
                <div className="flex items-center gap-2 pl-7 sm:pl-8 sm:self-end">
                  <a
                    href={res.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActiveReadingResource(res)}
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 sm:py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted transition-all cursor-pointer min-h-[36px]"
                  >
                    <span>Read</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>

                  <button
                    onClick={() => handleToggleResource(res, isDone)}
                    className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-1 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                      isDone
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/50'
                    }`}
                  >
                    {isDone ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar & Actions Footer */}
      <div className="mt-6 sm:mt-8 border-t border-border/50 pt-4 sm:pt-5 space-y-4">
        {/* Progress stats */}
        <div>
          <div className="flex items-baseline justify-between text-xs sm:text-sm font-bold text-foreground mb-1.5">
            <span>{completedDays} / {totalDays} days completed</span>
            <span className="text-muted-foreground font-semibold">
              {totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-500 rounded-full"
              style={{
                width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Primary Action Buttons: Stack cleanly on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
          <button
            onClick={handleOpenAllResources}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-all cursor-pointer min-h-[44px]"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <span>Open Today's Resources</span>
          </button>

          <button
            onClick={handleMarkDayComplete}
            disabled={completing}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer min-h-[44px] ${
              allDayResourcesDone
                ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/25'
                : 'bg-teal-700/90 hover:bg-teal-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark Day Complete</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
