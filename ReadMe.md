# KickSlot

A player requests a football pitch and the venue administrator decides the request. This checkout runs as a single-tab browser demo with prepared accounts, two sample pitches and localStorage on the current browser origin. Switching demo accounts models roles and ownership. Secure sign-in and scheduling across devices are outside this version.

## Open the preview

In VS Code, open the repository folder, right-click `demo/a2.html` and choose **Open with Live Server**. Use the same host and port when checking persistence. No package installation is needed.

1. As Player 1, select a pitch. The default interval is tomorrow, 18:00–19:30. Grass costs €30 for 90 minutes, indoor costs €45. Request the slot and check the stored price and Pending state.
2. Submit it again. The conflict message appears and the original form values stay in place. Player 2 has a separate list.
3. Switch to Administrator 1, select the booking, and confirm it. Switch back to Player 1 and refresh. The list shows Confirmed and the inbox contains the decision.
4. Click Cancel on that row. It disappears from upcoming bookings, and requesting the same slot succeeds again. A request before 17:00 displays the opening-hours error.

## Player view and callbacks

Construct one `PlayerView(rootElement)` inside a player screen. Call the following each time the selected player or their booking data changes:

```js
view.render({ pitches, bookings, onRequest, onCancel });
```

- `pitches` supplies selectable objects with string `id` and display `name`. If a booked pitch is no longer selectable, its row falls back to its stored pitch ID. An empty pitch list disables requesting.
- `bookings` comes from `service.getUpcomingBookings(currentPlayer)`. Each row uses `id`, `pitchId`, `start`, `end`, `totalCents` and `stateName`. The view formats the saved cents as euros.
- `onRequest(pitchId, start, end)` receives the selected ID and local minute strings in `YYYY-MM-DDTHH:mm` format. Its caller supplies the current player to `service.createBooking(player, pitchId, start, end)`.
- `onCancel(bookingId)` receives the ID from the clicked row. Its caller calls `service.cancelBooking(player, bookingId)`.
- Both callbacks run synchronously. The preview refreshes from the service in a `finally` block and lets any error reach the view, which displays its message. Refreshing even after an error matters if a booking was saved before a notification failed.

## What is stored

| Key | Data |
| --- | --- |
| `kickslot.bookings` | Default BookingRepository key. JSON array of records with `id`, `playerId`, `pitchId`, `start`, `end`, `createdAt`, `totalCents`, `stateName`. IDs are strings, timestamps are local minutes, price is an integer. |
| `kickslot.demo.bookings` | The preview's repository uses the same fields under this separate key. Saving updates by ID. Loading uses `Booking.fromJSON` to restore the State object. |
| `kickslot.demo.messages` | Preview inbox array containing `{ userId, message }`. The screen shows messages for the selected player. |

The two sample pitches, venue and accounts are defined in `demo/a2.js`. Pitch and venue persistence and the real inbox belong to later stages.

## Verification

The browser walkthrough above is available through Live Server. Anid's optional A1 suite can also run with Node 22 from the repository root. With the previously supplied A1 file at `tests/booking.test.js`, run:

```sh
node --experimental-default-type=module --test tests/booking.test.js
```

A3 verification used the team's current booking modules with that suite. All 22 tests passed. The player preview was exercised in a browser for requests, conflicts, role-specific lists, confirmation, persistence after reload, cancellation, rejection, notifications and slot reuse. All five refined sequence diagrams passed a PlantUML syntax check.

## Where the handoff starts

**Olti (L1).** Start with the existing `BookingService(repository, facilities, sender)`. Replace the two sample pitches with built pitches that expose `id`, `name`, `venueId`, `active`, `isOpenDuring(start, end)` and `calculatePrice(start, end)`. Return whole cents for a single applicable tier and throw for an interval without a covering tier. Implement the sender's synchronous `send(userId, message)`. Keep the preview's simple venue while your work is in progress.

**Orges (O1–O3).** Supply the real venue lookup, Composite deactivation and demo-session account. Connect BookingController using the two player callbacks above. The account comes from the current session. The controller refreshes the view, while BookingService retains permission checks and orchestration and Booking retains State transitions.

**UML.** Original sequences remain under `diagrams/Part 1/`. The current A0 class overview is in `diagrams/Part 2/class-diagram.puml`. The five refined sequence sources are in `docs/uml/refined/`. They distinguish the working A1–A3 operations, preview substitutes, and planned integrations. Orges checks the final versions against the complete app after the last integration.