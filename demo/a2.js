import { BookingRepository } from '../src/booking/BookingRepository.js';
import { BookingService } from '../src/booking/BookingService.js';
import { PlayerView } from '../src/booking/PlayerView.js';

const venue = { id: 'venue1', adminId: 'a1', active: true };

function samplePitch(id, name, hourlyCents) {
  return {
    id, name, venueId: venue.id, active: true,
    isOpenDuring(start, end) {
      return start.slice(11) >= '17:00' && end.slice(11) <= '21:00';
    },
    calculatePrice(start, end) {
      const minutes = time => Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
      return Math.round(hourlyCents * (minutes(end) - minutes(start)) / 60);
    }
  };
}

const pitches = [samplePitch('pitch1', 'Grass pitch', 2000), samplePitch('pitch2', 'Indoor pitch', 3000)];
const facilities = {
  getPitch(id) {
    const pitch = pitches.find(p => p.id === id);
    if (!pitch) throw new Error('Pitch not found.');
    return pitch;
  },
  getVenue(id) {
    if (id !== venue.id) throw new Error('Venue not found.');
    return venue;
  }
};

const messagesKey = 'kickslot.demo.messages';
const messages = () => JSON.parse(localStorage.getItem(messagesKey) ?? '[]');
const sender = {
  send(userId, message) {
    localStorage.setItem(messagesKey, JSON.stringify([...messages(), { userId, message }]));
  }
};
const repository = new BookingRepository(localStorage, 'kickslot.demo.bookings');
const service = new BookingService(repository, facilities, sender);
const accounts = {
  p1: { id: 'p1', role: 'player' }, p2: { id: 'p2', role: 'player' },
  a1: { id: 'a1', role: 'admin' }, a2: { id: 'a2', role: 'admin' }
};
const field = id => document.getElementById(id);
const actor = () => accounts[field('actor').value];
const view = new PlayerView(field('player'));

function refresh() {
  const player = actor().role === 'player';
  field('player').hidden = !player;
  field('inbox').hidden = !player;
  field('admin').hidden = player;
  if (player) {
    view.render({
      pitches,
      bookings: service.getUpcomingBookings(actor()),
      onRequest(pitchId, start, end) {
        try { service.createBooking(actor(), pitchId, start, end); }
        finally { refresh(); }
      },
      onCancel(bookingId) {
        try { service.cancelBooking(actor(), bookingId); }
        finally { refresh(); }
      }
    });
    const mine = messages().filter(m => m.userId === actor().id);
    const texts = mine.length ? mine.map(m => m.message) : ['No messages.'];
    field('messages').replaceChildren(...texts.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  } else {
    const bookings = service.getManagedBookings(actor());
    const options = bookings.map(b =>
      new Option(`${facilities.getPitch(b.pitchId).name} · ${b.playerId} · ${b.start} · ${b.stateName}`, b.id)
    );
    field('managed').replaceChildren(...options);
    if (!options.length) field('managed').add(new Option('No bookings', ''));
    field('confirm').disabled = field('reject').disabled = !options.length;
  }
}

function decide(action) {
  try {
    const booking = action(actor(), field('managed').value);
    field('admin-result').textContent = 'Saved: ' + booking.stateName;
  } catch (error) {
    field('admin-result').textContent = error.message;
  }
  refresh();
}

field('confirm').onclick = () => decide((admin, id) => service.confirmBooking(admin, id));
field('reject').onclick = () => decide((admin, id) => service.rejectBooking(admin, id));
field('actor').onchange = () => {
  view.status.textContent = '';
  field('admin-result').textContent = '';
  refresh();
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const day = [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()]
  .map(part => String(part).padStart(2, '0')).join('-');
view.form.elements.start.value = day + 'T18:00';
view.form.elements.end.value = day + 'T19:30';
refresh();