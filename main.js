import { BookingRepository } from './src/booking/BookingRepository.js';
import { BookingService } from './src/booking/BookingService.js';
import { BookingController } from './src/booking/BookingController.js';
import { PlayerView } from './src/booking/PlayerView.js';
import { AdminBookingView } from './src/booking/AdminBookingView.js';
import { PitchRepository } from './src/pitch/PitchRepository.js';
import { PitchService } from './src/pitch/PitchService.js';
import { PitchForm } from './src/pitch/PitchForm.js';
import { InAppNotifier } from './src/notify/InAppNotifier.js';
import { InboxView } from './src/notify/InboxView.js';
import { DemoSession } from './src/account/DemoSession.js';
import { VenueRepository } from './src/venue/VenueRepository.js';
import { FacilityService } from './src/venue/FacilityService.js';
import { VenueView } from './src/venue/VenueView.js';
import { seedFacilities } from './demo/seedFacilities.js';

function startApp() {
  const field = id => document.getElementById(id);
  const pitches = new PitchRepository(localStorage);
  const venues = new VenueRepository(localStorage, pitches);
  seedFacilities(localStorage, venues, pitches);
  const facilities = new FacilityService(venues, pitches);
  const pitchService = new PitchService(pitches, facilities);
  const notifier = new InAppNotifier(localStorage);
  const bookings = new BookingRepository(localStorage);
  const service = new BookingService(bookings, facilities, notifier);
  const session = new DemoSession(localStorage);
  const playerView = new PlayerView(field('player'));
  const adminView = new AdminBookingView(field('managed-bookings'));
  const pitchForm = new PitchForm(field('pitch-form'));
  const venueView = new VenueView(field('venues'));
  const inbox = new InboxView(field('inbox'));
  const controller = new BookingController(service, session, refresh);
  let selectedVenueId = '';

  field('actor').replaceChildren(...session.all().map(account => new Option(account.name, account.id)));
  field('actor').value = session.current().id;
  field('actor').onchange = () => {
    try {
      session.select(field('actor').value);
      selectedVenueId = '';
      for (const view of [playerView, adminView, pitchForm, venueView]) view.status.textContent = '';
      refresh();
    } catch (error) {
      field('actor').value = session.current().id;
      field('app-result').textContent = error.message;
    }
  };

  function changeFacility(action) {
    try { return action(); }
    finally { refresh(); }
  }

  function refresh() {
    const actor = session.current();
    const isPlayer = actor.role === 'player';
    const allPitches = pitches.all();
    const allVenues = venues.all();
    field('app-result').textContent = '';
    field('player').hidden = !isPlayer;
    field('inbox').hidden = !isPlayer;
    field('admin').hidden = isPlayer;
    if (isPlayer) {
      playerView.render({
        pitches: allPitches.filter(pitch => pitch.active && allVenues.some(venue => venue.id === pitch.venueId && venue.active)),
        allPitches,
        bookings: service.getUpcomingBookings(actor),
        onRequest: (pitchId, start, end) => controller.request(pitchId, start, end),
        onCancel: id => controller.cancel(id),
      });
      inbox.render({ messages: notifier.forUser(actor.id) });
      return;
    }

    adminView.render({
      bookings: service.getManagedBookings(actor),
      pitches: allPitches,
      accounts: session.all(),
      onConfirm: id => controller.confirm(id),
      onReject: id => controller.reject(id),
    });
    const managedVenues = facilities.getManagedVenues(actor);
    if (!managedVenues.some(venue => venue.id === selectedVenueId)) {
      selectedVenueId = managedVenues[0]?.id ?? '';
    }
    const venue = managedVenues.find(item => item.id === selectedVenueId);
    venueView.render({
      venues: managedVenues,
      selectedId: selectedVenueId,
      onSelect(id) {
        selectedVenueId = id;
        venueView.status.textContent = '';
        pitchForm.status.textContent = '';
        refresh();
      },
      onUpdate: (id, details) => changeFacility(() => facilities.updateVenue(session.current(), id, details)),
      onDeactivate: (type, id) => changeFacility(() => facilities.deactivate(session.current(), type, id)),
    });
    field('pitch-form').hidden = !venue?.active;
    pitchForm.render({
      pitches: venue?.pitches ?? [],
      onCreate: details => changeFacility(() => pitchService.addPitch(session.current(), { ...details, venueId: selectedVenueId })),
      onUpdate: (id, details) => changeFacility(() => pitchService.updatePitch(session.current(), id, details)),
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
  playerView.form.elements.start.value = day + 'T18:00';
  playerView.form.elements.end.value = day + 'T19:30';
  refresh();
}

try {
  startApp();
} catch (error) {
  document.getElementById('app-result').textContent = `Unable to load KickSlot. ${error.message}`;
}
