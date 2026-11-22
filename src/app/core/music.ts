const LETTER_PC: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

export const PITCH_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

export function keyToMidi(key: string): number {
  const [name, octaveStr] = key.toLowerCase().split('/');
  const letter = name[0];
  const accidental = name.slice(1);
  let pc = LETTER_PC[letter] ?? 0;
  for (const ch of accidental) {
    if (ch === '#') pc += 1;
    else if (ch === 'b') pc -= 1;
  }
  return 12 * (Number(octaveStr) + 1) + pc;
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function pitchName(midi: number): string {
  return PITCH_NAMES[((midi % 12) + 12) % 12];
}

const SHARP_ORDER = ['f', 'c', 'g', 'd', 'a', 'e', 'b'];
const FLAT_ORDER = ['b', 'e', 'a', 'd', 'g', 'c', 'f'];
const KEY_COUNTS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5,
};

export function keySignatureAccidentals(keySig = 'C'): Record<string, '#' | 'b'> {
  const n = KEY_COUNTS[keySig] ?? 0;
  const result: Record<string, '#' | 'b'> = {};
  if (n > 0) SHARP_ORDER.slice(0, n).forEach((l) => (result[l] = '#'));
  if (n < 0) FLAT_ORDER.slice(0, -n).forEach((l) => (result[l] = 'b'));
  return result;
}

export function displayedAccidental(key: string, keySig?: string): '#' | 'b' | 'n' | null {
  const name = key.toLowerCase().split('/')[0];
  const letter = name[0];
  const written = (name.slice(1) || '') as '' | '#' | 'b';
  const implied = keySignatureAccidentals(keySig)[letter] ?? '';
  if (written === implied) return null;
  return written === '' ? 'n' : written;
}
