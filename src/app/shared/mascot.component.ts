import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MascotMood = 'wave' | 'happy' | 'cheer' | 'think';

@Component({
  selector: 'app-mascot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 160 184" [attr.width]="size()" [attr.height]="size() * 1.15" role="img" aria-label="Cartoon of Johann Sebastian Bach">
      <ellipse cx="80" cy="178" rx="46" ry="6" fill="#24204d" opacity="0.08" />

      <g class="wig" fill="#f6f1e7" stroke="#d8ccb8" stroke-width="2">
        <circle cx="44" cy="84" r="11" />
        <circle cx="39" cy="101" r="12" />
        <circle cx="41" cy="119" r="12" />
        <circle cx="48" cy="135" r="11" />
        <circle cx="116" cy="84" r="11" />
        <circle cx="121" cy="101" r="12" />
        <circle cx="119" cy="119" r="12" />
        <circle cx="112" cy="135" r="11" />
      </g>

      <path d="M32 180 C 32 150, 52 130, 80 130 C 108 130, 128 150, 128 180 Z" fill="#3a2f63" />
      <path d="M80 132 V 180" stroke="#2a2148" stroke-width="2" />
      <circle cx="86" cy="158" r="2.6" fill="#f4b52f" />
      <circle cx="86" cy="170" r="2.6" fill="#f4b52f" />

      <g fill="#fff" stroke="#d8ccb8" stroke-width="1.6" stroke-linejoin="round">
        <path d="M66 120 Q 80 128 94 120 L 91 133 Q 96 139 89 146 L 80 154 L 71 146 Q 64 139 69 133 Z" />
        <path d="M71 133 Q 80 138 89 133" fill="none" />
        <path d="M73 143 Q 80 147 87 143" fill="none" />
      </g>

      <path d="M51 88 C 51 64, 109 64, 109 88 C 110 104, 106 116, 98 122 C 92 127, 68 127, 62 122 C 54 116, 50 104, 51 88 Z" fill="#f7d4ba" />
      <path d="M56 104 Q 58 116 66 120" stroke="#ebbd9f" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M104 104 Q 102 116 94 120" stroke="#ebbd9f" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M70 121 Q 80 127 90 121" stroke="#e5b596" stroke-width="2.5" fill="none" stroke-linecap="round" />

      <g class="wig" fill="#f6f1e7" stroke="#d8ccb8" stroke-width="2">
        <path d="M49 80 C 46 50, 114 50, 111 80 C 101 68, 59 68, 49 80 Z" />
        <circle cx="52" cy="76" r="9" />
        <circle cx="108" cy="76" r="9" />
        <path d="M66 58 Q 80 54 94 58" fill="none" />
      </g>

      @switch (mood()) {
        @case ('happy') {
          <path d="M63 88 Q 69 82 75 88" stroke="#24204d" stroke-width="3.4" fill="none" stroke-linecap="round" />
          <path d="M85 88 Q 91 82 97 88" stroke="#24204d" stroke-width="3.4" fill="none" stroke-linecap="round" />
        }
        @case ('cheer') {
          <path d="M63 88 Q 69 82 75 88" stroke="#24204d" stroke-width="3.4" fill="none" stroke-linecap="round" />
          <path d="M85 88 Q 91 82 97 88" stroke="#24204d" stroke-width="3.4" fill="none" stroke-linecap="round" />
        }
        @case ('think') {
          <circle cx="71" cy="86" r="4.4" fill="#24204d" />
          <circle cx="93" cy="86" r="4.4" fill="#24204d" />
          <circle cx="72.5" cy="84.5" r="1.4" fill="#fff" />
          <circle cx="94.5" cy="84.5" r="1.4" fill="#fff" />
        }
        @default {
          <circle cx="69" cy="88" r="4.6" fill="#24204d" />
          <circle cx="91" cy="88" r="4.6" fill="#24204d" />
          <circle cx="70.6" cy="86.4" r="1.5" fill="#fff" />
          <circle cx="92.6" cy="86.4" r="1.5" fill="#fff" />
        }
      }

      <path [attr.d]="mood() === 'think' ? 'M60 78 Q 68 75 77 79' : 'M60 80 Q 69 74 77 80'" stroke="#6b5444" stroke-width="4.6" fill="none" stroke-linecap="round" />
      <path [attr.d]="mood() === 'think' ? 'M83 75 Q 91 68 100 73' : 'M83 80 Q 91 74 100 80'" stroke="#6b5444" stroke-width="4.6" fill="none" stroke-linecap="round" />

      <path d="M80 92 Q 85 100 79 103" stroke="#d99c7d" stroke-width="3" fill="none" stroke-linecap="round" />
      <ellipse cx="62" cy="101" rx="6.5" ry="4" fill="#f4a3a3" opacity="0.7" />
      <ellipse cx="98" cy="101" rx="6.5" ry="4" fill="#f4a3a3" opacity="0.7" />

      @switch (mood()) {
        @case ('cheer') {
          <path d="M70 107 Q 80 120 90 107 Z" fill="#8a3a45" stroke="#7a2f3a" stroke-width="2" stroke-linejoin="round" />
        }
        @case ('think') {
          <path d="M73 110 Q 79 108 86 111" stroke="#7a3b3b" stroke-width="3" fill="none" stroke-linecap="round" />
        }
        @default {
          <path d="M71 108 Q 80 116 89 108" stroke="#7a3b3b" stroke-width="3" fill="none" stroke-linecap="round" />
        }
      }

      @if (mood() === 'cheer') {
        <path d="M46 148 Q 28 132 30 108" stroke="#3a2f63" stroke-width="14" stroke-linecap="round" fill="none" />
        <ellipse cx="30" cy="104" rx="8" ry="5" fill="#fff" />
        <circle cx="30" cy="97" r="7.5" fill="#f7d4ba" />
      } @else {
        <path d="M44 150 Q 50 166 64 166" stroke="#3a2f63" stroke-width="14" stroke-linecap="round" fill="none" />
        <ellipse cx="64" cy="166" rx="4.5" ry="7" fill="#fff" />
        <circle cx="70" cy="165" r="7" fill="#f7d4ba" />
      }

      @if (mood() === 'wave' || mood() === 'cheer') {
        <path d="M114 148 Q 132 132 130 108" stroke="#3a2f63" stroke-width="14" stroke-linecap="round" fill="none" />
        <ellipse cx="130" cy="104" rx="8" ry="5" fill="#fff" />
        <circle cx="130" cy="97" r="7.5" fill="#f7d4ba" />
      } @else if (mood() === 'think') {
        <path d="M116 150 Q 116 132 102 126" stroke="#3a2f63" stroke-width="14" stroke-linecap="round" fill="none" />
        <ellipse cx="100" cy="124" rx="5" ry="7" fill="#fff" transform="rotate(30 100 124)" />
        <circle cx="94" cy="119" r="7" fill="#f7d4ba" />
      } @else {
        <path d="M116 150 Q 110 166 96 166" stroke="#3a2f63" stroke-width="14" stroke-linecap="round" fill="none" />
        <ellipse cx="96" cy="166" rx="4.5" ry="7" fill="#fff" />
        <circle cx="90" cy="165" r="7" fill="#f7d4ba" />
        <g transform="rotate(-12 106 146)">
          <rect x="90" y="128" width="34" height="40" rx="2" fill="#fffdf6" stroke="#d8ccb8" stroke-width="1.6" />
          @for (y of [136, 140, 144, 148, 152]; track y) {
            <line x1="94" x2="120" [attr.y1]="y" [attr.y2]="y" stroke="#a3968c" stroke-width="0.9" />
          }
          <circle cx="99" cy="146" r="1.9" fill="#24204d" />
          <circle cx="106" cy="142" r="1.9" fill="#24204d" />
          <circle cx="113" cy="138" r="1.9" fill="#24204d" />
          @for (y of [156, 160]; track y) {
            <line x1="94" x2="120" [attr.y1]="y" [attr.y2]="y" stroke="#a3968c" stroke-width="0.9" />
          }
        </g>
        <circle cx="90" cy="165" r="7" fill="#f7d4ba" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-block; line-height: 0; }
    :host(.bob) svg { animation: bob 3.2s ease-in-out infinite; }
  `,
})
export class MascotComponent {
  readonly mood = input<MascotMood>('happy');
  readonly size = input(140);
}
