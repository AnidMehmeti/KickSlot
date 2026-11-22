export class PitchForm {
  constructor(root) {
    root.innerHTML = `
      <h2>Configure a pitch</h2>
      <p>The hours and hourly rate are stored for every day.</p>
      <form>
        <label>Pitch <select name="pitch"><option value="">New pitch</option></select></label>
        <label>Name <input name="name" required></label>
        <label>Surface <input name="surface" required></label>
        <label>Indoor <input name="indoor" type="checkbox"></label>
        <label>Opens <input name="open" type="time" required value="17:00"></label>
        <label>Closes <input name="close" type="time" required value="21:00"></label>
        <label>Euros per hour <input name="euros" type="number" min="1" step="1" required value="20"></label>
        <button type="submit">Create pitch</button>
        <button type="button" name="save">Save hours and rate</button>
      </form>
      <p role="status" aria-live="polite"></p>`;
    this.form = root.querySelector('form');
    this.status = root.querySelector('[role="status"]');
  }

  render({ pitches, onCreate, onUpdate }) {
    const { pitch, name, surface, indoor, open, close, euros, save } =
      this.form.elements;
    const previous = pitch.value;
    pitch.replaceChildren(new Option('New pitch', ''));
    for (const item of pitches) pitch.add(new Option(item.name, item.id));
    if ([...pitch.options].some((option) => option.value === previous))
      pitch.value = previous;

    const showSelected = () => {
      const selected = pitches.find((item) => item.id === pitch.value);
      save.disabled = !selected;
      this.form.querySelector('[type="submit"]').disabled = Boolean(selected);
      name.disabled = surface.disabled = indoor.disabled = Boolean(selected);
      if (!selected) return;
      name.value = selected.name;
      surface.value = selected.surface;
      indoor.checked = selected.indoor;
      open.value = selected.hours[0].open;
      close.value = selected.hours[0].close;
      euros.value = String(selected.tiers[0].hourlyCents / 100);
    };
    pitch.onchange = () => {
      if (!pitch.value) this.form.reset();
      this.status.textContent = '';
      showSelected();
    };
    showSelected();

    const schedule = () => ({
      open: open.value,
      close: close.value,
      eurosPerHour: Number(euros.value),
    });

    this.form.onsubmit = (event) => {
      event.preventDefault();
      this.run(
        () =>
          onCreate({
            name: name.value,
            surface: surface.value,
            indoor: indoor.checked,
            ...schedule(),
          }),
        'Pitch created.',
      );
    };
    save.onclick = () =>
      this.run(
        () => onUpdate(pitch.value, schedule()),
        'Hours and rate saved.',
      );
  }

  run(action, successMessage) {
    try {
      action();
      this.status.textContent = successMessage;
    } catch (error) {
      this.status.textContent = error.message;
    }
  }
}
