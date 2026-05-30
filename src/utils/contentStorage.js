// Utility untuk menyimpan dan mengambil konten halaman ILO dari localStorage

const PREFIX = 'jsms_content_';

export const getPageContent = (pageId, defaultContent) => {
  try {
    const stored = localStorage.getItem(`${PREFIX}${pageId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading content:', e);
  }
  // Jika belum ada, simpan default dan return
  if (defaultContent) {
    localStorage.setItem(`${PREFIX}${pageId}`, JSON.stringify(defaultContent));
  }
  return defaultContent;
};

export const savePageContent = (pageId, content) => {
  try {
    localStorage.setItem(`${PREFIX}${pageId}`, JSON.stringify(content));
    return true;
  } catch (e) {
    console.error('Error saving content:', e);
    return false;
  }
};

export const resetPageContent = (pageId) => {
  localStorage.removeItem(`${PREFIX}${pageId}`);
};

export const exportAllContent = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {}
    }
  }
  return data;
};

export const importAllContent = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith(PREFIX)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
};

