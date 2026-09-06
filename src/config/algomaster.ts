export interface CourseSourceConfig {
  id: 'lld' | 'system-design';
  name: string;
  sourceUrl: string;
  courseRootUrl: string;
}

export const ALGOMASTER_COURSES_CONFIG: CourseSourceConfig[] = [
  {
    id: 'lld',
    name: 'Low Level Design',
    sourceUrl: 'https://algomaster.io/learn/lld/course-introduction',
    courseRootUrl: 'https://algomaster.io/learn/lld',
  },
  {
    id: 'system-design',
    name: 'System Design',
    sourceUrl: 'https://algomaster.io/learn/system-design/course-introduction',
    courseRootUrl: 'https://algomaster.io/learn/system-design',
  },
];
