import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, input, output, signal, viewChild } from '@angular/core';
import { GOOGLE_CLIENT_ID } from '../core/app-settings';

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

let gisScript: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  gisScript ??= new Promise((resolve, reject) => {
    const existing = (window as unknown as { google?: GoogleIdentity }).google;
    if (existing?.accounts?.id) return resolve(existing);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve((window as unknown as { google: GoogleIdentity }).google);
    s.onerror = () => reject(new Error('Google sign-in could not be loaded.'));
    document.head.appendChild(s);
  });
  return gisScript;
}

@Component({
  selector: 'app-google-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (configured) {
      <div #host class="gis"></div>
    } @else {
      <button type="button" class="google" (click)="unavailable.set(true)">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
          <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {{ mode() === 'signup' ? 'Sign up with Google' : 'Sign in with Google' }}
      </button>
      @if (unavailable()) {
        <p class="note" role="status">Google sign-in is not set up on this server yet. Use your email and password for now.</p>
      }
    }
    @if (error()) {
      <p class="note" role="alert">{{ error() }}</p>
    }
  `,
  styles: `
    :host { display: block; }
    .gis { display: flex; justify-content: center; min-height: 44px; }
    .google { width: 100%; min-height: 46px; display: inline-flex; align-items: center; justify-content: center; gap: 0.65rem;
      background: #fff; color: #1f1f1f; border: 1px solid #747775; border-radius: var(--radius); font: 500 0.98rem 'Roboto', var(--font-ui); cursor: pointer; }
    .google:hover { background: #f8f9fa; }
    .note { margin: 0.6rem 0 0; font-size: 0.88rem; color: var(--muted); text-align: center; }
  `,
})
export class GoogleSignInComponent {
  readonly mode = input<'signin' | 'signup'>('signin');
  readonly credential = output<string>();

  protected readonly configured = GOOGLE_CLIENT_ID.trim().length > 0;
  protected readonly unavailable = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly host = viewChild<ElementRef<HTMLDivElement>>('host');

  constructor() {
    afterNextRender(() => {
      const el = this.host()?.nativeElement;
      if (!this.configured || !el) return;
      loadGoogleIdentity()
        .then((google) => {
          google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => this.credential.emit(r.credential) });
          google.accounts.id.renderButton(el, {
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            text: this.mode() === 'signup' ? 'signup_with' : 'signin_with',
            width: Math.min(400, el.clientWidth || 360),
          });
        })
        .catch((e: Error) => this.error.set(e.message));
    });
  }
}
