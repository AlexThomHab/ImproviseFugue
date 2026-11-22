import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SubscriptionInfo } from '../core/models';
import { StatsStore } from '../core/stats.store';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-account',
  imports: [FormsModule, RouterLink, DatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Account</h1>
    <div class="grid">
      <form class="leaf stack" (ngSubmit)="saveProfile()">
        <h3>Profile</h3>
        @if (profileMsg(); as m) {
          <div class="alert" [class.success]="m.ok" [class.error]="!m.ok">{{ m.text }}</div>
        }
        <div class="field">
          <label for="name">Display name</label>
          <input id="name" class="input" name="displayName" [(ngModel)]="displayName" maxlength="64" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input class="input" [value]="auth.user()?.email" disabled />
        </div>
        <div class="field">
          <label for="goal">Daily goal</label>
          <select id="goal" class="input" name="goal" [(ngModel)]="dailyGoalXp">
            @for (g of goals; track g.xp) {
              <option [ngValue]="g.xp">{{ g.label }} · {{ g.xp }} XP / day</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="tz">Time zone</label>
          <select id="tz" class="input" name="tz" [(ngModel)]="timeZone">
            @for (tz of timeZones; track tz) {
              <option [value]="tz">{{ tz }}</option>
            }
          </select>
          <span class="muted small">Used to decide when your day (and streak) rolls over.</span>
        </div>
        <label class="check"><input type="checkbox" name="sound" [(ngModel)]="soundEnabled" /> Sound effects</label>
        <button class="btn" type="submit" [disabled]="busy()">Save changes</button>
      </form>

      <div class="stack">
        <section class="leaf stack">
          <div class="row">
            <h3>Subscription</h3>
            <span class="spacer"></span>
            <span class="pill" [class.gold]="sub()?.tier === 'Premium'">
              @if (sub()?.tier === 'Premium') { <app-icon name="crown" [size]="14" /> }
              {{ sub()?.tier ?? '…' }}
            </span>
          </div>
          @if (sub(); as s) {
            @if (s.tier === 'Premium' && s.currentPeriodEnd) {
              <p class="muted small">
                {{ s.cancelAtPeriodEnd ? 'Ends on' : 'Renews on' }} {{ s.currentPeriodEnd | date: 'mediumDate' }}
              </p>
            }
            @if (s.devGranted) {
              <p class="alert info small">Premium granted by the development toggle.</p>
            }
            @if (s.hasBillingAccount && s.billingConfigured) {
              <button class="btn ghost" (click)="portal()" [disabled]="busy()">Manage subscription</button>
            } @else if (s.tier !== 'Premium') {
              <a class="btn gold" routerLink="/premium">Unlock the full course</a>
            }
            @if (s.devToggleAvailable) {
              <div class="dev">
                <span class="small"><strong>Dev only:</strong> toggle Premium without Stripe</span>
                <button class="btn small ghost" (click)="toggleDev(!s.devGranted)">{{ s.devGranted ? 'Revoke' : 'Grant' }}</button>
              </div>
            }
          }
          @if (billingMsg()) {
            <div class="alert error">{{ billingMsg() }}</div>
          }
        </section>

        <form class="leaf stack" (ngSubmit)="changePassword()">
          <h3>Password</h3>
          @if (pwMsg(); as m) {
            <div class="alert" [class.success]="m.ok" [class.error]="!m.ok">{{ m.text }}</div>
          }
          <div class="field">
            <label for="cur">Current password</label>
            <input id="cur" class="input" type="password" name="current" [(ngModel)]="currentPassword" autocomplete="current-password" required />
          </div>
          <div class="field">
            <label for="new">New password</label>
            <input id="new" class="input" type="password" name="new" [(ngModel)]="newPassword" autocomplete="new-password" minlength="8" required />
          </div>
          <button class="btn ghost" type="submit" [disabled]="busy()">Change password</button>
        </form>

        <button class="btn ghost" (click)="logout()">Sign out</button>
      </div>
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; margin-top: 1rem; }
    h3 { margin: 0; }
    .dev { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.6rem 0.8rem; border-radius: 12px; border: 2px dashed var(--line); }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class AccountPage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly stats = inject(StatsStore);

  protected displayName = this.auth.user()?.displayName ?? '';
  protected dailyGoalXp = this.auth.user()?.dailyGoalXp ?? 20;
  protected timeZone = this.auth.user()?.timeZone ?? 'UTC';
  protected soundEnabled = this.auth.user()?.soundEnabled ?? true;
  protected currentPassword = '';
  protected newPassword = '';

  protected readonly goals = [
    { xp: 10, label: 'Casual' },
    { xp: 20, label: 'Regular' },
    { xp: 30, label: 'Serious' },
    { xp: 50, label: 'Intense' },
  ];
  protected readonly timeZones = this.zoneList();

  protected readonly sub = signal<SubscriptionInfo | null>(null);
  protected readonly busy = signal(false);
  protected readonly profileMsg = signal<{ ok: boolean; text: string } | null>(null);
  protected readonly pwMsg = signal<{ ok: boolean; text: string } | null>(null);
  protected readonly billingMsg = signal<string | null>(null);

  constructor() {
    void this.loadSubscription();
  }

  private zoneList(): string[] {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
    const current = this.auth.user()?.timeZone ?? 'UTC';
    return Array.from(new Set(['UTC', current, ...supported]));
  }

  private async loadSubscription(): Promise<void> {
    try {
      this.sub.set(await this.api.subscription());
    } catch (e) {
      this.billingMsg.set(errorMessage(e));
    }
  }

  protected async saveProfile(): Promise<void> {
    this.busy.set(true);
    this.profileMsg.set(null);
    try {
      const p = await this.api.updateProfile({
        displayName: this.displayName,
        dailyGoalXp: this.dailyGoalXp,
        timeZone: this.timeZone,
        soundEnabled: this.soundEnabled,
      });
      this.auth.setProfile(p);
      this.profileMsg.set({ ok: true, text: 'Saved.' });
      void this.stats.refresh().catch(() => undefined);
    } catch (e) {
      this.profileMsg.set({ ok: false, text: errorMessage(e) });
    } finally {
      this.busy.set(false);
    }
  }

  protected async changePassword(): Promise<void> {
    this.busy.set(true);
    this.pwMsg.set(null);
    try {
      await this.api.changePassword(this.currentPassword, this.newPassword);
      this.currentPassword = this.newPassword = '';
      this.pwMsg.set({ ok: true, text: 'Password changed. Other devices have been signed out.' });
    } catch (e) {
      this.pwMsg.set({ ok: false, text: errorMessage(e) });
    } finally {
      this.busy.set(false);
    }
  }

  protected async portal(): Promise<void> {
    this.busy.set(true);
    try {
      window.location.href = (await this.api.portal()).url;
    } catch (e) {
      this.billingMsg.set(errorMessage(e));
      this.busy.set(false);
    }
  }

  protected async toggleDev(enabled: boolean): Promise<void> {
    try {
      await this.api.setDevPremium(enabled);
      this.auth.setProfile(await this.api.me());
      await this.loadSubscription();
      void this.stats.refresh().catch(() => undefined);
    } catch (e) {
      this.billingMsg.set(errorMessage(e));
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.stats.dashboard.set(null);
    await this.router.navigateByUrl('/');
  }
}
