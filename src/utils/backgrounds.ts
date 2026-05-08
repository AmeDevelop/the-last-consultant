export const BACKGROUNDS: Record<string, string> = {
  city_night:           'linear-gradient(to bottom, #020617, #0c1445, #020617)',
  apartment:            'linear-gradient(to bottom, #3b1f08, #2d1505, #3b1f08)',
  hospital:             'linear-gradient(to bottom, #0f172a, #1e3a5f, #0f172a)',
  dark_castle:          'linear-gradient(to bottom, #030712, #3b0a0a, #030712)',
  throne_room:          'linear-gradient(to bottom, #1a0a2e, #0a0014, #3b0a0a)',
  inn_exterior:         'linear-gradient(to bottom, #2d1c08, #3b2510, #2d1c08)',
  inn_room:             'linear-gradient(to bottom, #3b2510, #2d1c08, #3b2510)',
  town:                 'linear-gradient(to bottom, #1a2535, #0f1a28, #1a2535)',
  library:              'linear-gradient(to bottom, #0a2015, #0f2d1a, #0a2015)',
  bar:                  'linear-gradient(to bottom, #2d0a0a, #1a0505, #2d0a0a)',
  shop:                 'linear-gradient(to bottom, #2d2005, #1a1505, #2d2005)',
  gym:                  'linear-gradient(to bottom, #2d1505, #3b0a0a, #2d1505)',
  sage_house:           'linear-gradient(to bottom, #0a0a2d, #1a1560, #0a0a2d)',
  outskirts:            'linear-gradient(to bottom, #0a2010, #0f150a, #0a2010)',
  town_exit:            'linear-gradient(to bottom, #0f172a, #1e293b, #0f172a)',
  training_ground_bad:  'linear-gradient(to bottom, #2d1505, #3b1a0a, #2d1505)',
  training_ground_good: 'linear-gradient(to bottom, #0a0a3b, #1a1a5f, #0a0a3b)',
  training_ground_true: 'linear-gradient(to bottom, #0a2d1a, #1a3b2a, #0a2d1a)',
  datacenter:           'linear-gradient(to bottom, #030712, #0a1f0a, #030712)',
  default:              'linear-gradient(to bottom, #030712, #0f172a, #030712)',
}

export function getBackground(key?: string): string {
  if (!key) return BACKGROUNDS.default
  return BACKGROUNDS[key] ?? BACKGROUNDS.default
}
