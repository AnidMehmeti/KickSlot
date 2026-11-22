const ACCOUNTS = [
  { id: 'p1', name: 'Player 1', role: 'player' },
  { id: 'p2', name: 'Player 2', role: 'player' },
  { id: 'a1', name: 'Administrator 1', role: 'admin' },
  { id: 'a2', name: 'Administrator 2', role: 'admin' },
].map(account => Object.freeze(account));

export class DemoSession {
  constructor(storage, key = 'kickslot.account') {
    this.storage = storage;
    this.key = key;
    this.currentId = ACCOUNTS.find(account => account.id === storage.getItem(key))?.id ?? 'p1';
  }

  all() {
    return [...ACCOUNTS];
  }

  current() {
    return ACCOUNTS.find(account => account.id === this.currentId);
  }

  select(id) {
    if (!ACCOUNTS.some(account => account.id === id)) {
      throw new Error('Choose a prepared demo account.');
    }
    this.storage.setItem(this.key, id);
    this.currentId = id;
  }
}
