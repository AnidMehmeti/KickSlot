import { Venue } from './Venue.js';

export class FacilityService {
  constructor(venues, pitches, bookings) {
    this.venues = venues;
    this.pitches = pitches;
    this.bookings = bookings;
  }

  getVenue(id) { return this.venues.find(id); }
  getPitch(id) { return this.pitches.find(id); }

  getManagedVenues(admin) {
    this.#requireAdmin(admin);
    return this.venues.all().filter(venue => venue.adminId === admin.id);
  }

  createVenue(admin, details) {
    this.#requireAdmin(admin);
    const venue = new Venue({
      id: crypto.randomUUID(), name: details.name, address: details.address,
      adminId: admin.id,
    });
    this.venues.save(venue);
    return venue;
  }

  reactivatePitch(admin, id) {
    const pitch = this.getPitch(id);
    const venue = this.getVenue(pitch.venueId);
    this.#requireOwner(admin, venue);
    if (!venue.active) throw new Error('Cannot reactivate a pitch in an inactive venue.');
    pitch.reactivate();
    this.pitches.save(pitch);
    return pitch;
  }

  reactivateVenue(admin, id) {
    const venue = this.getVenue(id);
    this.#requireOwner(admin, venue);
    if (venue.active) return venue;
    const originalVenue = new Venue(venue.toJSON());
    venue.reactivate();
    this.#saveVenueAndPitches(venue, originalVenue);
    return venue;
  }

  deletePitch(admin, id) {
    const pitch = this.getPitch(id);
    this.#requireOwner(admin, this.getVenue(pitch.venueId));
    if (this.bookings.all().some(booking => booking.pitchId === id)) {
      throw new Error('This pitch has booking history. Deactivate it instead.');
    }
    this.pitches.remove(id);
  }

  updateVenue(admin, id, details) {
    const existing = this.getVenue(id);
    this.#requireOwner(admin, existing);
    const venue = new Venue({ ...existing.toJSON(), name: details.name, address: details.address });
    this.venues.save(venue);
    return venue;
  }

  deactivate(admin, type, id) {
    if (type !== 'venue' && type !== 'pitch') throw new Error('Choose a venue or pitch.');
    const target = type === 'venue' ? this.getVenue(id) : this.getPitch(id);
    const venue = type === 'venue' ? target : this.getVenue(target.venueId);
    this.#requireOwner(admin, venue);
    const originalVenue = new Venue(venue.toJSON());
    target.deactivate();
    if (type === 'pitch') {
      this.pitches.save(target);
    } else {
      this.#saveVenueAndPitches(target, originalVenue);
    }
    return target;
  }

  #saveVenueAndPitches(venue, originalVenue) {
    const changed = new Map(venue.pitches.map(pitch => [pitch.id, pitch]));
    const pitches = this.pitches.all().map(pitch => changed.get(pitch.id) ?? pitch);
    this.venues.save(venue);
    try {
      this.pitches.saveAll(pitches);
    } catch (error) {
      // Restore the venue if the second localStorage write fails.
      this.venues.save(originalVenue);
      throw error;
    }
  }

  #requireAdmin(admin) {
    if (admin?.role !== 'admin' || typeof admin.id !== 'string' || !admin.id.trim()) {
      throw new Error('This action requires a current admin account.');
    }
  }

  #requireOwner(admin, venue) {
    this.#requireAdmin(admin);
    if (venue.adminId !== admin.id) throw new Error('You do not manage this venue.');
  }
}
