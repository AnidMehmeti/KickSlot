import { Venue } from './Venue.js';

export class FacilityService {
  constructor(venues, pitches) {
    this.venues = venues;
    this.pitches = pitches;
  }

  getVenue(id) { return this.venues.find(id); }
  getPitch(id) { return this.pitches.find(id); }

  getManagedVenues(admin) {
    this.#requireAdmin(admin);
    return this.venues.all().filter(venue => venue.adminId === admin.id);
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
      const changed = new Map(target.pitches.map(pitch => [pitch.id, pitch]));
      const pitches = this.pitches.all().map(pitch => changed.get(pitch.id) ?? pitch);
      this.venues.save(target);
      try {
        this.pitches.saveAll(pitches);
      } catch (error) {
        // localStorage writes are atomic per key. Restore the first write if the second fails.
        this.venues.save(originalVenue);
        throw error;
      }
    }
    return target;
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
