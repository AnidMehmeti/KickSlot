const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function checkText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required.`);
  }
}

function checkDay(day) {
  const found = DAYS.find(
    (name) => name.toLowerCase() === String(day).toLowerCase(),
  );
  if (!found) throw new Error('Use a weekday name, such as Monday.');
  return found;
}

function checkClock(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('Expected a time in HH:mm format.');
  }
}

function checkRange(start, end) {
  checkClock(start);
  checkClock(end);
  if (end <= start) throw new Error('End must be after start.');
}

function minutes(clock) {
  return Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
}

function weekday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error('Expected a local date and time.');
  return DAYS[date.getDay()];
}

function sameDayClocks(start, end) {
  if (
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    start.slice(0, 10) !== end.slice(0, 10)
  ) {
    throw new Error('The interval must stay on one day.');
  }
  const from = start.slice(11, 16);
  const to = end.slice(11, 16);
  checkRange(from, to);
  return { day: weekday(start), from, to };
}

function rejectOverlaps(entries, startOf, endOf, label) {
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.day === b.day && a[startOf] < b[endOf] && b[startOf] < a[endOf]) {
        throw new Error(`Overlapping ${label} on ${a.day}.`);
      }
    }
  }
}

export class OpeningHoursEntry {
  constructor({ day, open, close }) {
    this.day = checkDay(day);
    checkRange(open, close);
    this.open = open;
    this.close = close;
  }

  covers(day, start, end) {
    return this.day === day && this.open <= start && end <= this.close;
  }
}

export class PricingTier {
  constructor({ day, start, end, hourlyCents }) {
    this.day = checkDay(day);
    checkRange(start, end);
    if (!Number.isSafeInteger(hourlyCents) || hourlyCents <= 0) {
      throw new Error(
        'The hourly rate must be a positive whole number of cents.',
      );
    }
    this.start = start;
    this.end = end;
    this.hourlyCents = hourlyCents;
  }

  covers(day, start, end) {
    return this.day === day && this.start <= start && end <= this.end;
  }

  quote(start, end) {
    return Math.round(
      (this.hourlyCents * (minutes(end) - minutes(start))) / 60,
    );
  }
}

export class Pitch {
  constructor({
    id,
    name,
    venueId,
    surface,
    indoor,
    active = true,
    hours,
    tiers,
  }) {
    checkText(id, 'Pitch id');
    checkText(name, 'Pitch name');
    checkText(venueId, 'Venue');
    checkText(surface, 'Surface');
    if (typeof indoor !== 'boolean')
      throw new Error('Say whether the pitch is indoor.');
    if (typeof active !== 'boolean')
      throw new Error('Active must be true or false.');
    if (!Array.isArray(hours) || hours.length === 0)
      throw new Error('Add at least one opening-hours entry.');
    if (!Array.isArray(tiers) || tiers.length === 0)
      throw new Error('Add at least one price tier.');

    this.id = id;
    this.name = name.trim();
    this.venueId = venueId;
    this.surface = surface.trim();
    this.indoor = indoor;
    this.active = active;
    this.hours = hours.map((entry) => new OpeningHoursEntry(entry));
    this.tiers = tiers.map((tier) => new PricingTier(tier));
    rejectOverlaps(this.hours, 'open', 'close', 'opening hours');
    rejectOverlaps(this.tiers, 'start', 'end', 'price tiers');
  }

  isOpenDuring(start, end) {
    const slot = sameDayClocks(start, end);
    return this.hours.some((entry) =>
      entry.covers(slot.day, slot.from, slot.to),
    );
  }

  calculatePrice(start, end) {
    const slot = sameDayClocks(start, end);
    const tier = this.tiers.find((item) =>
      item.covers(slot.day, slot.from, slot.to),
    );
    if (!tier) throw new Error('No price tier covers this interval.');
    return tier.quote(slot.from, slot.to);
  }

  deactivate() {
    this.active = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      venueId: this.venueId,
      surface: this.surface,
      indoor: this.indoor,
      active: this.active,
      hours: this.hours.map((entry) => ({
        day: entry.day,
        open: entry.open,
        close: entry.close,
      })),
      tiers: this.tiers.map((tier) => ({
        day: tier.day,
        start: tier.start,
        end: tier.end,
        hourlyCents: tier.hourlyCents,
      })),
    };
  }

  static fromJSON(record) {
    return new Pitch(record);
  }
}
