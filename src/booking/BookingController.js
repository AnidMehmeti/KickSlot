export class BookingController {
  constructor(service, session, refresh) {
    this.service = service;
    this.session = session;
    this.refresh = refresh;
  }

  request(pitchId, start, end) {
    return this.run(() => this.service.createBooking(this.session.current(), pitchId, start, end));
  }

  cancel(bookingId) {
    return this.run(() => this.service.cancelBooking(this.session.current(), bookingId));
  }

  confirm(bookingId) {
    return this.run(() => this.service.confirmBooking(this.session.current(), bookingId));
  }

  reject(bookingId) {
    return this.run(() => this.service.rejectBooking(this.session.current(), bookingId));
  }

  run(action) {
    try {
      return action();
    } finally {
      // A saved decision must appear even when sending its notification fails.
      this.refresh();
    }
  }
}
