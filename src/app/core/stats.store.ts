import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Dashboard } from './models';

@Injectable({ providedIn: 'root' })
export class StatsStore {
  private readonly api = inject(ApiService);
  readonly dashboard = signal<Dashboard | null>(null);
  private inflight: Promise<Dashboard> | null = null;

  refresh(): Promise<Dashboard> {
    this.inflight ??= this.api
      .dashboard()
      .then((d) => {
        this.dashboard.set(d);
        return d;
      })
      .finally(() => (this.inflight = null));
    return this.inflight;
  }
}
