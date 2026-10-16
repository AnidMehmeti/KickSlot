# KickSlot — Class Design Guide

## Design Rules

- Each administrator manages one or more venues.
- Each venue belongs to one administrator and contains one or more pitches.
- Each booking belongs to one player and reserves one pitch.
- New bookings start as PENDING.
- PENDING and CONFIRMED bookings block availability.
- CANCELLED and REJECTED bookings do not block availability.
- Only the player who made a booking can cancel it.
- Only the administrator managing its venue can confirm or reject it.
- Notifications use the user's account ID and appear within the app.

## User

Stores account information shared by Player and Administrator.

**Attributes**
- `userId`: Unique account identifier.
- `fullName`: User's name.
- `email`: Account email address.
- `passwordHash`: Hashed password; never the plain-text password.

Player and Administrator inherit these attributes. An administrator
uses a separate player account to make bookings.

## Administrator

Represents a venue manager.

**Attributes**
- `managedVenues`: Venues managed by this administrator.

**Methods**
- `managesVenue(venue)`: Returns whether the administrator manages
  the supplied venue. Used for permission checks.

## Player

Represents an account that makes bookings.

**Attributes**
- `bookings`: Bookings associated with the player.

Upcoming bookings are retrieved through BookingService.
This collection represents the same relationship shown by the
Player–Booking association; it is not separate booking data.

## Venue

Represents a facility containing football pitches.

**Attributes**
- `venueId`: Unique venue identifier.
- `name`: Venue name.
- `address`: Venue location.

**Methods**
- `updateDetails(name, address)`: Changes the venue's name and address.
- `addPitch(pitch)`: Adds a pitch to the venue.

## Pitch

Represents an individual bookable football field.

**Attributes**
- `pitchId`: Unique pitch identifier.
- `name`: Pitch name or label.
- `surfaceType`: Playing surface, such as artificial grass.
- `indoor`: Whether the pitch is indoors.
- `active`: Whether the pitch accepts new bookings.

**Methods**
- `isOpenDuring(start, end)`: Checks whether the requested period
  fits within operating hours.
- `calculatePrice(start, end)`: Selects the applicable pricing
  tier and calculates the booking price.
- `addOpeningHours(entry)`: Adds an operating-hours entry.
- `addPricingTier(tier)`: Adds a pricing rule.
- `deactivate()`: Stops new bookings without deleting the pitch
  or its booking history. Does not cancel existing bookings.

Operating hours and availability are different: a pitch can be
open but already reserved.

## Booking

Stores a reservation and controls its status changes.

**Attributes**
- `bookingId`: Unique booking identifier.
- `startTime`: Reservation start date and time.
- `endTime`: Reservation end date and time.
- `status`: PENDING, CONFIRMED, CANCELLED, or REJECTED.
- `totalPrice`: Price agreed when the booking was created.
  Later pricing changes do not alter it.
- `createdAt`: Date and time the request was submitted.

**Methods**
- `overlaps(start, end)`: Checks whether the supplied period
  overlaps this booking's period. Does not check status.
- `cancel(now)`: Changes an eligible booking to CANCELLED,
  checking its status and the cancellation timing rule.
- `confirm()`: Changes PENDING to CONFIRMED.
- `reject()`: Changes PENDING to REJECTED.

Adjacent bookings do not overlap: one can begin exactly when
another ends.

Player and pitch references are represented by UML associations.
The venue is reached through the pitch.

## BookingService

Coordinates reservation workflows and permission checks.

**Attributes**
- `notifier`: Sends in-app messages.
- `bookingRepository`: Retrieves and saves booking records.

**Methods**
- `createBooking(player, pitch, start, end)`: Validates the request,
  checks availability, calculates the price, creates a PENDING
  booking, saves it, and returns it.
- `isAvailable(pitch, start, end)`: Checks that the period is valid,
  the pitch is active and open, and no PENDING or CONFIRMED
  booking overlaps.
- `getUpcomingBookings(player, now)`: Retrieves the player's
  future PENDING and CONFIRMED bookings.
- `cancelBooking(player, booking)`: Checks ownership, calls the
  booking's cancellation method, saves the change, and notifies
  the player.
- `confirmBooking(admin, booking)`: Checks management permission,
  confirms the booking, saves it, and notifies the player.
- `rejectBooking(admin, booking)`: Checks management permission,
  rejects the booking, and saves the change.

BookingService coordinates actions; Booking validates its own
status transitions. Notifications follow a successful save.

## Notifier

Sends in-app messages.

**Methods**
- `send(userId, message)`: Sends a message to the specified account.

The 1–1 association means each BookingService has a dedicated
Notifier. It does not limit the number of messages sent.

This class does not model a stored notification inbox.

## PricingTier

Defines when a particular hourly rate applies.

**Attributes**
- `name`: Tier label, such as Peak or Off-Peak.
- `applicableDays`: Days on which the tier applies.
- `startTime`: Start of the pricing period.
- `endTime`: End of the pricing period.
- `hourlyRate`: Price per hour.

**Methods**
- `calculateCost(durationMinutes)`: Calculates
  hourlyRate × durationMinutes / 60.
- `appliesTo(day, start, end)`: Checks whether the supplied day
  and entire time interval fit this tier.

## OpeningHoursEntry

Defines an operating period for one day of the week.

**Attributes**
- `dayOfWeek`: Day covered by the entry.
- `openingTime`: Beginning of the operating period.
- `closingTime`: End of the operating period.

**Methods**
- `covers(day, start, end)`: Checks whether the supplied day
  matches and the entire interval fits within these hours.

## BookingRepository

Handles storage and retrieval of bookings.

**Methods**
- `save(booking)`: Inserts a new booking or updates an existing one.
- `findByPitch(pitch)`: Retrieves bookings for the specified pitch.
- `findByPlayer(player)`: Retrieves bookings for the specified player.

The repository handles persistence. BookingService applies
availability and permission rules.

## Rules Still to Finalize

- Cancellation cutoff and permitted cancellation states.
- Handling bookings that cross pricing tiers or midnight.
- Preventing conflicting bookings when requests arrive simultaneously.