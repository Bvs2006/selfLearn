'use client';

import { useEffect } from 'react';
import { loadSettings } from '@/lib/storage';
import { generateNotificationContent, sendBrowserNotification } from '@/lib/notifications';
import { loadProgress } from '@/lib/storage';
import { getCourse, generateStudyDays } from '@/lib/learning-engine';

export function PwaRegister() {
  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }

    // 2. Schedule Daily Check
    const checkReminder = async () => {
      try {
        const settings = await loadSettings();
        if (!settings.notificationEnabled) return;

        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        // Check if current time matches scheduled notificationTime (within current minute window)
        const lastSentKey = `algomaster_last_notification_${now.toDateString()}`;
        const alreadySentToday = localStorage.getItem(lastSentKey);

        if (currentTime === settings.notificationTime && !alreadySentToday) {
          const { completedResourceIds, dayCompletionMap } = await loadProgress(settings.activeCourse);
          const { generateStudyDays } = await import('@/lib/learning-engine');
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
            localStorage.setItem(lastSentKey, 'true');
          }
        }
      } catch (err) {
        console.error('Error during scheduled notification check:', err);
      }
    };

    const interval = setInterval(checkReminder, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, []);

  return null;
}
