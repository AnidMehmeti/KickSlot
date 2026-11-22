# KickSlot

A player requests a football pitch and the venue administrator decides the request. This checkout runs as a single-tab browser demo with two players, two administrators, two venues and three seeded pitches. Data is saved in localStorage on the current browser origin. Switching demo accounts models roles and ownership. Secure sign-in and scheduling across devices or tabs are outside this version.

## Open the app

In VS Code, open the repository folder, right-click the root `index.html` and choose **Open with Live Server**. Use the same host and port when checking persistence. The app uses native JavaScript modules and requires no package installation. The earlier preview remains at `demo/a2.html` with separate storage.

| Demo account | ID | Access |
| --- | --- | --- |
| Player 1 | `p1` | Own bookings and inbox |
| Player 2 | `p2` | Own bookings and inbox |
| Administrator 1 | `a1` | Trepca Sports Centre, Grass and Indoor pitches |
| Administrator 2 | `a2` | Riverside Sports Centre and Riverside pitch |

Seeded pitches open 17:00–21:00 every day. Grass and Riverside start at €20/hour, and Indoor starts at €30/hour. The configuration form applies one opening interval and a whole-euro hourly rate to every weekday. PitchBuilder also supports individual weekday entries and rates in whole cents.

1. As Player 1, select a pitch. The default interval is tomorrow, 18:00–19:30. Grass costs €30 for 90 minutes, indoor costs €45. Request the slot and check the stored price and Pending state.
2. Submit it again. The conflict message appears and the original form values stay in place. Player 2 has a separate list.
3. Switch to Administrator 1 and confirm the booking in the list. Switch back to Player 1 and refresh. The list shows Confirmed and the inbox contains the decision.
4. Click Cancel on that row. It disappears from upcoming bookings, and requesting the same slot succeeds again. A request before 17:00 displays the opening-hours error.
5. Request a separate slot and reject it as the managing administrator. Check the owning player's inbox. Administrator 2 sees bookings only for Riverside.
6. As Administrator 1, select Grass in the pitch configuration form and save a new hourly rate. Existing booking totals stay fixed. A new request uses the new rate. Choose New pitch to create an additional pitch.
7. Edit the venue name or address, deactivate one pitch, then deactivate the venue. Reload. The venue and all its pitches stay inactive, existing bookings remain, and normal decisions and cancellations still apply. Riverside remains available.

Deactivation persists. Run the walkthrough in a fresh browser profile or private window if you want to start with the seeded facilities again.

## Player view and callbacks

Construct one `PlayerView(rootElement)` inside a player screen. Call the following each time the selected player or their booking data changes:

```js
view.render({ pitches, allPitches, bookings, onRequest, onCancel });
```

- `pitches` supplies active, selectable objects with string `id` and display `name`. `allPitches` includes inactive pitches so existing bookings keep their display names. It defaults to `pitches` for earlier callers. An empty selectable list disables requesting.
- `bookings` comes from `service.getUpcomingBookings(currentPlayer)`. Each row uses `id`, `pitchId`, `start`, `end`, `totalCents` and `stateName`. The view formats the saved cents as euros.
- `onRequest(pitchId, start, end)` receives the selected ID and local minute strings in `YYYY-MM-DDTHH:mm` format. It calls `BookingController.request`, which gets the current player from DemoSession and delegates to BookingService.
- `onCancel(bookingId)` calls `BookingController.cancel`. The administrator view uses the controller's `confirm` and `reject` methods.
- Controller actions run synchronously and refresh from the service in a `finally` block. Errors reach the view for display. This also refreshes a saved decision when notification delivery fails.

## Pitch form and inbox

Mount one `PitchForm(rootElement)` and one `InboxView(rootElement)`. Call `render` again when the selected account or the stored data changes. The views do not know who is logged in. The caller passes the current account to the service.

```js
pitchForm.render({ pitches, onCreate, onUpdate });
inbox.render({ messages });
```

- `onCreate(details)` receives `name`, `surface`, `indoor`, `open`, `close`, and `eurosPerHour`. Add the current administrator and `venueId`, then call `pitchService.addPitch(admin, details)`.
- `onUpdate(pitchId, details)` receives the selected pitch plus `open`, `close`, and `eurosPerHour`. Call `pitchService.updatePitch(admin, pitchId, details)`.
- `messages` comes from `notifier.forUser(player.id)`. Each item has `userId`, `message`, and `createdAt`.
- `InAppNotifier` implements the `NotificationSender.send(userId, message)` contract and is injected into BookingService. Confirm, reject, and cancel send only after the booking is saved. A denied action does not send.

## What is stored

| Key | Data |
| --- | --- |
| `kickslot.bookings` | Default BookingRepository key. JSON array of records with `id`, `playerId`, `pitchId`, `start`, `end`, `createdAt`, `totalCents`, `stateName`. IDs are strings, timestamps are local minutes, price is an integer. |
| `kickslot.demo.bookings` | The preview's repository uses the same fields under this separate key. Saving updates by ID. Loading uses `Booking.fromJSON` to restore the State object. |
| `kickslot.messages` | Default InAppNotifier key. JSON array of `{ userId, message, createdAt }`. `createdAt` is a local minute. |
| `kickslot.demo.messages` | The preview uses the same fields under this separate key. The inbox shows the selected player's messages. |
| `kickslot.pitches` | Default PitchRepository key. |
| `kickslot.demo.pitches` | The preview stores built pitches under this separate key. |
| `kickslot.venues` | Venue ID, name, address, administrator ID and active flag. Children are loaded from pitches by `venueId`. |
| `kickslot.account` | Selected demo account ID, restored after reload. |
| `kickslot.demo.venues`, `kickslot.demo.account` | Venue and account storage for the earlier preview. |

The root app uses the default repository keys. `main.js` constructs the repositories, services, session, controller and views. Shared initialization in `demo/seedFacilities.js` builds the seed pitches and adds venues when their storage is first created. Reloading preserves edits and deactivation. Existing preview pitch records retain their IDs and configuration when venues are introduced.

## Verification

Direct module checks passed for controller requests and decisions, stored prices, overlap and adjacency, permissions, final states, cancellation at the start time, inbox recipients, persistence, repeated seeding, venue deactivation and refresh after notification failure. Additional checks covered duplicate pitch IDs, malformed opening times and overlapping price tiers.

The venue preview was checked in the browser for account switching, venue editing, pitch and venue deactivation, persistence, and confirmation/cancellation of an existing booking after deactivation. The root app's full browser walkthrough is still pending. Follow the steps above through Live Server before the final demonstration.

## Design and handoff

Booking delegates transitions to Pending, Confirmed, Cancelled and Rejected State objects. BookingService checks the current actor, ownership, time, availability and price before saving. PitchBuilder validates pitch configuration before construction.

Venue is the Composite and Pitch is its leaf. FacilityService checks ownership and calls `target.deactivate()` for either type. Venue forwards that operation to its loaded pitches, and FacilityService persists the affected records. BookingController obtains the current account and delegates booking actions to BookingService. NotificationSender supplies the small contract for the injected inbox sender.

Original diagrams are in `diagrams/Part 1/`. Earlier Part 2 diagrams are in `diagrams/Part 2/`. Final UML comparison and the report remain submission tasks.
