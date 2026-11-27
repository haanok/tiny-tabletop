import { melody, arp, bassline, pads, drums } from './synth.js';

// Original looping tunes. `step` is seconds per step; each track compiles to events.

export const SONGS = {
  // Thimblecross: cheerful music-box village theme in C major
  village: {
    step: 60 / 104 / 2,
    tracks: [
      melody('bell', 0.32, `
        E5 . G5 . C6 . G5 . | A5 . G5 E5 C5 . E5 . | F5 . A5 . C6 . A5 G5 | G5 - - . D5 . G5 . |
        E5 . G5 . C6 . D6 . | E6 . D6 C6 A5 . C6 . | A5 . F5 . G5 . B5 D6 | C6 - - . . . . . `),
      arp('pluck', 0.12, 'C Am F G C Am F,G C', [0, 2, 1, 2, 0, 2, 1, 2], 4, 8),
      bassline('bass', 0.28, 'C Am F G C Am F,G C', 'R . . . 5 . . .', 2, 8),
      drums({ x: 0.05, h: 0.04 }, '. . x . . . x .', 8),
    ],
  },

  // Bogmire: slow, murky A minor with breathy flute and drips
  bog: {
    step: 60 / 66 / 2,
    tracks: [
      pads('pad', 0.07, 'Am Am F E Am Dm E Am', 3, 8),
      melody('flute', 0.16, `
        A4 - - - C5 - B4 - | A4 - - - . . E4 - | F4 - - - A4 - C5 - | B4 - - - G#4 - - - |
        A4 - C5 - E5 - D5 - | F5 - - - E5 D5 C5 - | B4 - - - G#4 - B4 - | A4 - - - - - - - `),
      bassline('bass', 0.22, 'Am Am F E Am Dm E Am', 'R - - - - - - -', 2, 8),
      melody('bell', 0.07, `
        E6 . . . . . . . | . . . . . . B5 . | . . . . . . . . | . . . G#6 . . . . |
        . . . . . . . . | A6 . . . . . . . | . . . . . E6 . . | . . . . . . . . `),
    ],
  },

  // Gullhaven: lilting 6/8 sea shanty on a squeezebox
  harbor: {
    step: 0.25,
    tracks: [
      melody('reed', 0.13, `
        A4 . D5 D5 . E5 | F#5 . E5 D5 . A4 | B4 . D5 G5 . F#5 | E5 - - A4 . . |
        A4 . D5 D5 . E5 | F#5 . A5 B5 . A5 | G5 . E5 C#5 . E5 | D5 - - . . . `),
      bassline('bass', 0.26, 'D D G A D Bm G,A D', 'R . . 5 . .', 2, 6),
      arp('pluck', 0.1, 'D D G A D Bm G,A D', ['.', '.', '.', 'c', '.', 'c'], 4, 6),
      drums({ k: 0.2, h: 0.05 }, 'k . . h . .', 8),
    ],
  },

  // Shellshore Cove: breezy island marimba in F major
  cove: {
    step: 60 / 112 / 2,
    tracks: [
      melody('marimba', 0.34, `
        C5 . F5 A5 . G5 F5 . | D5 . F5 A5 . G5 F5 D5 | Bb4 . D5 F5 . E5 D5 . | C5 - E5 . G5 . . . |
        A5 . G5 F5 . A5 C6 . | D6 . C6 A5 . F5 D5 . | D5 . F5 . E5 . G5 . | F5 - - . . . . . `),
      arp('marimba', 0.13, 'F Dm Bb C F Dm Bb,C F', ['.', 0, '.', 1, '.', 2, '.', 1], 4, 8),
      bassline('bass', 0.26, 'F Dm Bb C F Dm Bb,C F', 'R . . R . 5 . .', 2, 8),
      drums({ x: 0.06 }, 'x x x x x x x x', 8),
    ],
  },

  // Boss fights: driving E minor chiptune
  battle: {
    step: 60 / 150 / 2,
    tracks: [
      melody('lead', 0.09, `
        E5 . B4 E5 G5 . F#5 E5 | E5 . C5 E5 G5 . A5 G5 | F#5 . D5 F#5 A5 . G5 F#5 | D#5 - - - B4 - - - |
        E5 . G5 B5 A5 G5 F#5 E5 | G5 . E5 C5 E5 . G5 . | A5 . C6 . B5 . D#5 . | E5 - - - . . . . `),
      bassline('bass', 0.24, 'Em C D B Em C Am,B Em', 'R R O R R R O R', 2, 8),
      arp('pluck', 0.06, 'Em C D B Em C Am,B Em', [0, 1, 2, 1, 0, 1, 2, 1], 4, 8),
      drums({ k: 0.3, s: 0.16, h: 0.04 }, 'k+h h s+h h k+h k+h s+h h', 8),
    ],
  },
};

export const BOARD_SONG = {
  thimblecross: 'village',
  bogmire: 'bog',
  gullhaven: 'harbor',
  shellshore: 'cove',
};
