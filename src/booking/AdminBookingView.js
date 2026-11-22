const euros = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

export class AdminBookingView {
  constructor(root) {
    root.innerHTML = `
      <h2>Bookings I manage</h2>
      <ul></ul>
      <p role="status" aria-live="polite"></p>`;
    this.list = root.querySelector('ul');
    this.status = root.querySelector('[role="status"]');
  }

  render({ bookings, pitches, accounts, onConfirm, onReject }) {
    this.list.replaceChildren();
    if (bookings.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No bookings for your venues.';
      this.list.append(empty);
    }
    for (const booking of bookings) {
      const pitch = pitches.find(item => item.id === booking.pitchId);
      const player = accounts.find(item => item.id === booking.playerId);
      const row = document.createElement('li');
      const details = document.createElement('p');
      details.textContent = `${pitch?.name ?? booking.pitchId} · ${player?.name ?? booking.playerId} · ${booking.start.replace('T', ' ')}–${booking.end.slice(11)} · ${euros.format(booking.totalCents / 100)} · ${booking.stateName}`;
      row.append(details);
      if (booking.stateName === 'Pending') {
        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.textContent = 'Confirm';
        confirm.onclick = () => this.run(() => onConfirm(booking.id), 'Booking confirmed.');
        const reject = document.createElement('button');
        reject.type = 'button';
        reject.textContent = 'Reject';
        reject.onclick = () => this.run(() => onReject(booking.id), 'Booking rejected.');
        row.append(confirm, reject);
      }
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
