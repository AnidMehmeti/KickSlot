export class Venue {
  constructor({ id, name, address = '', adminId, active = true }, pitches = []) {
    for (const value of [id, name, adminId]) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Venue ID, name and administrator are required.');
      }
    }
    if (typeof address !== 'string' || typeof active !== 'boolean') {
      throw new Error('Invalid venue address or activity.');
    }
    this.id = id;
    this.name = name.trim();
    this.address = address.trim();
    this.adminId = adminId;
    this.active = active;
    this.pitches = pitches.filter(pitch => pitch.venueId === id);
  }

  deactivate() {
    this.active = false;
    for (const pitch of this.pitches) pitch.deactivate();
  }

  reactivate() {
    this.active = true;
    for (const pitch of this.pitches) pitch.reactivate();
  }

  toJSON() {
    return {
      id: this.id, name: this.name, address: this.address,
      adminId: this.adminId, active: this.active,
    };
  }
}
