import { CourseId, StudyDay } from '@/types';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    url: string;
    courseId: CourseId;
    dayNumber: number;
  };
}

export function generateNotificationContent(
  courseName: string,
  currentDay: StudyDay | undefined,
  courseCompleted: boolean,
  hasPendingMissedDay: boolean = false
): NotificationPayload {
  if (courseCompleted) {
    return {
      title: '🎉 Course Completed!',
      body: `Congratulations! You have completed all available resources in ${courseName}.`,
      icon: '/favicon.ico',
      tag: 'course-completed',
    };
  }

  if (!currentDay) {
    return {
      title: `📚 AlgoMaster Study Tracker`,
      body: `Your lessons for ${courseName} are ready.`,
      icon: '/favicon.ico',
      tag: 'daily-reminder',
    };
  }

  // 1. If day is completed:
  if (currentDay.isCompleted) {
    return {
      title: `✅ Day ${currentDay.dayNumber} completed`,
      body: `Tomorrow's lesson is ready.`,
      icon: '/favicon.ico',
      tag: 'day-completed',
      data: {
        url: '/',
        courseId: currentDay.courseId,
        dayNumber: currentDay.dayNumber,
      },
    };
  }

  // 2. If an incomplete/pending day carried over:
  if (hasPendingMissedDay) {
    return {
      title: `⚠️ You have a pending AlgoMaster lesson`,
      body: `Complete Day ${currentDay.dayNumber} before continuing.`,
      icon: '/favicon.ico',
      tag: 'pending-reminder',
      data: {
        url: '/',
        courseId: currentDay.courseId,
        dayNumber: currentDay.dayNumber,
      },
    };
  }

  // 3. Normal daily notification:
  return {
    title: `📚 Your AlgoMaster lesson for today is ready`,
    body: `Day ${currentDay.dayNumber} — ${courseName}`,
    icon: '/favicon.ico',
    tag: 'daily-ready',
    data: {
      url: '/',
      courseId: currentDay.courseId,
      dayNumber: currentDay.dayNumber,
    },
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

export async function sendBrowserNotification(payload: NotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.tag || 'algomaster-reminder',
          data: payload.data,
        });
        return true;
      }
    }

    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      tag: payload.tag || 'algomaster-reminder',
    });
    return true;
  } catch (err) {
    console.error('Failed to send notification:', err);
    return false;
  }
}
