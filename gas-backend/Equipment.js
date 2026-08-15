/**
 * Equipment Controller
 */
const Equipment = {
  SHEET_NAME: 'Equipments',

  getAll() {
    return Database.getAll(this.SHEET_NAME);
  },

  getById(id) {
    if (!id) throw new Error('ID is required');
    return Database.getById(this.SHEET_NAME, id);
  },

  getByIds(idsStr) {
    if (!idsStr) return [];
    const ids = idsStr.split(',');
    const all = Database.getAll(this.SHEET_NAME);
    return all.filter(eq => ids.includes(eq.id));
  },

  create(data) {
    if (!data.name || !data.serialNumber) {
      throw new Error('Name and Serial Number are required');
    }
    
    // Check for duplicate serial number
    const existing = Database.find(this.SHEET_NAME, 'serialNumber', data.serialNumber);
    if (existing.length > 0) {
      throw new Error('Equipment with this serial number already exists');
    }

    let imageUrl = data.imageUrl || '';
    if (data.imageBase64) {
      imageUrl = Upload.saveImageToDrive(data.imageBase64, `eq_${data.serialNumber}`);
    }

    const newEq = {
      name: data.name,
      serialNumber: data.serialNumber,
      imageUrl: imageUrl,
      status: data.status || 'AVAILABLE',
    };
    return Database.insert(this.SHEET_NAME, newEq);
  },

  update(id, data) {
    if (!id) throw new Error('ID is required');
    
    let updateData = { ...data };
    if (data.imageBase64) {
      updateData.imageUrl = Upload.saveImageToDrive(data.imageBase64, `eq_update_${id}`);
      delete updateData.imageBase64;
    }
    
    return Database.update(this.SHEET_NAME, id, updateData);
  },

  delete(id) {
    if (!id) throw new Error('ID is required');
    return Database.deleteRow(this.SHEET_NAME, id);
  }
};
