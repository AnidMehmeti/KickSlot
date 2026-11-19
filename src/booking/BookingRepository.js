import { Booking } from './Booking.js';

export class BookingRepository {
  constructor(storage, key = 'kickslot.bookings') {
    this.storage = storage;
    this.key = key;
  }

  all() {
    const records = JSON.parse(this.storage.getItem(this.key) ?? '[]');
    return records.map(record => Booking.fromJSON(record));
  }

  save(booking) {
    const bookings = this.all();
    const index = bookings.findIndex(item => item.id === booking.id);
    if (index === -1) bookings.push(booking);
    else bookings[index] = booking;

    this.storage.setItem(this.key, JSON.stringify(bookings));
  }
}