class BookingState {
  constructor(name, blocksAvailability) {
    this.name = name;
    this.blocksAvailability = blocksAvailability;
  }

  confirm() { throw new Error(`Cannot confirm a ${this.name} booking.`); }
  reject() { throw new Error(`Cannot reject a ${this.name} booking.`); }
  cancel() { throw new Error(`Cannot cancel a ${this.name} booking.`); }
}

function cancelBeforeStart(now, start) {
  if (now >= start) throw new Error('Cancellation closes at the start time.');
  return new CancelledState();
}

export class PendingState extends BookingState {
  constructor() { super('Pending', true); }

  confirm(now, start) {
    if (now >= start) throw new Error('Confirmation closes at the start time.');
    return new ConfirmedState();
  }

  reject() { return new RejectedState(); }
  cancel(now, start) { return cancelBeforeStart(now, start); }
}

export class ConfirmedState extends BookingState {
  constructor() { super('Confirmed', true); }
  cancel(now, start) { return cancelBeforeStart(now, start); }
}

export class CancelledState extends BookingState {
  constructor() { super('Cancelled', false); }
}

export class RejectedState extends BookingState {
  constructor() { super('Rejected', false); }
}

export function stateFromName(name) {
  switch (name) {
    case 'Pending': return new PendingState();
    case 'Confirmed': return new ConfirmedState();
    case 'Cancelled': return new CancelledState();
    case 'Rejected': return new RejectedState();
    default: throw new Error(`Unknown booking state: ${name}`);
  }
}