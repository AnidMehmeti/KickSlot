import { Pitch } from './Pitch.js';

export class PitchRepository {
  constructor(storage, key = 'kickslot.pitches') {
    this.storage = storage;
    this.key = key;
  }

  all() {
    const records = JSON.parse(this.storage.getItem(this.key) ?? '[]');
    return records.map((record) => Pitch.fromJSON(record));
  }

  find(id) {
    const pitch = this.all().find((item) => item.id === id);
    if (!pitch) throw new Error('Pitch not found.');
    return pitch;
  }

  save(pitch) {
    const pitches = this.all();
    const index = pitches.findIndex((item) => item.id === pitch.id);
    if (index === -1) pitches.push(pitch);
    else pitches[index] = pitch;
    this.saveAll(pitches);
  }

  saveAll(pitches) {
    this.storage.setItem(this.key, JSON.stringify(pitches));
  }
}
