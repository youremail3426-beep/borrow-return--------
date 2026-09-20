const Announcement = {
  getAll() {
    const data = Database.getAll('Announcements');
    // Convert string 'true'/'false' to boolean if needed, though they usually come as they were set
    return data.map(item => ({
      ...item,
      isActive: item.isActive === true || item.isActive === 'TRUE' || item.isActive === 'true'
    }));
  },

  create(data) {
    if (!data.title || !data.content) {
      throw new Error('Title and content are required');
    }

    const newAnnouncement = {
      title: data.title,
      content: data.content,
      isActive: data.isActive !== undefined ? data.isActive : true
    };

    return Database.insert('Announcements', newAnnouncement);
  },

  delete(id) {
    const success = Database.deleteRow('Announcements', id);
    if (!success) {
      throw new Error('Announcement not found');
    }
    return { message: 'Announcement deleted successfully' };
  }
};
