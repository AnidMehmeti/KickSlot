import { PitchBuilder } from './PitchBuilder.js';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function requireAdmin(admin) {
  if (
    admin?.role !== 'admin' ||
    typeof admin.id !== 'string' ||
    !admin.id.trim()
  ) {
    throw new Error('This action requires a current admin account.');
  }
}

function centsFromEuros(euros) {
  if (!Number.isInteger(euros) || euros <= 0) {
    throw new Error('Use a positive whole number of euros per hour.');
  }
  return euros * 100;
}

function sameEveryDay(fields) {
  const open = fields.open;
  const close = fields.close;
  const hourlyCents = centsFromEuros(fields.eurosPerHour);
  const builder = new PitchBuilder()
    .withId(fields.id)
    .withName(fields.name)
    .withVenue(fields.venueId)
    .withSurface(fields.surface)
    .withIndoor(fields.indoor)
    .withActive(fields.active !== false);
  for (const day of DAYS) {
    builder.addHours(day, open, close).addTier(day, open, close, hourlyCents);
  }
  return builder.build();
}

export class PitchService {
  constructor(repository, venues) {
    this.repository = repository;
    this.venues = venues;
  }

  addPitch(admin, fields) {
    this.#allowed(admin, fields.venueId);
    const pitch = sameEveryDay({ ...fields, active: true });
    if (this.repository.all().some(existing => existing.id === pitch.id)) {
      throw new Error('A pitch with this ID already exists.');
    }
    this.repository.save(pitch);
    return pitch;
  }

  updatePitch(admin, pitchId, fields) {
    if (!pitchId) throw new Error('Choose a pitch to edit.');
    const existing = this.repository.find(pitchId);
    this.#allowed(admin, existing.venueId);
    const pitch = sameEveryDay({
      id: existing.id,
      name: existing.name,
      venueId: existing.venueId,
      surface: existing.surface,
      indoor: existing.indoor,
      active: existing.active,
      open: fields.open,
      close: fields.close,
      eurosPerHour: fields.eurosPerHour,
    });
    this.repository.save(pitch);
    return pitch;
  }

  #allowed(admin, venueId) {
    requireAdmin(admin);
    const venue = this.venues.getVenue(venueId);
    if (venue.adminId !== admin.id)
      throw new Error('You can only configure venues you manage.');
    if (!venue.active) throw new Error('This venue is inactive.');
  }
}
