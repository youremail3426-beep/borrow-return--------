/**
 * Auth Controller for GAS
 * NOTE: Google Apps Script doesn't support bcrypt natively.
 * For a real app, you'd use a custom hash function or integrate with Google Auth.
 * This is a simplified version using plain text for demonstration, 
 * OR you can implement a simple SHA-256 hash in GAS.
 */
const Auth = {
  SHEET_NAME: 'Admins',

  login(email, password) {
    if (!email || !password) throw new Error('Email and password required');
    
    const admins = Database.find(this.SHEET_NAME, 'email', email);
    if (admins.length === 0) {
      throw new Error('Invalid credentials');
    }

    const admin = admins[0];
    // In production, compare hashed passwords!
    if (admin.password !== password) {
      throw new Error('Invalid credentials');
    }

    // Generate a simple token (in a real app, use a JWT library ported for GAS)
    const token = Utilities.base64Encode(admin.id + ':' + new Date().getTime());
    
    // Don't return the password
    delete admin.password;
    
    return {
      admin,
      token
    };
  }
};
