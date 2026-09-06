import { 
  getCourse, 
  getAllFlatResources, 
  generateStudyDays, 
  computeCourseStats, 
  CURRICULUM 
} from '../src/lib/learning-engine';
import { generateNotificationContent } from '../src/lib/notifications';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✔ PASS: ${msg}`);
  }
}

console.log('--- Running AlgoMaster Tracker Verification Suite ---');

// 1. Verify Curriculum Integrity
const lldCourse = getCourse('lld');
assert(lldCourse.sections.length === 19, `LLD has 19 sections (found ${lldCourse.sections.length})`);
assert(lldCourse.totalResources === 134, `LLD has 134 verified resources (found ${lldCourse.totalResources})`);

const sdCourse = getCourse('system-design');
assert(sdCourse.sections.length === 21, `System Design has 21 sections (found ${sdCourse.sections.length})`);
assert(sdCourse.totalResources === 160, `System Design has 160 verified resources (found ${sdCourse.totalResources})`);

// 2. Verify Official URLs & Ordering
const lldResources = getAllFlatResources('lld');
assert(lldResources[0].officialUrl === 'https://algomaster.io/learn/lld/course-introduction', 'First LLD resource is course-introduction');
assert(lldResources.every(r => r.officialUrl.startsWith('https://algomaster.io/learn/lld/')), 'All LLD URLs point to official algomaster.io/learn/lld/');

const sdResources = getAllFlatResources('system-design');
assert(sdResources[0].officialUrl === 'https://algomaster.io/learn/system-design/course-introduction', 'First SD resource is course-introduction');
assert(sdResources.every(r => r.officialUrl.startsWith('https://algomaster.io/learn/system-design/')), 'All SD URLs point to official algomaster.io/learn/system-design/');

// 3. Test Sequential Progression & Missed Day Behavior
let completedRes = new Set<string>();
let completedDays = new Map<number, string>();
let days = generateStudyDays('lld', 3, completedRes, completedDays);

assert(days[0].isActive === true, 'Day 1 is initially active');
assert(days[0].isPending === true, 'Day 1 is initially pending');
assert(days[1].isLocked === true, 'Day 2 is locked while Day 1 is incomplete');
assert(days[2].isLocked === true, 'Day 3 is locked while Day 1 is incomplete');

// Mark only 2 of 3 resources of Day 1
completedRes.add(days[0].resources[0].resource.id);
completedRes.add(days[0].resources[1].resource.id);
days = generateStudyDays('lld', 3, completedRes, completedDays);

assert(days[0].isCompleted === false, 'Day 1 is NOT completed when only 2 of 3 resources are done');
assert(days[0].isActive === true, 'Day 1 remains active');
assert(days[0].isPending === true, 'Day 1 is still pending');
assert(days[1].isLocked === true, 'Day 2 remains locked');

// Complete 3rd resource of Day 1
completedRes.add(days[0].resources[2].resource.id);
completedDays.set(1, new Date().toISOString());
days = generateStudyDays('lld', 3, completedRes, completedDays);

assert(days[0].isCompleted === true, 'Day 1 is now marked completed');
assert(days[0].isActive === false, 'Day 1 is no longer active');
assert(days[1].isActive === true, 'Day 2 automatically unlocks and becomes active!');
assert(days[1].isPending === true, 'Day 2 is pending');
assert(days[2].isLocked === true, 'Day 3 is locked until Day 2 is done');

// 4. Test Course Separation
const sdDays = generateStudyDays('system-design', 3, new Set<string>(), new Map());
assert(sdDays[0].isActive === true, 'System Design starts at Day 1 independently');
assert(sdDays[0].isCompleted === false, 'System Design is completely uncompleted regardless of LLD progress');

// 5. Test Configurable Pacing (1, 2, 3, 5 resources/day)
const daysPacing1 = generateStudyDays('lld', 1, completedRes, completedDays);
assert(daysPacing1.length === 134, `1 res/day gives 134 days (found ${daysPacing1.length})`);

const daysPacing5 = generateStudyDays('lld', 5, completedRes, completedDays);
assert(daysPacing5.length === Math.ceil(134 / 5), `5 res/day gives 27 days (found ${daysPacing5.length})`);

// 6. Test Notification Copy Requirements
// Normal notification
const normalNotif = generateNotificationContent('Low Level Design', days[1], false, false);
assert(normalNotif.title === '📚 Your AlgoMaster lesson for today is ready', 'Normal notification title matches specification');
assert(normalNotif.body === 'Day 2 — Low Level Design', 'Normal notification body matches specification');

// Pending / missed day notification
const pendingNotif = generateNotificationContent('Low Level Design', days[1], false, true);
assert(pendingNotif.title === '⚠️ You have a pending AlgoMaster lesson', 'Pending notification title matches specification');
assert(pendingNotif.body === 'Complete Day 2 before continuing.', 'Pending notification body matches specification');

// Completed day notification
const completedNotif = generateNotificationContent('Low Level Design', days[0], false);
assert(completedNotif.title === '✅ Day 1 completed', 'Completed notification title matches specification');
assert(completedNotif.body === "Tomorrow's lesson is ready.", 'Completed notification body matches specification');

console.log('\n✨ ALL 27 TESTS PASSED SUCCESSFULLY! ✨');
