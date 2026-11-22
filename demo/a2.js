import { BookingRepository } from '../src/booking/BookingRepository.js';
import { BookingService } from '../src/booking/BookingService.js';
import { PlayerView } from '../src/booking/PlayerView.js';
import { PitchRepository } from '../src/pitch/PitchRepository.js';
import { PitchService } from '../src/pitch/PitchService.js';
import { PitchForm } from '../src/pitch/PitchForm.js';
import { InAppNotifier } from '../src/notify/InAppNotifier.js';
import { InboxView } from '../src/notify/InboxView.js';

const venue = { id: 'venue1', adminId: 'a1', active: true };
const accounts = {
  p1: { id: 'p1', role: 'player' }, p2: { id: 'p2', role: 'player' },
  a1: { id: 'a1', role: 'admin' }, a2: { id: 'a2', role: 'admin' }
};

const pitchRepository = new PitchRepository(localStorage, 'kickslot.demo.pitches');
const facilities = {
  getPitch(id) { return pitchRepository.find(id); },
  getVenue(id) {
    if (id !== venue.id) throw new Error('Venue not found.');
    return venue;
  }
};
const pitchService = new PitchService(pitchRepository, facilities);

if (pitchRepository.all().length === 0) {
  pitchService.addPitch(accounts.a1, {
    id: 'pitch1', name: 'Grass pitch', venueId: venue.id,
    surface: 'Grass', indoor: false, open: '17:00', close: '21:00', eurosPerHour: 20
  });
  pitchService.addPitch(accounts.a1, {
    id: 'pitch2', name: 'Indoor pitch', venueId: venue.id,
    surface: 'Turf', indoor: true, open: '17:00', close: '21:00', eurosPerHour: 30
  });
}

const notifier = new InAppNotifier(localStorage, 'kickslot.demo.messages');
const repository = new BookingRepository(localStorage, 'kickslot.demo.bookings');
const service = new BookingService(repository, facilities, notifier);
const field = id => document.getElementById(id);
const actor = () => accounts[field('actor').value];
const view = new PlayerView(field('player'));
const pitchForm = new PitchForm(field('pitch-form'));
const inbox = new InboxView(field('inbox'));

function refresh() {
  const player = actor().role === 'player';
  const pitches = pitchRepository.all();
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
    inbox.render({ messages: notifier.forUser(actor().id) });
  } else {
    pitchForm.render({
      pitches,
      onCreate(details) {
        try { pitchService.addPitch(actor(), { ...details, venueId: venue.id }); }
        finally { refresh(); }
      },
      onUpdate(pitchId, details) {
        try { pitchService.updatePitch(actor(), pitchId, details); }
        finally { refresh(); }
      }
    });
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
  pitchForm.status.textContent = '';
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
