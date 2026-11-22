function localMinute() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  const day = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
  return day + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
}

export class InAppNotifier {
  constructor(storage, key = 'kickslot.messages') {
    this.storage = storage;
    this.key = key;
  }

  all() {
    return JSON.parse(this.storage.getItem(this.key) ?? '[]');
  }

  forUser(userId) {
    return this.all().filter(item => item.userId === userId);
  }

  send(userId, message) {
    if (typeof userId !== 'string' || !userId.trim()) throw new Error('A recipient is required.');
    if (typeof message !== 'string' || !message.trim()) throw new Error('A message is required.');
    const messages = this.all();
    messages.push({ userId, message, createdAt: localMinute() });
    this.storage.setItem(this.key, JSON.stringify(messages));
  }
}
