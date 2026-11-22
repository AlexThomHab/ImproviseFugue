import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { GoogleSignInComponent } from '../shared/google-sign-in.component';
import { MascotComponent } from '../shared/mascot.component';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink, GoogleSignInComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <a routerLink="/" class="brand"><span class="logo">IF</span> Improvising Fugue</a>

      <section class="card panel">
        <app-mascot class="peek" [mood]="isRegister() ? 'wave' : 'happy'" [size]="96" />
        <h1>{{ isRegister() ? 'Create your account' : 'Welcome back!' }}</h1>
        <p class="muted intro">
          {{ isRegister() ? 'Start Chapter 1 for free. Your progress is saved as you go.' : 'Nice to see you again. Pick up where you left off.' }}
        </p>

        @if (error()) {
          <div class="alert error" role="alert">{{ error() }}</div>
        }

        <app-google-sign-in [mode]="isRegister() ? 'signup' : 'signin'" (credential)="google($event)" />

        <div class="or" role="separator"><span>or use your email</span></div>

        <form class="stack" (ngSubmit)="submit()" #f="ngForm">
          @if (isRegister()) {
            <div class="field">
              <label for="name">Your name</label>
              <input id="name" class="input" name="displayName" [(ngModel)]="displayName" maxlength="64" autocomplete="nickname" />
            </div>
          }
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" name="password" [(ngModel)]="password" required
              [attr.minlength]="isRegister() ? 8 : null" [autocomplete]="isRegister() ? 'new-password' : 'current-password'" />
            @if (isRegister()) {
              <span class="muted small">At least 8 characters.</span>
            }
          </div>

          <button class="btn block" type="submit" [disabled]="busy() || !f.valid">
            {{ busy() ? 'One moment…' : isRegister() ? 'Create account' : 'Sign in' }}
          </button>
        </form>

        <p class="switch">
          @if (isRegister()) {
            Already have an account? <a routerLink="/login">Sign in</a>
          } @else {
            New here? <a routerLink="/register">Create an account</a>
          }
        </p>
      </section>
    </div>
  `,
  styles: `
    .page { max-width: 460px; margin: 0 auto; padding: 1.75rem 16px 4rem; display: flex; flex-direction: column; align-items: center; gap: 3.5rem; }
    .brand { display: flex; align-items: center; gap: 0.6rem; font: 600 1.3rem var(--font-display); color: var(--ink); }
    .brand:hover { text-decoration: none; }
    .logo { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: var(--violet); color: #fff; font-size: 1rem;
      box-shadow: 0 4px 0 var(--violet-deep); }
    .panel { width: 100%; display: flex; flex-direction: column; gap: 1.1rem; padding: 3.25rem 1.75rem 1.75rem; }
    .peek { position: absolute; top: -62px; left: 50%; transform: translateX(-50%); }
    h1 { font-size: 1.9rem; margin: 0; text-align: center; }
    .intro { margin: -0.4rem 0 0.2rem; text-align: center; }
    .or { display: flex; align-items: center; gap: 0.75rem; color: var(--muted); font-size: 0.9rem; font-weight: 600; }
    .or::before, .or::after { content: ''; flex: 1; border-top: 2px solid var(--rule-soft); }
    .switch { text-align: center; margin: 0.25rem 0 0; }
  `,
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = input<'login' | 'register'>('login');
  readonly returnUrl = input<string | undefined>();
  protected readonly isRegister = computed(() => this.mode() === 'register');

  protected email = '';
  protected password = '';
  protected displayName = '';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): Promise<void> {
    return this.run(() =>
      this.isRegister() ? this.auth.register(this.email, this.password, this.displayName) : this.auth.login(this.email, this.password),
    );
  }

  protected google(credential: string): Promise<void> {
    return this.run(() => this.auth.loginWithGoogle(credential));
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
      const target = this.returnUrl()?.startsWith('/') ? this.returnUrl()! : this.isRegister() ? '/learn' : '/dashboard';
      await this.router.navigateByUrl(target);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}
