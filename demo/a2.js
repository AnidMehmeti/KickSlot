import { BookingRepository } from '../src/booking/BookingRepository.js';
import { BookingService } from '../src/booking/BookingService.js';
import { PlayerView } from '../src/booking/PlayerView.js';
import { PitchRepository } from '../src/pitch/PitchRepository.js';
import { PitchService } from '../src/pitch/PitchService.js';
import { PitchForm } from '../src/pitch/PitchForm.js';
import { InAppNotifier } from '../src/notify/InAppNotifier.js';
import { InboxView } from '../src/notify/InboxView.js';
import { DemoSession } from '../src/account/DemoSession.js';
import { VenueRepository } from '../src/venue/VenueRepository.js';
import { FacilityService } from '../src/venue/FacilityService.js';
import { VenueView } from '../src/venue/VenueView.js';
import { seedFacilities } from './seedFacilities.js';

const pitchRepository = new PitchRepository(localStorage, 'kickslot.demo.pitches');
const venueRepository = new VenueRepository(localStorage, pitchRepository, 'kickslot.demo.venues');
const facilities = new FacilityService(venueRepository, pitchRepository);
const pitchService = new PitchService(pitchRepository, facilities);
seedFacilities(localStorage, venueRepository, pitchRepository);

const notifier = new InAppNotifier(localStorage, 'kickslot.demo.messages');
const repository = new BookingRepository(localStorage, 'kickslot.demo.bookings');
const service = new BookingService(repository, facilities, notifier);
const field = id => document.getElementById(id);
const session = new DemoSession(localStorage, 'kickslot.demo.account');
field('actor').replaceChildren(...session.all().map(account => new Option(account.name, account.id)));
field('actor').value = session.current().id;
const actor = () => session.current();
const view = new PlayerView(field('player'));
const pitchForm = new PitchForm(field('pitch-form'));
const inbox = new InboxView(field('inbox'));
const venueView = new VenueView(field('venues'));
let selectedVenueId = '';

function changeFacility(action) {
  try { return action(); }
  finally { refresh(); }
}

function refresh() {
  const player = actor().role === 'player';
  const pitches = pitchRepository.all();
  field('player').hidden = !player;
  field('inbox').hidden = !player;
  field('admin').hidden = player;
  if (player) {
    view.render({
      pitches: pitches.filter(pitch => pitch.active && facilities.getVenue(pitch.venueId).active),
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
    const venues = facilities.getManagedVenues(actor());
    if (!venues.some(venue => venue.id === selectedVenueId)) selectedVenueId = venues[0]?.id ?? '';
    const venue = venues.find(item => item.id === selectedVenueId);
    venueView.render({
      venues, selectedId: selectedVenueId,
      onSelect(id) { selectedVenueId = id; refresh(); },
      onUpdate(id, details) {
        return changeFacility(() => facilities.updateVenue(actor(), id, details));
      },
      onDeactivate(type, id) {
        return changeFacility(() => facilities.deactivate(actor(), type, id));
      },
    });
    field('pitch-form').hidden = !venue?.active;
    pitchForm.render({
      pitches: venue?.pitches ?? [],
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
  session.select(field('actor').value);
  selectedVenueId = '';
  venueView.status.textContent = '';
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
