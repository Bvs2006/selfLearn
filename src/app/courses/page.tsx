'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  FileCode, 
  HelpCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CourseId, UserSettings, CourseProgressStats } from '@/types';
import { loadSettings, saveSettings, loadProgress } from '@/lib/storage';
import { generateStudyDays, computeCourseStats, getCourse } from '@/lib/learning-engine';

export default function CoursesPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [lldStats, setLldStats] = useState<CourseProgressStats | null>(null);
  const [sdStats, setSdStats] = useState<CourseProgressStats | null>(null);
  const [selectedCourseForView, setSelectedCourseForView] = useState<CourseId>('lld');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'lld-sec-1': true,
    'sd-sec-1': true,
  });
  const [lldCompletedIds, setLldCompletedIds] = useState<Set<string>>(new Set());
  const [sdCompletedIds, setSdCompletedIds] = useState<Set<string>>(new Set());

  const loadAllData = async () => {
    const s = await loadSettings();
    setSettings(s);
    setSelectedCourseForView(s.activeCourse);

    // LLD data
    const lldProg = await loadProgress('lld');
    const lldDays = generateStudyDays('lld', s.dailyResourceCount, lldProg.completedResourceIds, lldProg.dayCompletionMap);
    setLldStats(computeCourseStats('lld', lldDays, lldProg.completedResourceIds));
    setLldCompletedIds(lldProg.completedResourceIds);

    // SD data
    const sdProg = await loadProgress('system-design');
    const sdDays = generateStudyDays('system-design', s.dailyResourceCount, sdProg.completedResourceIds, sdProg.dayCompletionMap);
    setSdStats(computeCourseStats('system-design', sdDays, sdProg.completedResourceIds));
    setSdCompletedIds(sdProg.completedResourceIds);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectActiveCourse = async (courseId: CourseId) => {
    if (!settings) return;
    const nextSettings = { ...settings, activeCourse: courseId };
    setSettings(nextSettings);
    await saveSettings(nextSettings);
    window.dispatchEvent(new Event('algomaster_progress_updated'));
  };

  const toggleSection = (secId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const activeCourseData = getCourse(selectedCourseForView);
  const currentCompletedIds = selectedCourseForView === 'lld' ? lldCompletedIds : sdCompletedIds;

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          AlgoMaster Learning Areas
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Switch active course or inspect the complete official curriculum. Progress is completely isolated.
        </p>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Low Level Design */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 transition-all relative ${
            settings?.activeCourse === 'lld'
              ? 'border-teal-500 bg-teal-500/5 shadow-md shadow-teal-500/5 ring-1 ring-teal-500'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          {settings?.activeCourse === 'lld' && (
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-sm">
              LLD
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Low Level Design</h2>
              <span className="text-[11px] sm:text-xs text-muted-foreground">19 Sections • 134 Resources</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
            Master OOP, SOLID principles, 38 design patterns, and real-world design problems (Parking Lot, LRU Cache, Splitwise, Uber).
          </p>

          {/* Progress Metrics */}
          {lldStats && (
            <div className="mt-4 sm:mt-5 space-y-2 border-t border-border/40 pt-3 sm:pt-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progress:</span>
                <span className="text-foreground font-bold">
                  {lldStats.completedDays} / {lldStats.totalDays} days ({lldStats.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${lldStats.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                <span>{lldStats.completedResources} / 134 completed</span>
                <span>Current: Day {lldStats.currentDayNumber}</span>
              </div>
            </div>
          )}

          {/* Actions - Mobile Optimized */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-stretch gap-2">
            <button
              onClick={() => handleSelectActiveCourse('lld')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                settings?.activeCourse === 'lld'
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {settings?.activeCourse === 'lld' ? 'Currently Active' : 'Set as Active Course'}
            </button>
            <button
              onClick={() => setSelectedCourseForView('lld')}
              className="rounded-xl border border-border/80 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer min-h-[40px]"
            >
              Curriculum
            </button>
          </div>
        </div>

        {/* Card 2: System Design */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 transition-all relative ${
            settings?.activeCourse === 'system-design'
              ? 'border-teal-500 bg-teal-500/5 shadow-md shadow-teal-500/5 ring-1 ring-teal-500'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          {settings?.activeCourse === 'system-design' && (
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-sm">
              SD
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">System Design</h2>
              <span className="text-[11px] sm:text-xs text-muted-foreground">21 Sections • 160 Resources</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
            Master distributed systems, caching, databases, scaling, microservices patterns, message queues, and reliability.
          </p>

          {/* Progress Metrics */}
          {sdStats && (
            <div className="mt-4 sm:mt-5 space-y-2 border-t border-border/40 pt-3 sm:pt-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Progress:</span>
                <span className="text-foreground font-bold">
                  {sdStats.completedDays} / {sdStats.totalDays} days ({sdStats.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${sdStats.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                <span>{sdStats.completedResources} / 160 completed</span>
                <span>Current: Day {sdStats.currentDayNumber}</span>
              </div>
            </div>
          )}

          {/* Actions - Mobile Optimized */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-stretch gap-2">
            <button
              onClick={() => handleSelectActiveCourse('system-design')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                settings?.activeCourse === 'system-design'
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {settings?.activeCourse === 'system-design' ? 'Currently Active' : 'Set as Active Course'}
            </button>
            <button
              onClick={() => setSelectedCourseForView('system-design')}
              className="rounded-xl border border-border/80 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer min-h-[40px]"
            >
              Curriculum
            </button>
          </div>
        </div>
      </div>

      {/* Curriculum Explorer */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3 sm:pb-4">
          <div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              AlgoMaster Source of Truth
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {activeCourseData.name} — Full Curriculum
            </h3>
          </div>

          <a
            href={activeCourseData.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline self-start sm:self-auto"
          >
            Open on AlgoMaster <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Sections Accordion */}
        <div className="space-y-2">
          {activeCourseData.sections.map((sec, sIdx) => {
            const isExpanded = !!expandedSections[sec.id];
            const completedCount = sec.resources.filter((r) => currentCompletedIds.has(r.id)).length;
            const isSectionDone = completedCount === sec.resources.length && sec.resources.length > 0;

            return (
              <div
                key={sec.id}
                className="rounded-xl border border-border/60 overflow-hidden bg-background/50"
              >
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="flex w-full items-center justify-between p-3 sm:px-4 sm:py-3 text-left hover:bg-muted/40 transition-colors cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-5 sm:w-6 flex-shrink-0">
                      #{sIdx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {sec.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {completedCount}/{sec.resources.length}
                    </span>
                    {isSectionDone && (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/40 divide-y divide-border/30 bg-muted/10 px-2 py-1">
                    {sec.resources.map((res) => {
                      const isDone = currentCompletedIds.has(res.id);
                      return (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-2.5 sm:px-3 text-xs gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-border flex-shrink-0" />
                            )}
                            <span className={`font-medium truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {res.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden xs:inline">
                              {res.resourceType}
                            </span>
                            <a
                              href={res.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-teal-600 p-1 -m-1"
                              title="Open on AlgoMaster"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
