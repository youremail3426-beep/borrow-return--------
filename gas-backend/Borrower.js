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
      borrowerName: borrower.name,
      borrowerEmail: borrower.email,
      studentId: borrower.studentId,
      yearLevel: borrower.yearLevel,
      department: borrower.department,
      faculty: borrower.faculty,
      phoneNumber: borrower.phoneNumber
    };
  }
};
