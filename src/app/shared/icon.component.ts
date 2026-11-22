import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICONS: Record<string, string> = {
  flame: 'M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.3-5 .2 1.6.9 2.7 2 3.2C11 9 11 5.5 12 2Zm0 13.2c-.9.8-1.5 1.6-1.5 2.6a1.5 1.5 0 0 0 3 0c0-1-.6-1.8-1.5-2.6Z',
  star: 'm12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5Z',
  crown: 'M3 7l4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Zm2 13h14v2H5v-2Z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 4a1.5 1.5 0 0 0-1 2.6V18h2v-1.4a1.5 1.5 0 0 0-1-2.6Z',
  check: 'M9.5 16.2 5.3 12l-1.8 1.8 6 6L21 8.3l-1.8-1.8L9.5 16.2Z',
  x: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6 6.4 5Z',
  trophy: 'M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1Z',
  note: 'M15 3v11.5A3.5 3.5 0 1 1 13 11.3V6.5L9 7.6v8.9A3.5 3.5 0 1 1 7 13.3V5l8-2Z',
  scroll: 'M6 3h11a3 3 0 0 1 3 3v1h-3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h3V6a3 3 0 0 1 0-3Zm2 3v12h6a1 1 0 0 0 1-1V6a3 3 0 0 1 .2-1H8.8A3 3 0 0 1 8 6Zm2 2h4v2h-4V8Zm0 4h4v2h-4v-2Z',
  steps: 'M3 19h5v-4h5v-4h5V7h3v2h-1v4h-5v4H10v4H3v-2Z',
  numbers: 'M6 4h2v16H6v-6H4v-2h2V4Zm6 2h6v2h-4v3h2a3 3 0 0 1 0 6h-4v-2h4a1 1 0 0 0 0-2h-4V6Z',
  ladder: 'M6 2h2v3h8V2h2v20h-2v-3H8v3H6V2Zm2 5v3h8V7H8Zm0 5v3h8v-3H8Z',
  'ladder-minor': 'M6 2h2v3h8V2h2v20h-2v-3H8v3H6V2Zm2 5v3h8V7H8Zm0 5v3h8v-3H8Zm9-9.5 3 1.5-3 1.5v-3Z',
  arrows: 'M7 3 2.5 8H6v8h2V8h3.5L7 3Zm10 18 4.5-5H18V8h-2v8h-3.5L17 21Z',
  cadence: 'M4 18h16v2H4v-2Zm2-3 4-9 4 6 2-3 3 6H6Z',
  home: 'M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3Z',
  learn: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3.3-6-3.3Z',
  review: 'M12 4a8 8 0 0 1 7.7 5.9l1.8-1.1.9 1.7-4.5 2.6-2.6-4.4 1.7-1 .9 1.5A6 6 0 0 0 6 12H4a8 8 0 0 1 8-8Zm8 8a8 8 0 0 1-15.7 2.1l-1.8 1-.9-1.7 4.5-2.6 2.6 4.5-1.7 1-.9-1.6A6 6 0 0 0 18 12h2Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5Z',
  gem: 'M7 3h10l4 6-9 12L3 9l4-6Zm1.2 2L6 8.5h4.3L8.2 5Zm7.6 0-2.1 3.5H18L15.8 5ZM12 5.6 10.3 8.5h3.4L12 5.6Zm-5.5 5.4 4.4 6.1-1.8-6.1H6.5Zm6.6 6.1 4.4-6.1h-2.6l-1.8 6.1ZM11 10.5l1 3.4 1-3.4h-2Z',
  play: 'M7 4v16l13-8L7 4Z',
  logout: 'M10 3h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-9v-2h9V5h-9V3Zm1.6 4.4L13 6l6 6-6 6-1.4-1.4 3.6-3.6H3v-2h12.2l-3.6-3.6Z',
  target: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  card: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 4v8h16V9H4Zm2 5h5v2H6v-2Z',
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path [attr.d]="path()" fill="currentColor" fill-rule="evenodd" />
  </svg>`,
  styles: `:host { display: inline-flex; line-height: 0; } svg { display: block; }`,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(24);
  protected readonly path = computed(() => ICONS[this.name()] ?? ICONS['note']);
}
