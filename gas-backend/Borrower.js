/**
 * Borrower Operations
 */
const Borrower = {
  SHEET_NAME: 'Borrowers',

  /**
   * Search for a borrower by email, name, or studentId
   * @param {Object} query - e.g., { email: '...', name: '...', studentId: '...' }
   */
  search(query) {
    if (!query.email && !query.name && !query.studentId) {
      throw new Error('Search query is empty');
    }

    const allBorrowers = Database.getAll(this.SHEET_NAME);
    
    // Find the first matching borrower
    const borrower = allBorrowers.find(b => {
      if (query.studentId && b.studentId == query.studentId) return true;
      if (query.email && b.email === query.email) return true;
      if (query.name && b.name.includes(query.name)) return true;
      return false;
    });

    if (!borrower) {
      throw new Error('Borrower not found');
    }

    return {
      id: borrower.id,
      borrowerName: borrower.name,
      borrowerEmail: borrower.email,
      studentId: borrower.studentId,
      yearLevel: borrower.yearLevel,
      department: borrower.department,
      faculty: borrower.faculty,
      phoneNumber: borrower.phoneNumber,
      isSuspended: borrower.isSuspended === true || borrower.isSuspended === 'TRUE' || borrower.isSuspended === 'true',
      suspensionType: borrower.suspensionType,
      suspensionReason: borrower.suspensionReason,
      suspendedUntil: borrower.suspendedUntil
    };
  },

  /**
   * Get all borrowers
   */
  getAll() {
    const borrowers = Database.getAll(this.SHEET_NAME);
    return borrowers.map(b => ({
      id: b.id,
      name: b.name,
      email: b.email,
      studentId: b.studentId,
      yearLevel: b.yearLevel,
      department: b.department,
      faculty: b.faculty,
      phoneNumber: b.phoneNumber,
      isSuspended: b.isSuspended === true || b.isSuspended === 'TRUE' || b.isSuspended === 'true',
      suspensionType: b.suspensionType,
      suspensionReason: b.suspensionReason,
      suspendedUntil: b.suspendedUntil
    }));
  },

  /**
   * Suspend a borrower manually
   */
  suspend(id, reason, suspendedUntil) {
    const borrower = Database.getById(this.SHEET_NAME, id);
    if (!borrower) throw new Error('Borrower not found');
    if (!reason) throw new Error('Reason is required');

    const updateData = {
      isSuspended: true,
      suspensionType: 'MANUAL',
      suspensionReason: reason,
      suspendedUntil: suspendedUntil || ''
    };

    const updated = Database.update(this.SHEET_NAME, id, updateData);
    
    const untilStr = suspendedUntil ? new Date(suspendedUntil).toLocaleDateString('th-TH') : 'ไม่มีกำหนด';
    Email.sendSuspensionManual(borrower.email, borrower.name, reason, untilStr);

    return updated;
  },

  /**
   * Unsuspend a borrower
   */
  unsuspend(id) {
    const borrower = Database.getById(this.SHEET_NAME, id);
    if (!borrower) throw new Error('Borrower not found');

    const updateData = {
      isSuspended: false,
      suspensionType: '',
      suspensionReason: '',
      suspendedUntil: ''
    };

    return Database.update(this.SHEET_NAME, id, updateData);
  }
};
