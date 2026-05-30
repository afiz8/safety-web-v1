// src/services/api.js
const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Fungsi helper untuk GET
export const fetchFromBackend = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error('Gagal mengambil data');
    return await response.json();
  } catch (error) {
    console.error('Error fetchFromBackend:', error);
    return null;
  }
};

// Cek koneksi ke backend (PERBAIKI INI)
export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      return data.status === 'OK';
    }
    return false;
  } catch (error) {
    console.error('Backend connection error:', error);
    return false;
  }
};

// ==================== CRUD UNTUK ITEM ====================

// GET semua item
export const getItems = async () => {
  return await fetchFromBackend('/api/items');
};

// GET item by ID
export const getItemById = async (id) => {
  return await fetchFromBackend(`/api/items/${id}`);
};

// POST tambah item
export const createItem = async (itemData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    if (!response.ok) throw new Error('Gagal menambah item');
    return await response.json();
  } catch (error) {
    console.error('Error createItem:', error);
    return null;
  }
};

// PUT update item
export const updateItem = async (id, itemData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    if (!response.ok) throw new Error('Gagal update item');
    return await response.json();
  } catch (error) {
    console.error('Error updateItem:', error);
    return null;
  }
};

// DELETE hapus item
export const deleteItem = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Gagal hapus item');
    return await response.json();
  } catch (error) {
    console.error('Error deleteItem:', error);
    return null;
  }
};