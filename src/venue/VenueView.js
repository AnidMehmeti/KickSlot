export class VenueView {
  constructor(root) {
    root.innerHTML = `
      <h2>My venues</h2>
      <label>Venue <select name="venue"></select></label>
      <p class="activity"></p>
      <form>
        <label>Name <input name="name" required></label>
        <label>Address <input name="address"></label>
        <button>Save venue details</button>
      </form>
      <button type="button" class="deactivate">Deactivate venue and its pitches</button>
      <ul></ul>
      <p role="status" aria-live="polite"></p>`;
    this.select = root.querySelector('select');
    this.form = root.querySelector('form');
    this.activity = root.querySelector('.activity');
    this.deactivate = root.querySelector('.deactivate');
    this.list = root.querySelector('ul');
    this.status = root.querySelector('[role="status"]');
  }

  render({ venues, selectedId, onSelect, onUpdate, onDeactivate }) {
    this.select.replaceChildren(...venues.map(venue => new Option(venue.name, venue.id)));
    this.select.value = selectedId;
    this.select.onchange = () => onSelect(this.select.value);
    const venue = venues.find(item => item.id === selectedId);
    this.form.hidden = !venue;
    this.deactivate.disabled = !venue || !venue.active;
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
    this.deactivate.onclick = () => this.run(
      () => onDeactivate('venue', venue.id), 'Venue and its pitches deactivated.',
    );
    for (const pitch of venue.pitches) {
      const row = document.createElement('li');
      row.textContent = `${pitch.name} · ${pitch.active ? 'Active' : 'Inactive'} `;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Deactivate pitch';
      button.disabled = !pitch.active;
      button.setAttribute('aria-label', `Deactivate ${pitch.name}`);
      button.onclick = () => this.run(() => onDeactivate('pitch', pitch.id), 'Pitch deactivated.');
      row.append(button);
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
