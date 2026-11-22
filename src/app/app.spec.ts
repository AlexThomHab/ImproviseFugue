import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { displayedAccidental, keySignatureAccidentals, keyToMidi } from './core/music';

describe('App', () => {
  it('should create the app', async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});

describe('music helpers', () => {
  it('converts VexFlow keys to MIDI', () => {
    expect(keyToMidi('c/4')).toBe(60);
    expect(keyToMidi('f#/3')).toBe(54);
    expect(keyToMidi('bb/2')).toBe(46);
  });

  it('knows key-signature accidentals', () => {
    expect(keySignatureAccidentals('G')).toEqual({ f: '#' });
    expect(keySignatureAccidentals('Dm')).toEqual({ b: 'b' });
  });

  it('only prints accidentals the key signature does not cover', () => {
    expect(displayedAccidental('bb/2', 'Dm')).toBeNull();
    expect(displayedAccidental('g#/3', 'Am')).toBe('#');
    expect(displayedAccidental('f/3', 'G')).toBe('n');
  });
});
