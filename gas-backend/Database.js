/**
 * Database Helper
 * Abstracts Google Sheets as a database
 */
const Database = {
  getSheet(sheetName) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(sheetName);
  },

  /**
   * Run this function ONCE to create all necessary sheets and headers
   */
  initDb() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const schema = {
      'Admins': ['id', 'email', 'password', 'name', 'createdAt', 'updatedAt'],
      'Borrowers': ['id', 'studentId', 'name', 'email', 'yearLevel', 'department', 'faculty', 'phoneNumber', 'createdAt', 'updatedAt'],
      'Equipments': ['id', 'name', 'serialNumber', 'imageUrl', 'status', 'createdAt', 'updatedAt'],
      'Reservations': ['id', 'borrowerId', 'borrowDate', 'returnDate', 'status', 'createdAt', 'updatedAt'],
      'ReservationItems': ['id', 'reservationId', 'equipmentId'],
      'BorrowTransactions': ['id', 'borrowerId', 'borrowDate', 'dueDate', 'returnedDate', 'notes', 'conditionImageUrl', 'adminId', 'createdAt', 'updatedAt'],
      'BorrowItems': ['id', 'transactionId', 'equipmentId', 'returnedAt']
    };

    for (const [sheetName, headers] of Object.entries(schema)) {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      // Set headers on the first row
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Make headers bold
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Create a default admin if not exists
    const adminsSheet = ss.getSheetByName('Admins');
    if (adminsSheet.getLastRow() <= 1) {
       adminsSheet.appendRow(['admin-1', 'admin@admin.com', 'smofte', 'Super Admin', new Date().toISOString(), new Date().toISOString()]);
    }
  },

  /**
   * Get all rows as objects
   */
  getAll(sheetName) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers or empty

    const headers = data[0];
    const rows = [];

    for (let i = 1; i < data.length; i++) {
      const rowData = {};
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = data[i][j];
      }
      rows.push(rowData);
    }
    return rows;
  },

  /**
   * Find a single row by ID
   */
  getById(sheetName, id) {
    const all = this.getAll(sheetName);
    return all.find(row => row.id === id) || null;
  },

  /**
   * Find rows by a specific field
   */
  find(sheetName, field, value) {
    const all = this.getAll(sheetName);
    return all.filter(row => row[field] === value);
  },

  /**
   * Insert a new row
   */
  insert(sheetName, dataObject) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);

    if (!dataObject.id) dataObject.id = Utilities.getUuid();
    
    const now = new Date().toISOString();
    dataObject.createdAt = now;
    dataObject.updatedAt = now;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];

    for (let i = 0; i < headers.length; i++) {
      newRow.push(dataObject[headers[i]] || "");
    }

    sheet.appendRow(newRow);
    return dataObject;
  },

  /**
   * Update an existing row by ID
   */
  update(sheetName, id, updateData) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    updateData.updatedAt = new Date().toISOString();

    for (let i = 1; i < data.length; i++) {
      const idIndex = headers.indexOf('id');
      if (data[i][idIndex] === id) {
        for (const key in updateData) {
          const colIndex = headers.indexOf(key);
          if (colIndex !== -1) {
            sheet.getRange(i + 1, colIndex + 1).setValue(updateData[key]);
          }
        }
        return this.getById(sheetName, id);
      }
    }
    throw new Error("Record not found with ID: " + id);
  },

  /**
   * Delete a row by ID
   */
  deleteRow(sheetName, id) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) throw new Error("Sheet not found: " + sheetName);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  }
};
