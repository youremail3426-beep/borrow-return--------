/**
 * Borrow Controller
 */
const Borrow = {
  SHEET_NAME: 'BorrowTransactions',
  ITEMS_SHEET: 'BorrowItems',

  getAll() {
    return Database.getAll(this.SHEET_NAME);
  },

  /**
   * Helper: Check if borrower has items overdue for > 3 days
   */
  isBorrowerBlocked(borrowerId) {
    if (!borrowerId) return false;
    const borrower = Database.getById('Borrowers', borrowerId);
    if (!borrower) return false;
    
    if (borrower.isSuspended === true || borrower.isSuspended === 'TRUE' || borrower.isSuspended === 'true') {
      const now = new Date();
      if (!borrower.suspendedUntil || new Date(borrower.suspendedUntil) > now) {
        return true;
      }
    }
    return false;
  },

  /**
   * Helper: Calculate fine for overdue items (20 baht/day excluding weekends and holidays)
   */
  calculateFine(dueDateStr, returnDateStr) {
    let due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    let ret = new Date(returnDateStr);
    ret.setHours(0, 0, 0, 0);

    if (ret <= due) return 0; // Not overdue

    let overdueDays = 0;
    
    let holidays = [];
    try {
      const cal = CalendarApp.getCalendarById('th.thai#holiday@group.v.calendar.google.com');
      if (cal) {
        const events = cal.getEvents(due, new Date(ret.getTime() + 86400000));
        holidays = events.map(e => {
          let d = e.getStartTime();
          d.setHours(0,0,0,0);
          return d.getTime();
        });
      }
    } catch (e) {
      console.error("CalendarApp error: ", e);
    }

    let currentDate = new Date(due);
    currentDate.setDate(currentDate.getDate() + 1);

    while (currentDate <= ret) {
      const dayOfWeek = currentDate.getDay();
      const time = currentDate.getTime();
      
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const isHoliday = holidays.includes(time);

      if (!isWeekend && !isHoliday) {
        overdueDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return overdueDays * 20; // 20 baht per day
  },

  getAllPopulated() {
    const transactions = Database.getAll(this.SHEET_NAME);
    const borrowItems = Database.getAll(this.ITEMS_SHEET);
    const equipments = Database.getAll('Equipments');
    const borrowers = Database.getAll('Borrowers');
    const admins = Database.getAll('Admins');

    // Build lookup maps for fast access
    const equipMap = {};
    equipments.forEach(eq => equipMap[eq.id] = eq);

    const borrowerMap = {};
    borrowers.forEach(b => borrowerMap[b.id] = b);

    const adminMap = {};
    admins.forEach(a => adminMap[a.id] = a);

    // Group items by transactionId
    const itemsByTx = {};
    borrowItems.forEach(item => {
      if (!itemsByTx[item.transactionId]) itemsByTx[item.transactionId] = [];
      const eq = equipMap[item.equipmentId];
      if (eq) {
        itemsByTx[item.transactionId].push({
          id: item.id,
          equipment: {
            name: eq.name,
            serialNumber: eq.serialNumber
          },
          equipmentName: eq.name,
          serialNumber: eq.serialNumber,
          imageUrl: eq.imageUrl,
          dueDate: '', // Filled later from tx
          returnedAt: item.returnedAt
        });
      }
    });

    // Populate transactions
    return transactions.map(tx => {
      const borrower = borrowerMap[tx.borrowerId] || {};
      const admin = adminMap[tx.adminId] || {};
      const items = itemsByTx[tx.id] || [];
      
      items.forEach(i => i.dueDate = tx.dueDate);

      return {
        ...tx,
        studentId: borrower.studentId || '',
        borrowerName: borrower.name || 'Unknown',
        borrowerEmail: borrower.email || '',
        yearLevel: borrower.yearLevel || '',
        department: borrower.department || '',
        faculty: borrower.faculty || '',
        phoneNumber: borrower.phoneNumber || '',
        items: items,
        admin: { 
          email: admin.email || 'System',
          name: admin.name || ''
        }
      };
    });
  },

  getStats() {
    const allEq = Database.getAll('Equipments');
    const available = allEq.filter(eq => eq.status === 'AVAILABLE').length;
    const reserved = allEq.filter(eq => eq.status === 'RESERVED').length;
    const borrowed = allEq.filter(eq => eq.status === 'BORROWED').length;

    const populated = this.getAllPopulated();
    const activeBorrows = populated.filter(tx => !tx.returnedDate).length;
    
    // Check overdue items
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    populated.forEach(tx => {
      if (!tx.returnedDate) {
        const due = new Date(tx.dueDate);
        if (due < today) {
          // Count unreturned items in this overdue transaction
          const unreturnedItems = tx.items.filter(i => !i.returnedAt);
          overdueCount += unreturnedItems.length;
        }
      }
    });

    return {
      pendingReservations: 0, // Not implemented yet
      activeBorrows: activeBorrows,
      totalEquipment: allEq.length,
      overdueItems: overdueCount,
      availableEquipment: available,
      reservedEquipment: reserved,
      borrowedEquipment: borrowed
    };
  },

  create(data) {
    if (!data.equipmentIds || data.equipmentIds.length === 0) {
      throw new Error('Equipments are required');
    }

    let borrowerId = data.borrowerId;
    let borrower = null;

    // If borrowerId is not provided, find or create the borrower
    if (!borrowerId) {
      if (!data.borrowerName || !data.borrowerEmail) {
        throw new Error('Borrower Name and Email are required if borrowerId is not provided');
      }

      // Try to find existing borrower by email or student ID
      const allBorrowers = Database.getAll('Borrowers');
      borrower = allBorrowers.find(b => 
        (data.borrowerEmail && b.email === data.borrowerEmail) || 
        (data.studentId && b.studentId === data.studentId)
      );

      if (!borrower) {
        // Create new borrower
        borrower = Database.insert('Borrowers', {
          studentId: data.studentId || '',
          name: data.borrowerName,
          email: data.borrowerEmail,
          yearLevel: data.yearLevel || '',
          department: data.department || '',
          faculty: data.faculty || '',
          phoneNumber: data.phoneNumber || ''
        });
      }
      
      borrowerId = borrower.id;
    } else {
      const allBorrowers = Database.getAll('Borrowers');
      borrower = allBorrowers.find(b => b.id === borrowerId);
    }

    // Block borrowing if suspended
    if (borrowerId && this.isBorrowerBlocked(borrowerId)) {
      throw new Error('ไม่สามารถทำรายการได้ เนื่องจากผู้ยืมถูกระงับสิทธิ์');
    }

    const transaction = {
      borrowerId: borrowerId,
      borrowDate: data.borrowDate || new Date().toISOString(),
      dueDate: data.dueDate,
      adminId: data.adminId, // Should come from logged in admin
      notes: data.notes || '',
    };

    const newTransaction = Database.insert(this.SHEET_NAME, transaction);

    const borrowedItemsList = [];
    const allEq = Database.getAll('Equipments');

    // Add items
    data.equipmentIds.forEach(eqId => {
      Database.insert(this.ITEMS_SHEET, {
        transactionId: newTransaction.id,
        equipmentId: eqId,
        returnedAt: ''
      });
      
      // Update equipment status
      Equipment.update(eqId, { status: 'BORROWED' });

      const eq = allEq.find(e => e.id === eqId);
      if (eq) borrowedItemsList.push(eq);
    });

    if (borrower.email) {
      Email.sendBorrowEmail(borrower.email, borrower.name, newTransaction, borrowedItemsList);
    }

    return newTransaction;
  },

  updateNotes(id, data) {
    if (!id) throw new Error('Transaction ID is required');
    
    let updateData = { notes: data.notes || '' };
    
    if (data.conditionImageBase64) {
      updateData.conditionImageUrl = Upload.saveImageToDrive(data.conditionImageBase64, `condition_${id}`);
    } else if (data.conditionImageUrl) {
      updateData.conditionImageUrl = data.conditionImageUrl;
    }
    
    return Database.update(this.SHEET_NAME, id, updateData);
  },

  returnItems(data) {
    if (!data.serialNumbers || data.serialNumbers.length === 0) {
      throw new Error('Serial numbers are required to return items');
    }

    const now = new Date().toISOString();
    const allEquipments = Database.getAll('Equipments');
    const affectedTransactionIds = new Set();
    const returnCountByTx = {};
    
    // Process each serial number
    data.serialNumbers.forEach(serial => {
      // Find equipment by serial number
      const eq = allEquipments.find(e => e.serialNumber === serial);
      if (!eq) return; // Skip if not found

      // Find the unreturned borrow item for this equipment
      // Since Database.update changes the DB, we fetch fresh items each time
      const freshItems = Database.getAll(this.ITEMS_SHEET);
      const targetItem = freshItems.find(i => i.equipmentId === eq.id && !i.returnedAt);
      
      if (targetItem) {
        Database.update(this.ITEMS_SHEET, targetItem.id, { returnedAt: now });
        affectedTransactionIds.add(targetItem.transactionId);
        returnCountByTx[targetItem.transactionId] = (returnCountByTx[targetItem.transactionId] || 0) + 1;
      }
      
      // Update equipment status back to AVAILABLE
      Equipment.update(eq.id, { status: 'AVAILABLE' });
    });
    
    // Check if any affected transactions are now completely returned
    affectedTransactionIds.forEach(txId => {
      const allItemsForTx = Database.find(this.ITEMS_SHEET, 'transactionId', txId);
      const unreturnedItems = allItemsForTx.filter(i => !i.returnedAt);
      
      if (unreturnedItems.length === 0) {
        // All items returned, mark transaction as complete
        Database.update(this.SHEET_NAME, txId, { 
          returnedDate: now,
          returnAdminName: data.returnAdminName || '' 
        });

        // Auto-unsuspend if the user was suspended for OVERDUE and has no other overdue transactions
        const tx = Database.getById(this.SHEET_NAME, txId);
        if (tx && tx.borrowerId) {
            const borrower = Database.getById('Borrowers', tx.borrowerId);
            if (borrower && (borrower.isSuspended === true || borrower.isSuspended === 'TRUE' || borrower.isSuspended === 'true') && borrower.suspensionType === 'OVERDUE') {
                const allBorrows = this.getAllPopulated();
                const todayObj = new Date();
                todayObj.setHours(0, 0, 0, 0);
                const activeOverdue = allBorrows.filter(t => 
                    t.borrowerId === tx.borrowerId && 
                    !t.returnedDate && 
                    new Date(t.dueDate) < todayObj &&
                    t.id !== txId
                );
                if (activeOverdue.length === 0) {
                    Database.update('Borrowers', tx.borrowerId, {
                        isSuspended: false,
                        suspensionType: '',
                        suspensionReason: '',
                        suspendedUntil: ''
                    });
                    Email.sendUnsuspend(borrower.email, borrower.name, false);
                }
            }
        }

      } else {
        Database.update(this.SHEET_NAME, txId, { 
          returnAdminName: data.returnAdminName || '' 
        });
      }

      // Send Return Email
      const tx = Database.getById(this.SHEET_NAME, txId);
      const borrower = Database.getById('Borrowers', tx.borrowerId);
      
      if (borrower && borrower.email) {
        const returnedInThisRequest = returnCountByTx[txId] || 0;
        
        // Calculate fine
        const fineAmount = this.calculateFine(tx.dueDate, now);
        
        Email.sendReturnEmail(borrower.email, borrower.name, returnedInThisRequest, unreturnedItems.length, now, fineAmount);
      }
    });
    
    return { success: true };
  },

  delete(id) {
    if (!id) throw new Error('Transaction ID is required');

    // Find all items associated with this transaction
    const items = Database.find(this.ITEMS_SHEET, 'transactionId', id);

    // Revert equipment status to AVAILABLE if not returned
    items.forEach(item => {
      if (!item.returnedAt) {
        Equipment.update(item.equipmentId, { status: 'AVAILABLE' });
      }
      // Delete the item record
      Database.deleteRow(this.ITEMS_SHEET, item.id);
    });

    // Delete the transaction record
    Database.deleteRow(this.SHEET_NAME, id);
    return { success: true };
  },

  bulkDelete(data) {
    if (!data.ids || !Array.isArray(data.ids)) throw new Error('IDs array is required');
    data.ids.forEach(id => this.delete(id));
    return { success: true, count: data.ids.length };
  }
};
