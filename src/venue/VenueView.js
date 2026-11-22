export class VenueView {
  constructor(root) {
    root.innerHTML = `
      <h2>My venues</h2>
      <form class="create-venue">
        <label>New venue name <input name="name" required></label>
        <label>New venue address <input name="address"></label>
        <button>Create venue</button>
      </form>
      <label>Venue <select name="venue"></select></label>
      <p class="activity"></p>
      <form class="edit-venue">
        <label>Name <input name="name" required></label>
        <label>Address <input name="address"></label>
        <button>Save venue details</button>
      </form>
      <button type="button" class="deactivate">Deactivate venue and its pitches</button>
      <button type="button" class="reactivate">Reactivate venue and all its pitches</button>
      <ul></ul>
      <p role="status" aria-live="polite"></p>`;
    this.select = root.querySelector('select');
    this.createForm = root.querySelector('.create-venue');
    this.form = root.querySelector('.edit-venue');
    this.activity = root.querySelector('.activity');
    this.deactivate = root.querySelector('.deactivate');
    this.reactivate = root.querySelector('.reactivate');
    this.list = root.querySelector('ul');
    this.status = root.querySelector('[role="status"]');
  }

  render({ venues, selectedId, onSelect, onCreate, onUpdate, onDeactivate, onReactivateVenue, onReactivatePitch, onDeletePitch }) {
    this.createForm.onsubmit = event => {
      event.preventDefault();
      this.run(() => {
        onCreate({
          name: this.createForm.elements.name.value,
          address: this.createForm.elements.address.value,
        });
        this.createForm.reset();
      }, 'Venue created. You can now add a pitch.');
    };
    this.select.replaceChildren(...venues.map(venue => new Option(venue.name, venue.id)));
    this.select.value = selectedId;
    this.select.onchange = () => onSelect(this.select.value);
    const venue = venues.find(item => item.id === selectedId);
    this.form.hidden = !venue;
    this.deactivate.disabled = !venue || !venue.active;
    this.deactivate.hidden = !venue || !venue.active;
    this.reactivate.hidden = !venue || venue.active;
    this.activity.textContent = venue ? (venue.active ? 'Active venue' : 'Inactive venue') : 'No managed venues.';
    this.list.replaceChildren();
    if (!venue) return;
    this.form.elements.name.value = venue.name;
    this.form.elements.address.value = venue.address;
    this.form.onsubmit = event => {
      event.preventDefault();
      this.run(() => onUpdate(venue.id, {
        name: this.form.elements.name.value,
        address: this.form.elements.address.value,
      }), 'Venue details saved.');
    };
    this.deactivate.onclick = () => {
      if (confirm(`Deactivate "${venue.name}" and all its pitches? New bookings will be blocked. Existing bookings will be kept.`)) {
        this.run(() => onDeactivate('venue', venue.id), 'Venue and its pitches deactivated.');
      }
    };
    this.reactivate.onclick = () => {
      if (confirm(`Reactivate "${venue.name}" and all its pitches? This also reopens pitches that were inactive before the venue was closed.`)) {
        this.run(() => onReactivateVenue(venue.id), 'Venue and all its pitches reactivated.');
      }
    };
    for (const pitch of venue.pitches) {
      const row = document.createElement('li');
      row.textContent = `${pitch.name} · ${pitch.active ? 'Active' : 'Inactive'} `;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = pitch.active ? 'Deactivate pitch' : 'Reactivate pitch';
      button.disabled = !pitch.active && !venue.active;
      button.setAttribute('aria-label', `${pitch.active ? 'Deactivate' : 'Reactivate'} ${pitch.name}`);
      button.onclick = () => this.run(
        () => pitch.active ? onDeactivate('pitch', pitch.id) : onReactivatePitch(pitch.id),
        pitch.active ? 'Pitch deactivated.' : 'Pitch reactivated.',
      );
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete pitch';
      remove.setAttribute('aria-label', `Delete ${pitch.name}`);
      remove.onclick = () => {
        if (confirm(`Delete "${pitch.name}"? This is permanent and only allowed without booking history.`)) {
          this.run(() => onDeletePitch(pitch.id), 'Pitch deleted.');
        }
      };
      row.append(button);
      row.append(remove);
      this.list.append(row);
    }
  }

  run(action, message) {
    try {
      action();
      this.status.textContent = message;
    } catch (error) {
      this.status.textContent = error.message;
    }
  }
}
