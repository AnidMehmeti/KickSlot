import { Venue } from './venue/Venue.js';
import { PitchBuilder } from './pitch/PitchBuilder.js';

export function seedFacilities(storage, venues, pitches) {
  const newVenues = storage.getItem(venues.key) === null;
  const newPitches = storage.getItem(pitches.key) === null;
  if (!newVenues && !newPitches) return;

  const records = [
    { id: 'venue1', name: 'Trepca Sports Centre', address: 'North training ground', adminId: 'a1' },
    { id: 'venue2', name: 'Riverside Sports Centre', address: 'Riverside training ground', adminId: 'a2' },
  ];
  const availableVenues = newVenues ? records : venues.all();
  const seeds = [
    { id: 'pitch1', name: 'Grass pitch', venueId: 'venue1', surface: 'Grass', indoor: false, rate: 2000 },
    { id: 'pitch2', name: 'Indoor pitch', venueId: 'venue1', surface: 'Turf', indoor: true, rate: 3000 },
    { id: 'pitch3', name: 'Riverside pitch', venueId: 'venue2', surface: 'Turf', indoor: false, rate: 2000 },
  ];
  const existing = pitches.all();
  for (const seed of seeds) {
    const venue = availableVenues.find(item => item.id === seed.venueId);
    if (!venue || existing.some(pitch => pitch.id === seed.id)) continue;
    const builder = new PitchBuilder().withId(seed.id).withName(seed.name)
      .withVenue(seed.venueId).withSurface(seed.surface).withIndoor(seed.indoor)
      .withActive(venue.active !== false);
    for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      builder.addHours(day, '17:00', '21:00').addTier(day, '17:00', '21:00', seed.rate);
    }
    existing.push(builder.build());
  }
  pitches.saveAll(existing);
  if (newVenues) {
    storage.setItem(venues.key, JSON.stringify(records.map(record => new Venue(record))));
  }
}
