// SPREADSHEET_ID is required to connect to the database sheet.
const SPREADSHEET_ID = '1UEnjjR1QatQww8v0kgxLs4GhnUI7pX8z4H3R1uW7o1A'; // TODO: Replace with actual Google Sheet ID

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const path = e.parameter.path || '';
    let result = {};

    // Basic Routing Example
    if (path.startsWith('/equipments')) {
      if (e.parameter.id) {
        result = Equipment.getById(e.parameter.id);
      } else if (e.parameter.ids) {
        result = Equipment.getByIds(e.parameter.ids);
      } else {
        result = Equipment.getAll();
      }
    } 
    else if (path === '/borrow') {
      result = Borrow.getAllPopulated();
    }
    else if (path === '/reservations') {
      result = Reservation.getAllPopulated();
    }
    else if (path === '/borrow/active') {
      const all = Borrow.getAllPopulated();
      result = all.filter(tx => !tx.returnedDate);
    }
    else if (path === '/borrow/stats') {
      result = Borrow.getStats();
    }
    else if (path.match(/^\/borrow\/([^\/]+)$/)) {
      const id = path.split('/')[2];
      const all = Borrow.getAllPopulated();
      result = all.find(tx => tx.id === id);
      if (!result) throw new Error('Transaction not found');
    }
    else if (path === '/borrowers') {
      result = Borrower.getAll();
    }
    else if (path.startsWith('/reservations/borrower/search')) {
      try {
        result = Borrower.search({
          email: e.parameter.email,
          name: e.parameter.name,
          studentId: e.parameter.studentId
        });
      } catch (err) {
        return jsonResponse({ error: err.message }, 404);
      }
    }
    else {
      return jsonResponse({ error: 'Route not found' }, 404);
    }
    
    return jsonResponse({ success: true, data: result });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Handle POST requests (includes POST, PUT, DELETE from frontend interceptor)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    
    // Extracted from our Axios Interceptor
    const method = postData.method || 'POST';
    const path = postData.path || e.parameter.path || '';
    const body = postData.body || {};
    const token = postData.token || e.parameter.token || '';
    
    let currentAdminId = '';
    if (token) {
      try {
        const decodedBytes = Utilities.base64Decode(token);
        const decodedStr = Utilities.newBlob(decodedBytes).getDataAsString();
        currentAdminId = decodedStr.split(':')[0];
        
        // Inject into body for endpoints that need it
        if (!body.adminId) {
          body.adminId = currentAdminId;
        }
      } catch(err) {
        // ignore invalid token
      }
    }
    
    let result = {};

    if (path === '/auth/login' && method === 'POST') {
      result = Auth.login(body.email, body.password);
    } 
    else if (path === '/equipments' && method === 'POST') {
      result = Equipment.create(body);
    }
    else if (path.match(/^\/equipments\/(.+)/) && method === 'PUT') {
      const id = path.split('/')[2];
      result = Equipment.update(id, body);
    }
    else if (path.match(/^\/equipments\/(.+)/) && method === 'DELETE') {
      const id = path.split('/')[2];
      result = Equipment.delete(id);
    }
    else if (path === '/borrow/borrow' && method === 'POST') {
      result = Borrow.create(body);
    }
    else if (path.match(/^\/borrow\/(.+)\/notes/) && method === 'PUT') {
      const id = path.split('/')[2];
      result = Borrow.updateNotes(id, body);
    }
    else if (path === '/borrow/return' && method === 'POST') {
      result = Borrow.returnItems(body);
    }
    else if (path === '/borrow/delete' && method === 'POST') {
      result = Borrow.bulkDelete(body);
    }
    else if (path.match(/^\/borrow\/(.+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      result = Borrow.delete(id);
    }
    else if (path === '/reservations' && method === 'POST') {
      result = Reservation.create(body);
    }
    else if (path.match(/^\/reservations\/(.+)\/status/) && method === 'PUT') {
      const id = path.split('/')[2];
      result = Reservation.updateStatus(id, body.status);
    }
    else if (path.match(/^\/reservations\/(.+)\/pickup/) && method === 'POST') {
      const id = path.split('/')[2];
      result = Reservation.confirmPickup(id, body.adminId);
    }
    else if (path === '/reservations/delete' && method === 'POST') {
      result = Reservation.bulkDelete(body.ids);
    }
    else if (path.match(/^\/reservations\/(.+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      result = Reservation.delete(id);
    }
    else if (path.match(/^\/borrowers\/(.+)\/suspend$/) && method === 'POST') {
      const id = path.split('/')[2];
      result = Borrower.suspend(id, body.reason, body.suspendedUntil);
    }
    else if (path.match(/^\/borrowers\/(.+)\/unsuspend$/) && method === 'POST') {
      const id = path.split('/')[2];
      result = Borrower.unsuspend(id);
    }
    else {
      return jsonResponse({ error: 'Route not found' }, 404);
    }

    return jsonResponse({ success: true, data: result });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Helper to return JSON response
 */
function jsonResponse(data, statusCode = 200) {
  // We can't strictly set HTTP status codes in GAS, but we can wrap it in the payload.
  const payload = {
    statusCode: statusCode,
    ...data
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this function ONCE from the Apps Script editor to set up the daily automated checks.
 */
function setupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkDueDates') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Set to run every day between 1 AM and 2 AM
  ScriptApp.newTrigger('checkDueDates')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();
    
  // Run once immediately to apply right now
  checkDueDates();
}

/**
 * Calculate working days (excluding weekends) between two dates
 */
function calculateOverdueWorkingDays(startDate, endDate) {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  curDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate.getTime());
  end.setHours(0, 0, 0, 0);

  // เริ่มนับวันถัดจากวันครบกำหนด
  curDate.setDate(curDate.getDate() + 1);

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    // 0 = Sunday, 6 = Saturday (ไม่นับเสาร์-อาทิตย์)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

/**
 * Cron function to check for due dates (Triggered once a day by GAS trigger)
 */
function checkDueDates() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // 1. Clear expired suspensions
  const borrowers = Database.getAll('Borrowers');
  const expiredSuspensions = borrowers.filter(b => {
    if (!b.isSuspended || !b.suspendedUntil) return false;
    let untilDate = b.suspendedUntil.length === 10 ? new Date(b.suspendedUntil + 'T00:00:00+07:00') : new Date(b.suspendedUntil);
    return untilDate < now;
  });

  for (const b of expiredSuspensions) {
    Database.update('Borrowers', b.id, {
      isSuspended: false,
      suspendedUntil: '',
      suspensionType: '',
      suspensionReason: ''
    });
    Email.sendUnsuspend(b.email, b.name, false);
  }

  // 2. Check Missed Pickups (APPROVED)
  const reservations = Database.getAll('Reservations');
  const missedPickups = reservations.filter(r => 
    r.status === 'APPROVED' && new Date(r.borrowDate).toISOString() < todayStart
  );

  for (const r of missedPickups) {
    Database.update('Reservations', r.id, { status: 'REJECTED' });
    const items = Database.find('ReservationItems', 'reservationId', r.id);
    for (const item of items) {
      Database.update('Equipments', item.equipmentId, { status: 'AVAILABLE' });
    }

    const suspendDate = new Date(now);
    suspendDate.setDate(suspendDate.getDate() + 3);
    
    Database.update('Borrowers', r.borrowerId, {
      isSuspended: true,
      suspensionType: 'MISSED_PICKUP',
      suspendedUntil: suspendDate.toISOString(),
      suspensionReason: 'ไม่มารับอุปกรณ์ตามกำหนดจอง'
    });

    const b = Database.getById('Borrowers', r.borrowerId);
    if (b) {
      Email.sendSuspensionMissedPickup(b.email, b.name, suspendDate.toLocaleDateString('th-TH'));
    }
  }

  // 2.5 Expired PENDING reservations (Reject and free items, NO suspension because admin didn't approve)
  const expiredPending = reservations.filter(r => 
    r.status === 'PENDING' && new Date(r.borrowDate).toISOString() < todayStart
  );
  
  for (const r of expiredPending) {
    Database.update('Reservations', r.id, { status: 'REJECTED' });
    const items = Database.find('ReservationItems', 'reservationId', r.id);
    for (const item of items) {
      Database.update('Equipments', item.equipmentId, { status: 'AVAILABLE' });
    }
  }

  // 3. Check Overdue
  const borrows = Database.getAll('BorrowTransactions');
  const overdueTransactions = borrows.filter(tx => 
    !tx.returnedDate && new Date(tx.dueDate).toISOString() < todayStart
  );

  for (const tx of overdueTransactions) {
    const b = Database.getById('Borrowers', tx.borrowerId);
    if (b) {
      const txItems = Database.find('BorrowItems', 'transactionId', tx.id);
      const equipmentNames = [];
      let unreturnedCount = 0;
      for (const tItem of txItems) {
        if (!tItem.returnedAt) {
          unreturnedCount++;
          const eq = Database.getById('Equipments', tItem.equipmentId);
          if (eq) equipmentNames.push(eq.name);
        }
      }

      if (unreturnedCount > 0) {
        // คำนวณค่าปรับ 20 บาท ต่อวันทำการ ต่อชิ้น
        const dueDate = new Date(tx.dueDate);
        const daysOverdue = calculateOverdueWorkingDays(dueDate, now);
        const fineAmount = unreturnedCount * daysOverdue * 20;

        // ส่งอีเมลเตือนยอดค่าปรับ
        Email.sendOverdueWarning(b.email, b.name, equipmentNames, dueDate.toLocaleDateString('th-TH'), fineAmount);

        // ระงับสิทธิ์ถ้ายังไม่ได้โดนระงับด้วยสาเหตุค้างส่ง
        if (!b.isSuspended || b.suspensionType !== 'OVERDUE') {
          Database.update('Borrowers', tx.borrowerId, {
            isSuspended: true,
            suspensionType: 'OVERDUE',
            suspendedUntil: '',
            suspensionReason: 'มียอดค้างส่งคืนอุปกรณ์'
          });
          Email.sendSuspensionOverdue(b.email, b.name, equipmentNames);
        }
      }
    }
  }
}
