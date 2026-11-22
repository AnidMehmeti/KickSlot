export class NotificationSender {
  send(userId, message) {
    throw new Error('A notification sender must implement send(userId, message).');
  }
}
