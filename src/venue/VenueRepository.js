import { Venue } from './Venue.js';

export class VenueRepository {
  constructor(storage, pitches, key = 'kickslot.venues') {
    this.storage = storage;
    this.pitches = pitches;
    this.key = key;
  }

  all() {
    const records = JSON.parse(this.storage.getItem(this.key) ?? '[]');
    const pitches = this.pitches.all();
    return records.map(record => new Venue(record, pitches));
  }

  find(id) {
    const venue = this.all().find(item => item.id === id);
    if (!venue) throw new Error('Venue not found.');
    return venue;
  }

  save(venue) {
    const venues = this.all();
    const index = venues.findIndex(item => item.id === venue.id);
    if (index === -1) venues.push(venue);
    else venues[index] = venue;
    this.storage.setItem(this.key, JSON.stringify(venues));
  }
}
