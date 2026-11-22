import { Pitch } from './Pitch.js';

export class PitchBuilder {
  constructor() {
    this.id = '';
    this.name = '';
    this.venueId = '';
    this.surface = '';
    this.indoor = undefined;
    this.active = true;
    this.hours = [];
    this.tiers = [];
  }

  withId(id) {
    this.id = id;
    return this;
  }
  withName(name) {
    this.name = name;
    return this;
  }
  withVenue(venueId) {
    this.venueId = venueId;
    return this;
  }
  withSurface(surface) {
    this.surface = surface;
    return this;
  }
  withIndoor(indoor) {
    this.indoor = indoor;
    return this;
  }
  withActive(active) {
    this.active = active;
    return this;
  }

  addHours(day, open, close) {
    this.hours.push({ day, open, close });
    return this;
  }

  addTier(day, start, end, hourlyCents) {
    this.tiers.push({ day, start, end, hourlyCents });
    return this;
  }

  build() {
    return new Pitch({
      id: this.id || crypto.randomUUID(),
      name: this.name,
      venueId: this.venueId,
      surface: this.surface,
      indoor: this.indoor,
      active: this.active,
      hours: this.hours,
      tiers: this.tiers,
    });
  }
}
