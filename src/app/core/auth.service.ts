import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, Profile } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private token: string | null = null;
  private expiresAt = 0;
  private refreshing: Promise<void> | null = null;

  readonly user = signal<Profile | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isPremium = computed(() => this.user()?.isPremium ?? false);

  get accessToken(): string | null {
    return this.token;
  }

  get tokenNeedsRefresh(): boolean {
    return !this.token || Date.now() > this.expiresAt - 30_000;
  }

  async restoreSession(): Promise<void> {
    try {
      await this.refresh();
    } catch {
      this.clear();
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.apply(await firstValueFrom(this.http.post<AuthResponse>('/api/auth/login', { email, password })));
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.apply(
      await firstValueFrom(this.http.post<AuthResponse>('/api/auth/register', { email, password, displayName, timeZone })),
    );
  }

  async loginWithGoogle(idToken: string): Promise<void> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.apply(await firstValueFrom(this.http.post<AuthResponse>('/api/auth/google', { idToken, timeZone })));
  }

  refresh(): Promise<void> {
    this.refreshing ??= firstValueFrom(this.http.post<AuthResponse>('/api/auth/refresh', {}))
      .then((res) => this.apply(res))
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } finally {
      this.clear();
    }
  }

  setProfile(profile: Profile): void {
    this.user.set(profile);
  }

  clear(): void {
    this.token = null;
    this.expiresAt = 0;
    this.user.set(null);
  }

  private apply(res: AuthResponse): void {
    this.token = res.accessToken;
    this.expiresAt = new Date(res.expiresAt).getTime();
    this.user.set(res.user);
  }
}
