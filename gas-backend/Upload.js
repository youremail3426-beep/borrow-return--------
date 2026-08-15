/**
 * Upload Helper for Google Drive
 */
const Upload = {
  /**
   * Save a base64 image string to Google Drive
   * @param {string} base64String e.g. "data:image/png;base64,iVBORw0KGgo..."
   * @param {string} filename The name of the file to save
   * @returns {string} The public URL of the uploaded image
   */
  saveImageToDrive(base64String, filename) {
    if (!base64String) return '';
    
    try {
      const dataParts = base64String.split(',');
      let mimeType = 'image/png';
      let b64 = base64String;
      
      if (dataParts.length > 1) {
        mimeType = dataParts[0].split(':')[1].split(';')[0];
        b64 = dataParts[1];
      }
      
      const blob = Utilities.newBlob(Utilities.base64Decode(b64), mimeType, filename);
      
      const folderName = "BorrowReturn_Images";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return "https://drive.google.com/uc?export=view&id=" + file.getId();
    } catch (e) {
      console.error("Failed to upload image", e);
      throw new Error("Failed to upload image to Google Drive: " + e.message);
    }
  }
};
