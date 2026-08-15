/**
 * Reservation Controller
 */
const Reservation = {
  SHEET_NAME: 'Reservations',
  ITEMS_SHEET: 'ReservationItems',

  getAllPopulated() {
    const reservations = Database.getAll(this.SHEET_NAME);
    const reservationItems = Database.getAll(this.ITEMS_SHEET);
    const equipments = Database.getAll('Equipments');
    const borrowers = Database.getAll('Borrowers');

    const equipMap = {};
    equipments.forEach(eq => equipMap[eq.id] = eq);

    const borrowerMap = {};
    borrowers.forEach(b => borrowerMap[b.id] = b);

    const itemsByRes = {};
    reservationItems.forEach(item => {
      if (!itemsByRes[item.reservationId]) itemsByRes[item.reservationId] = [];
      const eq = equipMap[item.equipmentId];
      if (eq) {
        itemsByRes[item.reservationId].push({
          id: item.id,
          equipment: {
            name: eq.name,
            serialNumber: eq.serialNumber
          }
        });
      }
    });

    return reservations.map(res => {
      const borrower = borrowerMap[res.borrowerId] || {};
      return {
        id: res.id,
        borrowerName: borrower.name || 'Unknown',
        borrowerEmail: borrower.email || '',
        yearLevel: borrower.yearLevel || '',
        department: borrower.department || '',
        faculty: borrower.faculty || '',
        phoneNumber: borrower.phoneNumber || '',
        borrowDate: res.borrowDate,
        returnDate: res.returnDate,
        status: res.status || 'PENDING',
        items: itemsByRes[res.id] || []
      };
    });
  },

  create(data) {
    if (!data.equipmentIds || data.equipmentIds.length === 0) {
      throw new Error('Equipments are required');
    }

    // Find or create borrower
    if (!data.borrowerName || !data.borrowerEmail) {
      throw new Error('Borrower Name and Email are required');
    }

    const allBorrowers = Database.getAll('Borrowers');
    let borrower = allBorrowers.find(b => 
      (data.borrowerEmail && b.email === data.borrowerEmail) || 
      (data.studentId && b.studentId === data.studentId)
    );

    if (!borrower) {
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
    
    // Block reservation if overdue > 3 days
    if (borrower && borrower.id && Borrow.isBorrowerBlocked(borrower.id)) {
      throw new Error('ไม่สามารถจองอุปกรณ์ได้ เนื่องจากคุณมีอุปกรณ์ค้างส่งเกินกำหนด 3 วัน กรุณาคืนอุปกรณ์ก่อน');
    }

    const reservation = {
      borrowerId: borrower.id,
      borrowDate: data.borrowDate,
      returnDate: data.returnDate,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const newRes = Database.insert(this.SHEET_NAME, reservation);

    // Reserve equipments
    const reservedItemsList = [];
    const allEq = Database.getAll('Equipments');

    data.equipmentIds.forEach(eqId => {
      Database.insert(this.ITEMS_SHEET, {
        reservationId: newRes.id,
        equipmentId: eqId
      });
      // Optionally update equipment status to RESERVED
      Equipment.update(eqId, { status: 'RESERVED' });

      const eq = allEq.find(e => e.id === eqId);
      if (eq) reservedItemsList.push({ equipment: eq });
    });

    if (borrower.email) {
      Email.sendReservationRequestToUser(borrower.email, borrower.name, newRes, reservedItemsList);
    }

    try {
      const adminEmail = Session.getEffectiveUser().getEmail();
      if (adminEmail) {
        Email.sendReservationRequestToAdmin(adminEmail, borrower.name, newRes, reservedItemsList);
      }
    } catch (e) {
      console.error("Could not get admin email", e);
    }

    return newRes;
  },

  updateStatus(id, status) {
    if (!id) throw new Error('ID is required');
    
    const reservation = Database.getById(this.SHEET_NAME, id);
    if (!reservation) throw new Error('Reservation not found');

    const items = Database.find(this.ITEMS_SHEET, 'reservationId', id);

    // If rejected, free up the equipment
    if (status === 'REJECTED') {
      items.forEach(item => {
        Equipment.update(item.equipmentId, { status: 'AVAILABLE' });
      });
    }

    const updatedRes = Database.update(this.SHEET_NAME, id, { status });

    // Send Emails
    try {
      const borrower = Database.getById('Borrowers', reservation.borrowerId);
      if (borrower && borrower.email) {
        if (status === 'APPROVED') {
          // We need populated items for the email
          const allEq = Database.getAll('Equipments');
          const populatedItems = items.map(i => ({ equipment: allEq.find(e => e.id === i.equipmentId) }));
          Email.sendReservationApprovedToUser(borrower.email, borrower.name, updatedRes, populatedItems);
        } else if (status === 'REJECTED') {
          Email.sendReservationRejectedToUser(borrower.email, borrower.name, updatedRes);
        }
      }
    } catch (e) {
      console.error("Failed to send status update email", e);
    }

    return updatedRes;
  },

  confirmPickup(id, adminId) {
    if (!id) throw new Error('ID is required');
    
    const reservation = Database.getById(this.SHEET_NAME, id);
    if (!reservation) throw new Error('Reservation not found');
    
    const items = Database.find(this.ITEMS_SHEET, 'reservationId', id);
    
    // Create actual borrow transaction
    const transaction = {
      borrowerId: reservation.borrowerId,
      borrowDate: new Date().toISOString(),
      dueDate: reservation.returnDate,
      adminId: adminId || 'system',
      notes: 'From Reservation',
    };

    const newTransaction = Database.insert('BorrowTransactions', transaction);

    items.forEach(item => {
      Database.insert('BorrowItems', {
        transactionId: newTransaction.id,
        equipmentId: item.equipmentId,
        returnedAt: ''
      });
      Equipment.update(item.equipmentId, { status: 'BORROWED' });
    });

    // Mark reservation as completed
    Database.update(this.SHEET_NAME, id, { status: 'COMPLETED' });

    return { success: true };
  },

  delete(id) {
    if (!id) throw new Error('ID is required');

    const reservation = Database.getById(this.SHEET_NAME, id);
    
    const items = Database.find(this.ITEMS_SHEET, 'reservationId', id);

    // If pending or approved, free up equipment
    if (reservation && (reservation.status === 'PENDING' || reservation.status === 'APPROVED')) {
      items.forEach(item => {
        Equipment.update(item.equipmentId, { status: 'AVAILABLE' });
      });
    }

    items.forEach(item => {
      Database.deleteRow(this.ITEMS_SHEET, item.id);
    });

    Database.deleteRow(this.SHEET_NAME, id);
    return { success: true };
  },

  bulkDelete(ids) {
    if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');
    ids.forEach(id => this.delete(id));
    return { success: true, count: ids.length };
  }
};
