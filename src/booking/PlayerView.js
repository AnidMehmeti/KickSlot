const euros = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

export class PlayerView {
  constructor(root) {
    root.innerHTML = `
      <h2>Request a pitch</h2>
      <form>
        <label>Venue <select name="venue" required></select></label>
        <label>Pitch <select name="pitch" required></select></label>
        <label>Start <input name="start" type="datetime-local" required></label>
        <label>End <input name="end" type="datetime-local" required></label>
        <button type="submit">Request booking</button>
      </form>
      <p role="status" aria-live="polite"></p>
      <h2>My upcoming bookings</h2>
      <ul></ul>`;
    this.form = root.querySelector('form');
    this.status = root.querySelector('[role="status"]');
    this.list = root.querySelector('ul');
  }

  render({ venues, pitches, bookings, onRequest, onCancel, allPitches = pitches }) {
    const { venue, pitch, start, end } = this.form.elements;
    const previousVenue = venue.value;
    const previousPitch = pitch.value;
    venue.replaceChildren(new Option('Choose a venue', ''), ...venues.map(v => new Option(v.name, v.id)));
    venue.disabled = venues.length === 0;
    if (venues.some(v => v.id === previousVenue)) venue.value = previousVenue;
    if (venues.length === 0) venue.options[0].text = 'No venues available';

    const showPitches = (selectedId = '') => {
      const choices = pitches.filter(p => p.venueId === venue.value);
      const prompt = !venue.value ? 'Choose a venue first' : choices.length ? 'Choose a pitch' : 'No pitches available';
      pitch.replaceChildren(new Option(prompt, ''), ...choices.map(p => new Option(p.name, p.id)));
      pitch.disabled = choices.length === 0;
      if (choices.some(p => p.id === selectedId)) pitch.value = selectedId;
      this.form.querySelector('button').disabled = !pitch.value;
    };
    showPitches(previousPitch);
    venue.onchange = () => {
      this.status.textContent = '';
      showPitches();
    };
    pitch.onchange = () => {
      this.form.querySelector('button').disabled = !pitch.value;
    };

    this.form.onsubmit = event => {
      event.preventDefault();
      this.run(() => onRequest(pitch.value, start.value, end.value), 'Booking requested.');
    };

    this.list.replaceChildren();
    if (bookings.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'You have no upcoming bookings.';
      this.list.append(empty);
    }
    for (const booking of bookings) {
      const name = allPitches.find(p => p.id === booking.pitchId)?.name ?? booking.pitchId;
      const row = document.createElement('li');
      row.textContent = `${name} · ${booking.start.replace('T', ' ')}–${booking.end.slice(11)} · ${euros.format(booking.totalCents / 100)} · ${booking.stateName} `;
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancel';
      cancel.setAttribute('aria-label', `Cancel ${name} booking at ${booking.start}`);
      cancel.onclick = () => this.run(() => onCancel(booking.id), 'Booking cancelled.');
      row.append(cancel);
      this.list.append(row);
    }
  }

  run(action, successMessage) {
    try {
      action();
      this.status.textContent = successMessage;
    } catch (error) {
      this.status.textContent = error.message;
    }
  }
}
