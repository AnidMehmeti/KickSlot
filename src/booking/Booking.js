import { PendingState, stateFromName } from './BookingStates.js';

function checkMinute(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error('Expected a local date and time in YYYY-MM-DDTHH:mm format.');
  }
  const date = new Date(value + ':00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 16) !== value) {
    throw new Error('Invalid calendar date or time.');
  }
}

function checkInterval(start, end) {
  checkMinute(start);
  checkMinute(end);
  if (end <= start) throw new Error('End must be after start.');
}

export class Booking {
  #state = new PendingState();

  constructor({ id, playerId, pitchId, start, end, createdAt, totalCents }) {
    for (const key of [id, playerId, pitchId]) {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new Error('Booking, player and pitch IDs must be nonempty strings.');
      }
    }
    checkInterval(start, end);
    checkMinute(createdAt);
    if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
      throw new Error('The quoted price must be a nonnegative whole number of cents.');
    }
    this.id = id;
    this.playerId = playerId;
    this.pitchId = pitchId;
    this.start = start;
    this.end = end;
    this.createdAt = createdAt;
    this.totalCents = totalCents;
  }

  get stateName() { return this.#state.name; }

  blocksAvailability() { return this.#state.blocksAvailability; }

  belongsTo(player) { return this.playerId === player.id; }

  overlaps(start, end) {
    checkInterval(start, end);
    return this.start < end && start < this.end;
  }

  confirm(now) {
    checkMinute(now);
    this.#state = this.#state.confirm(now, this.start);
  }

  reject() { this.#state = this.#state.reject(); }

  cancel(now) {
    checkMinute(now);
    this.#state = this.#state.cancel(now, this.start);
  }

  toJSON() {
    return {
      id: this.id, playerId: this.playerId, pitchId: this.pitchId,
      start: this.start, end: this.end, createdAt: this.createdAt,
      totalCents: this.totalCents, stateName: this.stateName
    };
  }

  static fromJSON(record) {
    const booking = new Booking(record);
    booking.#state = stateFromName(record.stateName);
    return booking;
  }
}