const Settings = {
  SHEET_NAME: 'Settings',

  get(key) {
    const rows = Database.find(this.SHEET_NAME, 'key', key);
    return rows.length ? rows[0].value : null;
  },

  getAll() {
    const data = Database.getAll(this.SHEET_NAME);
    const result = {};
    data.forEach(d => result[d.key] = d.value);
    return result;
  },

  set(key, value) {
    const rows = Database.find(this.SHEET_NAME, 'key', key);
    if (rows.length > 0) {
      return Database.update(this.SHEET_NAME, rows[0].id, { value });
    } else {
      return Database.insert(this.SHEET_NAME, { key, value });
    }
  },

  setMultiple(settingsObj) {
    for (const key in settingsObj) {
      this.set(key, settingsObj[key]);
    }
    return this.getAll();
  }
};
