import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorCode, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Plan, Plans } from '../core/models';
import { StatsStore } from '../core/stats.store';

@Component({
  selector: 'app-premium',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <h1>From the Rule of the Octave to the fugue.</h1>
      <p class="lede">
        Chapter 1 gives you the foundation every Neapolitan student started with. Premium opens the rest of the course: cadences, sequences,
        imitation, and finally improvised fugue.
      </p>
    </header>

    @if (checkout() === 'success') {
      <div class="alert success">Payment received. Premium switches on as soon as Stripe confirms it, usually within a few seconds.</div>
    } @else if (checkout() === 'cancelled') {
      <div class="alert info">Checkout was cancelled and you have not been charged.</div>
    }
    @if (error(); as e) {
      <div class="alert" [class.warn]="notConfigured()" [class.error]="!notConfigured()">{{ e }}</div>
    }

    @if (plans(); as p) {
      @if (!p.billingConfigured) {
        <div class="alert warn">
          Payments are not set up on this server yet. Add <code>Stripe__SecretKey</code>, <code>Stripe__PremiumPriceId</code> and
          <code>Stripe__WebhookSecret</code> to the API to enable checkout.
        </div>
      }
      <div class="plans">
        @for (plan of p.plans; track plan.id) {
          @if (plan.id === 'premium') {
            <article class="leaf plan premium">
              <span class="seal" aria-hidden="true">P</span>
              <h2>Full course</h2>
              <p class="price numeral">{{ priceLabel(plan) }}</p>
              <ul>
                @for (f of plan.features; track f) { <li>{{ f }}</li> }
              </ul>
              @if (auth.isPremium()) {
                <a class="btn ghost block" routerLink="/account">You have Premium. Manage it</a>
              } @else {
                <button class="btn gold block" (click)="upgrade()" [disabled]="busy() || !p.billingConfigured">
                  {{ busy() ? 'Opening secure checkout…' : 'Unlock the full course' }}
                </button>
                <p class="fine">Cancel any time from your account. Your progress is always kept.</p>
              }
            </article>
          } @else {
            <article class="plan free">
              <h2>Chapter 1</h2>
              <p class="price">Free</p>
              <ul>
                @for (f of plan.features; track f) { <li>{{ f }}</li> }
              </ul>
              <a routerLink="/learn">{{ auth.isPremium() ? 'Included with Premium' : 'Continue with Chapter 1' }}</a>
            </article>
          }
        }
      </div>
      <p class="muted small center">Payments are handled securely by Stripe.</p>
    } @else if (!error()) {
      <div class="spinner"></div>
    }
  `,
  styles: `
    .head { max-width: 40rem; margin-bottom: 2.25rem; }
    .lede { font-size: 1.12rem; color: var(--ink-soft); }
    .alert { margin-bottom: 1.25rem; }
    .plans { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 2rem; align-items: start; margin: 1rem 0 1.5rem; }
    .plan { display: flex; flex-direction: column; gap: 0.75rem; }
    .plan h2 { margin: 0; }
    .free { padding: 1.75rem; background: var(--paper-deep); border-radius: var(--radius-lg); }
    .premium { padding: 2.25rem; outline: 3px solid var(--violet); outline-offset: -3px; }
    .seal { position: absolute; top: -22px; right: 24px; width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center;
      background: radial-gradient(circle at 35% 30%, #c43c51, var(--lacca) 60%, var(--lacca-deep)); color: #f6e6bd; font: italic 700 1.5rem var(--font-display);
      box-shadow: 0 3px 8px rgba(42, 30, 22, 0.3); }
    .price { font: 600 1.6rem var(--font-display); color: var(--cobalt-deep); margin: 0; }
    .plan ul { list-style: none; padding: 0; margin: 0.25rem 0 1rem; }
    .plan li { padding: 0.45rem 0 0.45rem 1.25rem; border-bottom: 1px solid var(--rule-soft); position: relative; }
    .plan li::before { content: ''; position: absolute; left: 0; top: 1em; width: 8px; height: 6px; border-radius: 50%; background: var(--ink); transform: rotate(-22deg); }
    .premium li::before { background: var(--naples-deep); }
    .free a { font-weight: 700; }
    .fine { font-size: 0.88rem; color: var(--muted); margin: 0; text-align: center; }
    code { font-size: 0.85em; background: rgba(42, 30, 22, 0.07); padding: 1px 4px; border-radius: 3px; }
    @media (max-width: 760px) { .plans { grid-template-columns: 1fr; } .premium { order: -1; padding: 1.75rem 1.25rem; } }
  `,
})
export class PremiumPage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly stats = inject(StatsStore);

  readonly checkout = input<'success' | 'cancelled' | undefined>();

  protected readonly plans = signal<Plans | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notConfigured = signal(false);
  protected readonly busy = signal(false);

  constructor() {
    this.api
      .plans()
      .then((p) => this.plans.set(p))
      .catch((e) => this.error.set(errorMessage(e)));
  }

  ngOnInit(): void {
    if (this.checkout() === 'success') void this.pollForPremium();
  }

  protected priceLabel(plan: Plan): string {
    if (plan.unitAmount == null || !plan.currency) return 'Price shown at checkout';
    const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency.toUpperCase() }).format(plan.unitAmount / 100);
    if (!plan.interval) return amount;
    const n = plan.intervalCount ?? 1;
    return `${amount} per ${n > 1 ? n + ' ' + plan.interval + 's' : plan.interval}`;
  }

  protected async upgrade(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      window.location.href = (await this.api.checkout()).url;
    } catch (e) {
      this.notConfigured.set(errorCode(e) === 'billing_not_configured');
      this.error.set(errorMessage(e));
      this.busy.set(false);
    }
  }

  private async pollForPremium(): Promise<void> {
    for (let i = 0; i < 10 && !this.auth.isPremium(); i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        this.auth.setProfile(await this.api.me());
      } catch {
        return;
      }
    }
    void this.stats.refresh().catch(() => undefined);
  }
}
