export class InboxView {
  constructor(root) {
    root.innerHTML = `<h2>My messages</h2><ul></ul>`;
    this.list = root.querySelector('ul');
  }

  render({ messages }) {
    const rows = messages.length ? messages : [{ message: 'No messages.' }];
    this.list.replaceChildren(...rows.map(item => {
      const row = document.createElement('li');
      const when = item.createdAt ? `${item.createdAt.replace('T', ' ')} · ` : '';
      // Display earlier saved booking messages in the same format as new ones.
      const message = item.message.replace(
        /(Your booking for )(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}/,
        '$1$4-$3-$2',
      );
      row.textContent = when + message;
      return row;
    }));
  }
}
