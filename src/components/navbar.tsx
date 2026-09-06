'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Flame, 
  Sun, 
  Moon, 
  BookOpen, 
  Layers, 
  BarChart3, 
  Calendar, 
  Settings
} from 'lucide-react';
import { CourseId, UserSettings } from '@/types';
import { loadSettings, saveSettings, loadProgress } from '@/lib/storage';
import { generateStudyDays, computeCourseStats } from '@/lib/learning-engine';

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setMounted(true);
    const initData = async () => {
      const s = await loadSettings();
      setSettings(s);
      const { completedResourceIds, dayCompletionMap } = await loadProgress(s.activeCourse);
      const days = generateStudyDays(s.activeCourse, s.dailyResourceCount, completedResourceIds, dayCompletionMap);
      const stats = computeCourseStats(s.activeCourse, days, completedResourceIds);
      setStreak(stats.currentStreak);
    };

    initData();

    const handleStorageChange = () => {
      initData();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('algomaster_progress_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('algomaster_progress_updated', handleStorageChange);
    };
  }, []);

  const handleCourseSwitch = async (courseId: CourseId) => {
    if (!settings) return;
    const newSettings = { ...settings, activeCourse: courseId };
    setSettings(newSettings);
    await saveSettings(newSettings);
    window.dispatchEvent(new Event('algomaster_progress_updated'));
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: BookOpen },
    { name: 'Courses', href: '/courses', icon: Layers },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'History', href: '/history', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-black text-xs sm:text-sm shadow-xs shadow-teal-500/30">
                AM
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold leading-tight">AlgoMaster</span>
                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tracker</span>
              </div>
            </Link>

            {/* Course Selector (Compact on mobile, full pill on desktop) */}
            {settings && (
              <div className="flex items-center rounded-lg bg-muted/70 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => handleCourseSwitch('lld')}
                  className={`rounded-md px-2 py-1 transition-all text-[11px] sm:text-xs cursor-pointer ${
                    settings.activeCourse === 'lld'
                      ? 'bg-background text-teal-600 dark:text-teal-400 shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="sm:hidden">LLD</span>
                  <span className="hidden sm:inline">Low Level Design</span>
                </button>
                <button
                  onClick={() => handleCourseSwitch('system-design')}
                  className={`rounded-md px-2 py-1 transition-all text-[11px] sm:text-xs cursor-pointer ${
                    settings.activeCourse === 'system-design'
                      ? 'bg-background text-teal-600 dark:text-teal-400 shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="sm:hidden">SD</span>
                  <span className="hidden sm:inline">System Design</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Streak & Theme */}
          <div className="flex items-center gap-2">
            {/* Streak Badge */}
            <div
              className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 sm:px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20"
              title={`${streak} day study streak`}
            >
              <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
              <span>{streak}d</span>
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile App Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-border/60 bg-background/95 backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                active
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
