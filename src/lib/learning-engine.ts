import { Course, CourseId, Resource, StudyDay, StudyDayResource, CourseProgressStats } from '@/types';
import rawCurriculum from '@/data/curriculum.json';

export const CURRICULUM = rawCurriculum as unknown as { courses: Course[] };

export function getCourse(courseId: CourseId): Course {
  const found = CURRICULUM.courses.find((c) => c.id === courseId);
  if (!found) {
    throw new Error(`Course ${courseId} not found in AlgoMaster curriculum`);
  }
  return found;
}

export function getAllFlatResources(courseId: CourseId): Resource[] {
  const course = getCourse(courseId);
  const resources: Resource[] = [];
  course.sections.forEach((sec) => {
    resources.push(...sec.resources);
  });
  // Sort strictly by original AlgoMaster orderIndex
  return resources.sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Buckets all resources of a course sequentially into StudyDays based on dailyResourceCount (1, 2, 3, 5).
 * AlgoMaster's original ordering is strictly preserved.
 */
export function generateStudyDays(
  courseId: CourseId,
  dailyResourceCount: 1 | 2 | 3 | 5,
  completedResourceIds: Set<string>,
  dayCompletionMap: Map<number, string> // dayNumber -> completedAt ISO string
): StudyDay[] {
  const allResources = getAllFlatResources(courseId);
  const total = allResources.length;
  const daysCount = Math.ceil(total / dailyResourceCount);
  const days: StudyDay[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const startIndex = (d - 1) * dailyResourceCount;
    const endIndex = Math.min(startIndex + dailyResourceCount, total);
    const dayResourcesList = allResources.slice(startIndex, endIndex);

    const mappedResources: StudyDayResource[] = dayResourcesList.map((res) => ({
      resource: res,
      completed: completedResourceIds.has(res.id),
      completedAt: null,
    }));

    const allResourcesDone = mappedResources.every((r) => r.completed);
    const recordedCompleted = dayCompletionMap.has(d);
    const isCompleted = allResourcesDone || recordedCompleted;
    const completedAt = dayCompletionMap.get(d) || (allResourcesDone ? new Date().toISOString() : null);

    days.push({
      dayNumber: d,
      courseId,
      resources: mappedResources,
      isCompleted,
      completedAt,
      isActive: false,
      isLocked: false,
      isPending: false,
    });
  }

  // Determine current active day using the strict sequential algorithm:
  // Find the earliest study day where completed != true.
  // Never return a later day while an earlier day remains incomplete.
  let activeAssigned = false;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (day.isCompleted) {
      day.isActive = false;
      day.isLocked = false;
      day.isPending = false;
    } else {
      if (!activeAssigned) {
        day.isActive = true;
        day.isLocked = false;
        // If it's incomplete and active, it is pending
        day.isPending = true;
        activeAssigned = true;
      } else {
        // Any day after the first incomplete day is LOCKED
        day.isActive = false;
        day.isLocked = true;
        day.isPending = false;
      }
    }
  }

  return days;
}

/**
 * Computes course progress stats, streaks, and completion percentages.
 */
export function computeCourseStats(
  courseId: CourseId,
  days: StudyDay[],
  completedResourceIds: Set<string>
): CourseProgressStats {
  const course = getCourse(courseId);
  const totalDays = days.length;
  const completedDays = days.filter((d) => d.isCompleted).length;
  const activeDay = days.find((d) => d.isActive);
  const currentDayNumber = activeDay ? activeDay.dayNumber : totalDays;
  const isCourseCompleted = totalDays > 0 && completedDays === totalDays;

  const allResources = getAllFlatResources(courseId);
  const completedResources = allResources.filter((r) => completedResourceIds.has(r.id)).length;
  const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Pending days are days that have started or are due but not completed (the active incomplete day)
  const pendingDays = activeDay ? 1 : 0;
  // Missed days calculation: if today's active day has not been touched and previous days were finished on earlier dates
  const missedDaysCount = activeDay && activeDay.resources.every(r => !r.completed) ? 1 : 0;

  // Calculate streak based on completed day timestamps
  const streak = calculateStreak(days);

  return {
    courseId,
    courseName: course.name,
    totalDays,
    completedDays,
    pendingDays,
    currentDayNumber,
    totalResources: allResources.length,
    completedResources,
    percentage,
    isCourseCompleted,
    currentStreak: streak,
    missedDaysCount,
  };
}

function calculateStreak(days: StudyDay[]): number {
  const completedDaysWithDates = days
    .filter((d) => d.isCompleted && d.completedAt)
    .map((d) => new Date(d.completedAt!).toDateString());

  if (completedDaysWithDates.length === 0) {
    // If some days are completed without stored dates, count them up to current
    return days.filter(d => d.isCompleted).length > 0 ? 1 : 0;
  }

  const uniqueDates = Array.from(new Set(completedDaysWithDates)).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return uniqueDates.length;
}
