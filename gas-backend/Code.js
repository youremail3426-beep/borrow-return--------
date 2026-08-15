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
      result = Reservation.confirmPickup(id);
    }
    else if (path === '/reservations/delete' && method === 'POST') {
      result = Reservation.bulkDelete(body.ids);
    }
    else if (path.match(/^\/reservations\/(.+)$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      result = Reservation.delete(id);
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
