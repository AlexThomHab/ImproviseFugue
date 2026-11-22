export interface Profile {
  id: string;
  email: string;
  displayName: string;
  dailyGoalXp: number;
  timeZone: string;
  soundEnabled: boolean;
  createdAt: string;
  isPremium: boolean;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: Profile;
}

export type LessonState = 'Locked' | 'Available' | 'Completed' | 'Mastered';

export interface LessonNode {
  id: number;
  slug: string;
  title: string;
  summary: string;
  kind: 'lesson' | 'practice';
  icon: string;
  xpReward: number;
  state: LessonState;
  requiresPremium: boolean;
  completionCount: number;
  bestScore: number;
  prerequisiteSlugs: string[];
}

export interface Chapter {
  id: number;
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  isPremium: boolean;
  premiumLocked: boolean;
  totalLessons: number;
  completedLessons: number;
  masteredLessons: number;
  progressPercent: number;
  lessons: LessonNode[];
}

export interface NotationNote {
  keys: string[];
  duration: string;
  figures?: string[];
  label?: string;
  highlight?: boolean;
}

export interface Notation {
  clef: 'bass' | 'treble';
  keySignature?: string;
  timeSignature?: string;
  notes: NotationNote[];
}

export interface InfoContent {
  title: string;
  body?: string[];
  notation?: Notation;
}

export interface MultipleChoiceContent {
  prompt: string;
  options: string[];
  notation?: Notation;
}

export interface OrderingContent {
  prompt: string;
  items: { id: string; label: string }[];
}

export interface KeyboardContent {
  prompt: string;
  notation?: Notation;
  lowMidi?: number;
  highMidi?: number;
}

export type ExerciseType = 'info' | 'multipleChoice' | 'ordering' | 'keyboard';

export interface Exercise {
  id: number;
  key: string;
  type: ExerciseType;
  graded: boolean;
  content: any;
}

export type ExerciseAnswer = { selectedIndex: number } | { order: string[] } | { midi: number[] };

export interface LessonPlay {
  id: number;
  slug: string;
  title: string;
  summary: string;
  kind: 'lesson' | 'practice';
  xpReward: number;
  state: LessonState;
  chapterSlug: string;
  chapterTitle: string;
  completionCount: number;
  exercises: Exercise[];
}

export interface CheckAnswerResult {
  isCorrect: boolean;
  explanation?: string;
  correctAnswer?: any;
}

export interface LessonRef {
  id: number;
  slug: string;
  title: string;
}

export interface CompleteLessonResult {
  xpEarned: number;
  score: number;
  correctCount: number;
  gradedCount: number;
  firstCompletion: boolean;
  isMastered: boolean;
  newlyMastered: boolean;
  reviewItemsScheduled: number;
  currentStreak: number;
  streakExtended: boolean;
  unlockedLessons: LessonRef[];
  nextLesson: LessonRef | null;
}

export type ReviewRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface ReviewCard {
  stateId: string;
  reviewItemId: number;
  front: string;
  back: string;
  hint?: string;
  notation?: Notation;
  lessonSlug: string;
  lessonTitle: string;
  repetitions: number;
  intervalDays: number;
  dueAt: string;
}

export interface ReviewSummary {
  dueNow: number;
  dueToday: number;
  totalLearned: number;
  reviewedToday: number;
  upcoming: { date: string; count: number }[];
}

export interface RateResult {
  stateId: string;
  nextDueAt: string;
  intervalDays: number;
  xpEarned: number;
  currentStreak: number;
  streakExtended: boolean;
}

export interface Dashboard {
  displayName: string;
  isPremium: boolean;
  totalXp: number;
  xpToday: number;
  dailyGoalXp: number;
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  lessonsCompleted: number;
  lessonsMastered: number;
  totalLessons: number;
  nextLesson: LessonNode | null;
  reviews: ReviewSummary;
  chapters: {
    slug: string;
    number: number;
    title: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    premiumLocked: boolean;
  }[];
  lastSevenDays: { date: string; xp: number }[];
}

export interface Plan {
  id: 'free' | 'premium';
  name: string;
  tier: string;
  unitAmount: number | null;
  currency: string | null;
  interval: string | null;
  intervalCount: number | null;
  features: string[];
}

export interface Plans {
  billingConfigured: boolean;
  plans: Plan[];
}

export interface SubscriptionInfo {
  tier: 'Free' | 'Premium';
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBillingAccount: boolean;
  billingConfigured: boolean;
  devToggleAvailable: boolean;
  devGranted: boolean;
}
