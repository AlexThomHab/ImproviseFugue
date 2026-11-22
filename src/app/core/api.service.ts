import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Chapter,
  CheckAnswerResult,
  CompleteLessonResult,
  Dashboard,
  ExerciseAnswer,
  LessonPlay,
  Plans,
  Profile,
  RateResult,
  ReviewCard,
  ReviewRating,
  ReviewSummary,
  SubscriptionInfo,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private get<T>(url: string) {
    return firstValueFrom(this.http.get<T>(url));
  }
  private post<T>(url: string, body: unknown = {}) {
    return firstValueFrom(this.http.post<T>(url, body));
  }
  private put<T>(url: string, body: unknown) {
    return firstValueFrom(this.http.put<T>(url, body));
  }

  curriculum = () => this.get<Chapter[]>('/api/curriculum');
  lesson = (slug: string) => this.get<LessonPlay>(`/api/lessons/${encodeURIComponent(slug)}`);
  checkAnswer = (lessonId: number, exerciseId: number, answer: ExerciseAnswer) =>
    this.post<CheckAnswerResult>(`/api/lessons/${lessonId}/exercises/${exerciseId}/check`, { answer });
  completeLesson = (lessonId: number, answers: { exerciseId: number; answer: ExerciseAnswer }[]) =>
    this.post<CompleteLessonResult>(`/api/lessons/${lessonId}/complete`, { answers });

  dashboard = () => this.get<Dashboard>('/api/dashboard');
  reviewSummary = () => this.get<ReviewSummary>('/api/reviews/summary');
  dueReviews = (limit = 20) => this.get<ReviewCard[]>(`/api/reviews/due?limit=${limit}`);
  practiceReviews = (count = 10) => this.get<ReviewCard[]>(`/api/reviews/practice?count=${count}`);
  rateReview = (stateId: string, rating: ReviewRating, practice: boolean) =>
    this.post<RateResult>(`/api/reviews/${stateId}/rate`, { rating, practice });

  me = () => this.get<Profile>('/api/me');
  updateProfile = (changes: Partial<Pick<Profile, 'displayName' | 'dailyGoalXp' | 'timeZone' | 'soundEnabled'>>) =>
    this.put<Profile>('/api/me', changes);
  changePassword = (currentPassword: string, newPassword: string) =>
    this.post<void>('/api/me/password', { currentPassword, newPassword });

  plans = () => this.get<Plans>('/api/billing/plans');
  subscription = () => this.get<SubscriptionInfo>('/api/billing/subscription');
  checkout = () => this.post<{ url: string }>('/api/billing/checkout');
  portal = () => this.post<{ url: string }>('/api/billing/portal');
  setDevPremium = (enabled: boolean) => this.post<void>('/api/billing/dev/premium', { enabled });
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Is the API running?';
    return err.error?.title ?? fallback;
  }
  return fallback;
}

export function errorCode(err: unknown): string | undefined {
  return err instanceof HttpErrorResponse ? err.error?.code : undefined;
}
