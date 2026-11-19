import { Booking } from './Booking.js';

function localMinute() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  const day = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
  return day + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
}

function requireRole(actor, role) {
  if (actor?.role !== role || typeof actor.id !== 'string' || !actor.id.trim()) {
    throw new Error(`This action requires a current ${role} account.`);
  }
}

export class BookingService {
  constructor(repository, facilities, sender, clock = localMinute) {
    this.repository = repository;
    this.facilities = facilities;
    this.sender = sender;
    this.clock = clock;
  }

  createBooking(player, pitchId, start, end) {
    requireRole(player, 'player');
    const now = this.clock();
    if (typeof start !== 'string' || typeof end !== 'string' ||
        start <= now || end <= start || start.slice(0, 10) !== end.slice(0, 10)) {
      throw new Error('Choose a future start and a later end on the same day.');
    }

    const pitch = this.facilities.getPitch(pitchId);
    const venue = this.facilities.getVenue(pitch.venueId);
    if (!pitch.active || !venue.active) throw new Error('This facility is inactive.');
    if (!pitch.isOpenDuring(start, end)) throw new Error('The pitch is closed for this interval.');

    const conflict = this.repository.all().some(booking =>
      booking.pitchId === pitchId && booking.blocksAvailability() && booking.overlaps(start, end)
    );
    if (conflict) throw new Error('That pitch is already booked for this interval.');

    const booking = new Booking({
      id: crypto.randomUUID(), playerId: player.id, pitchId, start, end,
      createdAt: now, totalCents: pitch.calculatePrice(start, end)
    });
    this.repository.save(booking);
    return booking;
  }

  getUpcomingBookings(player) {
    requireRole(player, 'player');
    const now = this.clock();
    return this.repository.all()
      .filter(b => b.belongsTo(player) && b.start > now && b.blocksAvailability())
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  getManagedBookings(admin) {
    requireRole(admin, 'admin');
    return this.repository.all().filter(b => this.#venueFor(b).adminId === admin.id);
  }

  cancelBooking(player, bookingId) {
    requireRole(player, 'player');
    const booking = this.#findBooking(bookingId);
    if (!booking.belongsTo(player)) throw new Error('You can only cancel your own booking.');
    booking.cancel(this.clock());
    return this.#saveAndNotify(booking);
  }

  confirmBooking(admin, bookingId) {
    const booking = this.#managedBooking(admin, bookingId);
    booking.confirm(this.clock());
    return this.#saveAndNotify(booking);
  }

  rejectBooking(admin, bookingId) {
    const booking = this.#managedBooking(admin, bookingId);
    booking.reject();
    return this.#saveAndNotify(booking);
  }

  #findBooking(id) {
    const booking = this.repository.all().find(b => b.id === id);
    if (!booking) throw new Error('Booking not found.');
    return booking;
  }

  #venueFor(booking) {
    const pitch = this.facilities.getPitch(booking.pitchId);
    return this.facilities.getVenue(pitch.venueId);
  }

  #managedBooking(admin, id) {
    requireRole(admin, 'admin');
    const booking = this.#findBooking(id);
    if (this.#venueFor(booking).adminId !== admin.id) {
      throw new Error('You do not manage this venue.');
    }
    return booking;
  }

  #saveAndNotify(booking) {
    this.repository.save(booking);
    const message = `Your booking for ${booking.start} is ${booking.stateName.toLowerCase()}.`;
    try {
      this.sender.send(booking.playerId, message);
    } catch {
      throw new Error(`Booking saved as ${booking.stateName}, but the notification could not be sent.`);
    }
    return booking;
  }
}