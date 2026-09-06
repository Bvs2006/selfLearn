export type CourseId = 'lld' | 'system-design';

export type ResourceType = 
  | 'chapter' 
  | 'exercise' 
  | 'quiz' 
  | 'design_problem' 
  | 'interview_resource';

export interface Resource {
  id: string;
  chapterId: string;
  sectionId: string;
  courseId: CourseId;
  title: string;
  resourceType: ResourceType;
  officialUrl: string;
  orderIndex: number;
  sectionOrderIndex: number;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Practice' | 'Medium' | 'Hard';
  priority: 'Essential' | 'High' | 'Normal';
}

export interface Section {
  id: string;
  courseId: CourseId;
  title: string;
  orderIndex: number;
  resources: Resource[];
}

export interface Course {
  id: CourseId;
  name: string;
  slug: CourseId;
  source: string;
  sourceUrl: string;
  description: string;
  totalResources: number;
  sections: Section[];
}

export interface StudyDayResource {
  resource: Resource;
  completed: boolean;
  completedAt?: string | null;
}

export interface StudyDay {
  dayNumber: number;
  courseId: CourseId;
  resources: StudyDayResource[];
  isCompleted: boolean;
  completedAt?: string | null;
  isActive: boolean;
  isLocked: boolean;
  isPending: boolean;
}

export interface UserSettings {
  id: string;
  activeCourse: CourseId;
  dailyResourceCount: 1 | 2 | 3 | 5;
  notificationEnabled: boolean;
  notificationTime: string; // "20:00"
  timezone: string;
  updatedAt?: string;
}

export interface CourseProgressStats {
  courseId: CourseId;
  courseName: string;
  totalDays: number;
  completedDays: number;
  pendingDays: number;
  currentDayNumber: number;
  totalResources: number;
  completedResources: number;
  percentage: number;
  isCourseCompleted: boolean;
  currentStreak: number;
  missedDaysCount: number;
}
