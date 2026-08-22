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

    let isSuspended = borrower.isSuspended === true || borrower.isSuspended === 'TRUE' || borrower.isSuspended === 'true';
    let suspendedUntil = borrower.suspendedUntil;
    let suspensionType = borrower.suspensionType;
    let suspensionReason = borrower.suspensionReason;
    
    if (isSuspended && suspendedUntil && new Date(suspendedUntil) < new Date()) {
      isSuspended = false;
      suspendedUntil = '';
      suspensionType = '';
      suspensionReason = '';
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
      isSuspended,
      suspensionType,
      suspensionReason,
      suspendedUntil
    };
  },

  /**
   * Get all borrowers
   */
  getAll() {
    const borrowers = Database.getAll(this.SHEET_NAME);
    const now = new Date();
    return borrowers.map(b => {
      let isSuspended = b.isSuspended === true || b.isSuspended === 'TRUE' || b.isSuspended === 'true';
      let suspendedUntil = b.suspendedUntil;
      let suspensionType = b.suspensionType;
      let suspensionReason = b.suspensionReason;
      
      if (isSuspended && suspendedUntil && new Date(suspendedUntil) < now) {
        isSuspended = false;
        suspendedUntil = '';
        suspensionType = '';
        suspensionReason = '';
      }

      return {
        id: b.id,
        name: b.name,
        email: b.email,
        studentId: b.studentId,
        yearLevel: b.yearLevel,
        department: b.department,
        faculty: b.faculty,
        phoneNumber: b.phoneNumber,
        isSuspended,
        suspensionType,
        suspensionReason,
        suspendedUntil
      };
    });
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

    const updated = Database.update(this.SHEET_NAME, id, updateData);
    Email.sendUnsuspend(borrower.email, borrower.name, true);
    return updated;
  }
};
