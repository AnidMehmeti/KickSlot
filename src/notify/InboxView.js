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
      row.textContent = when + item.message;
      return row;
    }));
  }
}
