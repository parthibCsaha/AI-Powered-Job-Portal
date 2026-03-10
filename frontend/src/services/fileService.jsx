import api from './api';

const fileService = {
  /**
   * Upload a file (resume, profile image, etc.)
   * @param {File} file - The file to upload
   * @param {string} type - Type of file: 'resume', 'image', 'profile', 'document'
   * @returns {Promise} - Response with fileUrl, fileName, fileType
   */
  uploadFile: async (file, type = 'resume') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload resume and extract text for AI analysis
   * @param {File} file - Resume file (PDF, DOC, DOCX, TXT)
   * @returns {Promise} - Response with fileUrl, fileName, fileType, extractedText
   */
  uploadResumeWithExtraction: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload resume file (simple upload without extraction)
   * @param {File} file - Resume file (PDF, DOC, DOCX, TXT)
   */
  uploadResume: async (file) => {
    return fileService.uploadFile(file, 'resume');
  },

  /**
   * Upload profile image
   * @param {File} file - Image file (JPG, PNG, GIF, WEBP)
   */
  uploadProfileImage: async (file) => {
    return fileService.uploadFile(file, 'profile');
  },

  /**
   * Get file download URL
   * @param {string} type - File type
   * @param {string} filename - File name
   */
  getFileUrl: (type, filename) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    return `${baseUrl}/files/download/${type}/${filename}`;
  },

  /**
   * Delete a file
   * @param {string} type - File type
   * @param {string} filename - File name
   */
  deleteFile: async (type, filename) => {
    const response = await api.delete(`/files/delete/${type}/${filename}`);
    return response.data;
  },

  /**
   * Extract filename from file URL
   * @param {string} url - Full file URL
   */
  extractFilename: (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 1];
  },

  /**
   * Extract file type from file URL
   * @param {string} url - Full file URL
   */
  extractFileType: (url) => {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 2];
  }
};

export default fileService;

