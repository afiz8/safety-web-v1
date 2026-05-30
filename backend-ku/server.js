// ==================== SERVER.JS - JSMS HSSE BACKEND ====================
// Versi lengkap dengan semua endpoint yang sudah ada
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE = `http://localhost:${PORT}`;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================== KONEKSI MONGODB ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jsms_hsse';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB Terhubung!');
}).catch(err => {
  console.error('❌ Gagal koneksi MongoDB:', err.message);
});

// TEST ROUTE
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server berjalan di port ' + PORT });
});

// ==================== HELPER FUNCTIONS ====================
const hazardKeywords = {
  'Fire': ['kebakaran', 'api', 'terbakar', 'smoke', 'asap', 'ledakan'],
  'Explosion': ['meledak', 'ledakan', 'blast', 'explosion'],
  'Fall': ['jatuh', 'terjatuh', 'slip', 'terpeleset', 'height', 'ketinggian'],
  'Chemical': ['kimia', 'racun', 'toksik', 'chemical', 'hazardous', 'b3'],
  'Electrical': ['listrik', 'short circuit', 'konsleting', 'shock', 'tersengat'],
  'Machinery': ['mesin', 'alat berat', 'forklift', 'crane', 'conveyor'],
  'Collision': ['tabrakan', 'collision', 'benturan', 'tertindih'],
  'Health': ['kesehatan', 'sakit', 'medis', 'first aid', 'p3k']
};

const analyzeHazards = (text) => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const detected = [];
  for (const [hazard, keywords] of Object.entries(hazardKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detected.push(hazard);
    }
  }
  return [...new Set(detected)];
};

const determineSeverity = (text) => {
  const lowerText = text?.toLowerCase() || '';
  if (lowerText.includes('kritis') || lowerText.includes('critical') || 
      lowerText.includes('fatal') || lowerText.includes('kematian')) {
    return 'Critical';
  }
  if (lowerText.includes('tinggi') || lowerText.includes('high') ||
      lowerText.includes('kebakaran') || lowerText.includes('api') ||
      lowerText.includes('ledakan') || lowerText.includes('chemical')) {
    return 'High';
  }
  if (lowerText.includes('sedang') || lowerText.includes('medium') ||
      lowerText.includes('listrik') || lowerText.includes('mesin')) {
    return 'Medium';
  }
  return 'Low';
};

// ==================== KONFIGURASI UPLOAD ====================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const videoUpload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTE UTAMA ====================
app.get('/', (req, res) => {
  res.send('Backend JSMS HSSE berjalan!');
});

// ==================== ENDPOINT ITEM ====================
const Item = require('./models/Item');
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post('/api/items', async (req, res) => {
  const newItem = new Item({ name: req.body.name, category: req.body.category });
  try {
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.put('/api/items/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, { name: req.body.name, category: req.body.category }, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ENDPOINT SITE CONTENT ====================
const SiteContent = require('./models/SiteContent');
app.get('/api/site-content/:pageId/:sectionId', async (req, res) => {
  try {
    const { pageId, sectionId } = req.params;
    let content = await SiteContent.findOne({ pageId, sectionId });
    if (!content) return res.json({ data: null });
    res.json({ data: content.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/site-content', async (req, res) => {
  try {
    const { pageId, sectionId, data, updatedBy } = req.body;
    const result = await SiteContent.findOneAndUpdate(
      { pageId, sectionId },
      { data, updatedBy, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/site-content/:pageId/:sectionId', async (req, res) => {
  try {
    await SiteContent.findOneAndDelete({ pageId: req.params.pageId, sectionId: req.params.sectionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT ATTENDANCE ====================
const Attendance = require('./models/Attendance');
app.get('/api/attendance', async (req, res) => {
  try {
    const { userId, date } = req.query;
    let filter = {};
    if (userId) filter.userId = userId;
    if (date) filter.date = date;
    const data = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/attendance/checkin', async (req, res) => {
  try {
    const { userId, userName, date, checkIn, status, note, method, location } = req.body;
    const existing = await Attendance.findOne({ userId, date });
    if (existing) return res.status(400).json({ error: 'Anda sudah check-in hari ini' });
    const newRecord = new Attendance({ userId, userName, date, checkIn, status, note, method, location });
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/attendance/checkout/:id', async (req, res) => {
  try {
    const { checkOut } = req.body;
    const updated = await Attendance.findByIdAndUpdate(req.params.id, { checkOut }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/attendance/:id', async (req, res) => {
  try {
    const { checkIn, checkOut, status, note } = req.body;
    const updated = await Attendance.findByIdAndUpdate(req.params.id, { checkIn, checkOut, status, note }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT USER ====================
const User = require('./models/User');
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const saved = await newUser.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/users/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT ASSESSMENT (FIT TO WORK) ====================
const Assessment = require('./models/Assessment');
app.get('/api/assessments', async (req, res) => {
  try {
    const data = await Assessment.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/assessments', async (req, res) => {
  try {
    const newAss = new Assessment(req.body);
    const saved = await newAss.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/assessments/:id', async (req, res) => {
  try {
    const updated = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/assessments/:id', async (req, res) => {
  try {
    await Assessment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT KONTRAKTOR ====================
const Kontraktor = require('./models/Kontraktor');
app.get('/api/kontraktor', async (req, res) => {
  try {
    const data = await Kontraktor.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/kontraktor', async (req, res) => {
  try {
    const newItem = new Kontraktor(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/kontraktor/:id', async (req, res) => {
  try {
    const updated = await Kontraktor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/kontraktor/:id', async (req, res) => {
  try {
    await Kontraktor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT APD ====================
const APD = require('./models/APD');
app.get('/api/apd', async (req, res) => {
  try {
    const data = await APD.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/apd', async (req, res) => {
  try {
    const newItem = new APD(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/apd/:id', async (req, res) => {
  try {
    const updated = await APD.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/apd/:id', async (req, res) => {
  try {
    await APD.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT ALAT PELINDUNG DIRI ====================
const AlatPelindungDiri = require('./models/AlatPelindungDiri');
app.get('/api/alat-pelindung-diri', async (req, res) => {
  try {
    const data = await AlatPelindungDiri.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/alat-pelindung-diri', async (req, res) => {
  try {
    const newItem = new AlatPelindungDiri(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/alat-pelindung-diri/:id', async (req, res) => {
  try {
    const updated = await AlatPelindungDiri.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/alat-pelindung-diri/:id', async (req, res) => {
  try {
    await AlatPelindungDiri.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT MITRA KERJA ====================
const MitraKerja = require('./models/MitraKerja');
app.get('/api/mitra-kerja', async (req, res) => {
  try {
    const data = await MitraKerja.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/mitra-kerja/:id', async (req, res) => {
  try {
    const data = await MitraKerja.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/mitra-kerja', async (req, res) => {
  try {
    const newItem = new MitraKerja(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/mitra-kerja/:id', async (req, res) => {
  try {
    const updated = await MitraKerja.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/mitra-kerja/:id', async (req, res) => {
  try {
    await MitraKerja.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT NOTIFICATION ====================
const Notification = require('./models/Notification');
app.get('/api/notifications', async (req, res) => {
  try {
    const { userId, role, category, limit = 50 } = req.query;
    let filter = {};
    if (userId) filter.userId = userId;
    if (role) filter.role = role;
    if (category && category !== 'all') filter.category = category;
    const data = await Notification.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/notifications', async (req, res) => {
  try {
    const newNotif = new Notification(req.body);
    const saved = await newNotif.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    await Notification.deleteMany({ userId });
    res.json({ message: 'All deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT UPLOAD FILE ====================
const FileModel = require('./models/File');
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { relatedId, uploadedBy } = req.body;
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const savedFiles = [];
    for (const file of files) {
      const fileDoc = new FileModel({
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        uploadedBy: uploadedBy || 'anonymous',
        relatedId: relatedId || ''
      });
      await fileDoc.save();
      savedFiles.push(fileDoc);
    }
    res.status(201).json({ files: savedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/files', async (req, res) => {
  try {
    const { relatedId } = req.query;
    let filter = {};
    if (relatedId) filter.relatedId = relatedId;
    const files = await FileModel.find(filter).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/files/:id', async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    fs.unlinkSync(file.path);
    await FileModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT INCIDENT (Incidental Treatment) ====================
const Incident = require('./models/Incident');
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/incidents', async (req, res) => {
  try {
    const newIncident = new Incident(req.body);
    const saved = await newIncident.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get('/api/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const updated = await Incident.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/incidents/:id', async (req, res) => {
  try {
    await Incident.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT INCIDENT REPORT ====================
const IncidentReport = require('./models/IncidentReport');
app.get('/api/incident-reports', async (req, res) => {
  try {
    const reports = await IncidentReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/incident-reports', async (req, res) => {
  try {
    const newReport = new IncidentReport(req.body);
    const saved = await newReport.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/incident-reports/:id', async (req, res) => {
  try {
    const updated = await IncidentReport.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/incident-reports/:id', async (req, res) => {
  try {
    await IncidentReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT MENU ====================
const Menu = require('./models/Menu');
app.get('/api/menus', async (req, res) => {
  try {
    const menus = await Menu.find({ isActive: true }).sort({ order: 1 });
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/menus', async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    const saved = await newMenu.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/menus/:id', async (req, res) => {
  try {
    const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/menus/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT VIDEO ====================
const Video = require('./models/Video');
app.post('/api/videos', videoUpload.single('video'), async (req, res) => {
  try {
    const { title, description, uploadedBy } = req.body;
    const file = req.file;
    if (!file || !title) return res.status(400).json({ error: 'Judul dan file video wajib diisi' });
    const newVideo = new Video({
      title,
      description: description || '',
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: uploadedBy || 'anonymous'
    });
    const saved = await newVideo.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    const filePath = path.join(__dirname, video.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT COMMENT ====================
const Comment = require('./models/Comment');
app.get('/api/comments/:videoId', async (req, res) => {
  try {
    const comments = await Comment.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/comments', async (req, res) => {
  try {
    const { videoId, text, user } = req.body;
    if (!videoId || !text) return res.status(400).json({ error: 'videoId dan text wajib diisi' });
    const newComment = new Comment({ videoId, text, user: user || 'Pengguna JSMS' });
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/comments/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT AUDIT LOGS ====================
const AuditLog = require('./models/AuditLog');
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { limit = 100, type, search } = req.query;
    let filter = {};
    if (type && type !== 'all') filter.type = type;
    if (search) filter.$or = [
      { user: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/audit-logs', async (req, res) => {
  try {
    const { user, userId, role, module, type, description } = req.body;
    const newLog = new AuditLog({ user, userId, role, module, type, description });
    const saved = await newLog.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/audit-logs', async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.json({ message: 'All audit logs cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT PRODUCT ====================
const Product = require('./models/Product');
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT CART ====================
const Cart = require('./models/Cart');
app.get('/api/cart/:userId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = { userId: req.params.userId, items: [] };
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const { productId, qty, warna } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, items: [] });
    const existingIndex = cart.items.findIndex(item => item.productId.toString() === productId && item.warna === warna);
    if (existingIndex >= 0) {
      cart.items[existingIndex].qty += qty || 1;
    } else {
      cart.items.push({
        productId,
        namaProduk: product.namaProduk,
        harga: product.harga,
        qty: qty || 1,
        warna: warna || '',
        gambar: product.gambar
      });
    }
    cart.updatedAt = new Date();
    await cart.save();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const { qty, warna } = req.body;
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });
    if (qty !== undefined) cart.items[itemIndex].qty = qty;
    if (warna !== undefined) cart.items[itemIndex].warna = warna;
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/cart/:userId/items/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT DASHBOARD DATA ====================
const DashboardData = require('./models/DashboardData');
app.get('/api/dashboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await DashboardData.find({ type }).sort({ updatedAt: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/dashboard/safety-hours', async (req, res) => {
  try {
    const { month, hours } = req.body;
    if (!month || hours === undefined) return res.status(400).json({ error: 'Month and hours required' });
    const existing = await DashboardData.findOne({ type: 'safetyHours', month });
    if (existing) {
      existing.value = hours;
      existing.updatedAt = new Date();
      await existing.save();
      return res.json(existing);
    }
    const newData = new DashboardData({ type: 'safetyHours', month, value: hours });
    const saved = await newData.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/dashboard/:type', async (req, res) => {
  try {
    await DashboardData.deleteMany({ type: req.params.type });
    res.json({ message: 'All dashboard data cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT JOB ====================
const Job = require('./models/Job');
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    const saved = await newJob.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT CHECKLIST ====================
const Checklist = require('./models/Checklist');
app.get('/api/checklists', async (req, res) => {
  try {
    const checklists = await Checklist.find().sort({ createdAt: -1 });
    res.json(checklists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/checklists', async (req, res) => {
  try {
    const newChecklist = new Checklist(req.body);
    const saved = await newChecklist.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== ENDPOINT OBSERVASI ====================
const Observasi = require('./models/Observasi');
app.get('/api/observasi', async (req, res) => {
  try {
    const data = await Observasi.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/observasi/:id', async (req, res) => {
  try {
    const data = await Observasi.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/observasi', async (req, res) => {
  try {
    const newItem = new Observasi(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/observasi/:id', async (req, res) => {
  try {
    const updated = await Observasi.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/observasi/:id', async (req, res) => {
  try {
    await Observasi.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/observasi/stats', async (req, res) => {
  try {
    const total = await Observasi.countDocuments();
    const positive = await Observasi.countDocuments({ type: 'Positive' });
    const negative = await Observasi.countDocuments({ type: 'Negative' });
    const opportunity = await Observasi.countDocuments({ type: 'Opportunity' });
    const open = await Observasi.countDocuments({ status: 'Open' });
    res.json({ total, positive, negative, opportunity, open });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT IZIN KERJA ====================
const IzinKerja = require('./models/IzinKerja');
app.get('/api/izin-kerja', async (req, res) => {
  try {
    const izin = await IzinKerja.find().sort({ createdAt: -1 });
    res.json(izin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/izin-kerja', async (req, res) => {
  try {
    const newIzin = new IzinKerja(req.body);
    const saved = await newIzin.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== ENDPOINT IZIN ====================
const Izin = require('./models/Izin');
app.get('/api/izin', async (req, res) => {
  try {
    const izinList = await Izin.find().sort({ tanggalPengajuan: -1 });
    res.json(izinList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/izin', async (req, res) => {
  try {
    const newIzin = new Izin(req.body);
    const saved = await newIzin.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/izin/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await Izin.findOneAndUpdate({ id: id }, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Izin tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/izin/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await Izin.findOneAndDelete({ id: id });
    if (!deleted) return res.status(404).json({ error: 'Izin tidak ditemukan' });
    res.json({ message: 'Izin berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT JAM KERJA SELAMAT ====================
const JamKerjaSelamat = require('./models/JamKerjaSelamat');
app.get('/api/jam-kerja-selamat', async (req, res) => {
  try {
    const data = await JamKerjaSelamat.find().sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/jam-kerja-selamat', async (req, res) => {
  try {
    const { site, date, hours, status } = req.body;
    if (!site || !date || !hours) return res.status(400).json({ error: 'Site, date, dan hours wajib diisi' });
    const newData = new JamKerjaSelamat({ site, date, hours, status: status || 'Safe' });
    const saved = await newData.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/jam-kerja-selamat/:id', async (req, res) => {
  try {
    const { site, date, hours, status } = req.body;
    const updated = await JamKerjaSelamat.findByIdAndUpdate(req.params.id, { site, date, hours, status, updatedAt: new Date() }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/jam-kerja-selamat/:id', async (req, res) => {
  try {
    const deleted = await JamKerjaSelamat.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT SAFE WORK HOURS ====================
const SafeWorkHour = require('./models/SafeWorkHour');
app.get('/api/safe-work-hours', async (req, res) => {
  try {
    const data = await SafeWorkHour.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/safe-work-hours', async (req, res) => {
  try {
    const newData = new SafeWorkHour(req.body);
    const saved = await newData.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/safe-work-hours/:id', async (req, res) => {
  try {
    const updated = await SafeWorkHour.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/safe-work-hours/:id', async (req, res) => {
  try {
    await SafeWorkHour.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT GALLERY ====================
const GalleryItem = require('./models/GalleryItem');
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await GalleryItem.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/gallery/:id', async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/gallery/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const hasLiked = item.likedBy.includes(userId);
    if (hasLiked) {
      item.likedBy = item.likedBy.filter(id => id !== userId);
      item.likes = Math.max(0, item.likes - 1);
    } else {
      item.likedBy.push(userId);
      item.likes += 1;
    }
    await item.save();
    res.json({ likes: item.likes, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/gallery', async (req, res) => {
  try {
    const newItem = new GalleryItem(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/gallery/:id', async (req, res) => {
  try {
    const updated = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT HAZARD ====================
const Hazard = require('./models/Hazard');
app.get('/api/hazards', async (req, res) => {
  try {
    const hazards = await Hazard.find().sort({ createdAt: -1 });
    res.json(hazards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/hazards/:id', async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.id);
    if (!hazard) return res.status(404).json({ error: 'Hazard not found' });
    res.json(hazard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/hazards', async (req, res) => {
  try {
    const newHazard = new Hazard(req.body);
    const saved = await newHazard.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/hazards/:id', async (req, res) => {
  try {
    const updated = await Hazard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/hazards/:id', async (req, res) => {
  try {
    await Hazard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hazard deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT JSA ====================
const JSA = require('./models/JSA');
app.get('/backend-kuzu', async (req, res) => {
  try {
    const data = await JSA.find().sort({ submittedAt: -1 });
    res.json(data);
  } catch (err) {
    console.error('GET JSA error:', err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/backend-kuzu', async (req, res) => {
  console.log('📥 [POST] /backend-kuzu - Request received');
  try {
    const jsaData = req.body;
    if (!jsaData.jobTitle) {
      console.error('❌ Validation error: jobTitle is required');
      return res.status(400).json({ error: 'jobTitle is required' });
    }
    const newJSA = new JSA(jsaData);
    const saved = await newJSA.save();
    console.log('✅ JSA saved successfully, ID:', saved._id);
    res.status(201).json({ message: 'JSA saved successfully', data: saved });
  } catch (err) {
    console.error('❌ Error saving JSA:', err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/backend-kuzu/:id', async (req, res) => {
  try {
    const jsa = await JSA.findById(req.params.id);
    if (!jsa) return res.status(404).json({ error: 'JSA not found' });
    res.json(jsa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.patch('/backend-kuzu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await JSA.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'JSA not found' });
    res.json({ message: 'Updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/backend-kuzu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await JSA.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'JSA not found' });
    res.json({ message: 'JSA deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT LABOUR STANDARDS ====================
const LabourStandard = require('./models/LabourStandard');
app.get('/api/labour-standards', async (req, res) => {
  try {
    const { search, yearMin, yearMax, status } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { number: { $regex: search, $options: 'i' } }
      ];
    }
    if (yearMin || yearMax) {
      filter.year = {};
      if (yearMin) filter.year.$gte = parseInt(yearMin);
      if (yearMax) filter.year.$lte = parseInt(yearMax);
    }
    if (status && status !== 'all') filter.status = status;
    const data = await LabourStandard.find(filter).sort({ year: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/labour-standards/:id', async (req, res) => {
  try {
    const data = await LabourStandard.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/labour-standards/seed', async (req, res) => {
  const defaultData = [
    { number: 'C155', year: 1981, title: 'Keselamatan dan Kesehatan Kerja', description: 'Konvensi utama ILO tentang K3...', status: 'ratified', ratifiedDate: '18 Juni 1986', keyPoints: ['Hak pekerja atas K3', 'Kewajiban pemberi kerja', 'Partisipasi pekerja', 'Penegakan hukum'], category: 'K3' },
    { number: 'C187', year: 2006, title: 'Kerangka Promosi K3', description: 'Konvensi yang mempromosikan budaya pencegahan K3...', status: 'ratified', ratifiedDate: '15 Juli 2015', keyPoints: ['Sistem manajemen K3', 'Pencegahan berkelanjutan', 'Budaya K3', 'Kerja sama internasional'], category: 'K3' }
  ];
  try {
    await LabourStandard.deleteMany({});
    const inserted = await LabourStandard.insertMany(defaultData);
    res.json({ message: 'Seed berhasil', count: inserted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT COMPLIANCE RECORDS ====================
const ComplianceRecord = require('./models/ComplianceRecord');
app.get('/api/compliance-records', async (req, res) => {
  try {
    const { userId } = req.query;
    let filter = {};
    if (userId) filter.userId = userId;
    const records = await ComplianceRecord.find(filter).populate('standardId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/compliance-records', async (req, res) => {
  try {
    const newRecord = new ComplianceRecord(req.body);
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/compliance-records/:id', async (req, res) => {
  try {
    const updated = await ComplianceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT LAGGING INDICATOR ====================
const LaggingIncident = require('./models/LaggingIncident');
const LaggingStat = require('./models/LaggingStat');
app.get('/api/lagging-incidents', async (req, res) => {
  try {
    const { search, startDate, endDate, location, project } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { incidentId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (location && location !== 'all') filter.location = { $regex: location, $options: 'i' };
    if (project && project !== 'all') filter.project = project;
    const incidents = await LaggingIncident.find(filter).sort({ date: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/lagging-stats', async (req, res) => {
  try {
    const stats = await LaggingStat.find();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/lagging-locations', async (req, res) => {
  try {
    const locations = await LaggingIncident.distinct('location');
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/lagging-projects', async (req, res) => {
  try {
    const projects = await LaggingIncident.distinct('project');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/lagging-incidents', async (req, res) => {
  try {
    const newIncident = new LaggingIncident(req.body);
    const saved = await newIncident.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/lagging-incidents/:id', async (req, res) => {
  try {
    const updated = await LaggingIncident.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/lagging-incidents/:id', async (req, res) => {
  try {
    await LaggingIncident.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/lagging/seed', async (req, res) => {
  const defaultIncidents = [
    { incidentId: 'LAG-001', type: 'Near Miss', date: '2024-01-15', location: 'Site A - Logistik', project: 'Project Alpha', status: 'Closed', description: 'Hampir jatuh dari ketinggian 5 meter', severity: 'High' },
    { incidentId: 'LAG-002', type: 'Lost Time Injury', date: '2024-01-12', location: 'Site B - TKJP', project: 'Project Beta', status: 'Investigating', description: 'Cedera kaki akibat material jatuh', severity: 'Critical' }
  ];
  const defaultStats = [
    { metric: 'totalIncidents', value: 45, trend: '+5%', trendUp: true, unit: '' },
    { metric: 'nearMiss', value: 127, trend: '-3%', trendUp: false, unit: '' },
    { metric: 'ltisr', value: 0.23, trend: '↓0.02', trendUp: false, unit: '' },
    { metric: 'safeHours', value: 2.3, trend: '+18%', trendUp: false, unit: 'M' }
  ];
  try {
    await LaggingIncident.deleteMany({});
    await LaggingIncident.insertMany(defaultIncidents);
    await LaggingStat.deleteMany({});
    await LaggingStat.insertMany(defaultStats);
    res.json({ message: 'Seed berhasil', incidents: defaultIncidents.length, stats: defaultStats.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT VISITOR & NEWSLETTER ====================
const Visitor = require('./models/Visitor');
const Newsletter = require('./models/Newsletter');
app.post('/api/visitors', async (req, res) => {
  try {
    const newVisitor = new Visitor(req.body);
    const saved = await newVisitor.save();
    res.status(201).json({ message: 'Terima kasih, kami akan menghubungi Anda', data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const existing = await Newsletter.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email sudah terdaftar' });
    const newSub = new Newsletter({ email });
    await newSub.save();
    res.status(201).json({ message: 'Berhasil subscribe newsletter!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/landing-stats', async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const totalNewsletter = await Newsletter.countDocuments();
    res.json({ totalVisitors, totalNewsletter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT IOT ASSETS ====================
const IoTAsset = require('./models/IoTAsset');
app.get('/api/iot-assets', async (req, res) => {
  try {
    const assets = await IoTAsset.find();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/iot-assets', async (req, res) => {
  try {
    const newAsset = new IoTAsset(req.body);
    const saved = await newAsset.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT LOGIN LOGS ====================
const LoginLog = require('./models/LoginLog');
app.get('/api/login-stats', async (req, res) => {
  try {
    const totalLogins = await LoginLog.countDocuments({ status: 'success' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = await LoginLog.countDocuments({ loginAt: { $gte: today }, status: 'success' });
    res.json({ totalLogins, todayLogins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT MEDICAL CASE ====================
const MedicalCase = require('./models/MedicalCase');
app.get('/api/medical-cases', async (req, res) => {
  try {
    const data = await MedicalCase.find().sort({ severity: -1, createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/medical-cases/:id', async (req, res) => {
  try {
    const data = await MedicalCase.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/medical-cases', async (req, res) => {
  try {
    const newCase = new MedicalCase(req.body);
    const saved = await newCase.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/medical-cases/:id', async (req, res) => {
  try {
    const updated = await MedicalCase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/medical-cases/:id', async (req, res) => {
  try {
    await MedicalCase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT NAVIGASI MENU ====================
const NavigasiMenu = require('./models/NavigasiMenu');
app.get('/api/navigasi-menu', async (req, res) => {
  try {
    const data = await NavigasiMenu.find().sort({ order: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/navigasi-menu/:id', async (req, res) => {
  try {
    const data = await NavigasiMenu.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/navigasi-menu', async (req, res) => {
  try {
    const newItem = new NavigasiMenu(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/navigasi-menu/:id', async (req, res) => {
  try {
    const updated = await NavigasiMenu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/navigasi-menu/:id', async (req, res) => {
  try {
    await NavigasiMenu.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT NEAR MISS ====================
const NearMiss = require('./models/NearMiss');
app.get('/api/near-miss', async (req, res) => {
  try {
    const data = await NearMiss.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/near-miss/:id', async (req, res) => {
  try {
    const data = await NearMiss.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/near-miss', async (req, res) => {
  try {
    const newItem = new NearMiss(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/near-miss/:id', async (req, res) => {
  try {
    const updated = await NearMiss.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/near-miss/:id', async (req, res) => {
  try {
    await NearMiss.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT NEWS ====================
const News = require('./models/News');
app.get('/api/news', async (req, res) => {
  try {
    const { search, tag, limit = 20 } = req.query;
    let filter = { isActive: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }
    if (tag && tag !== 'all') filter.tags = tag;
    const data = await News.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/news/:id', async (req, res) => {
  try {
    const data = await News.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    data.views += 1;
    await data.save();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/news', async (req, res) => {
  try {
    const newItem = new News(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/news/:id', async (req, res) => {
  try {
    const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/news/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/news/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Not found' });
    const hasLiked = news.likedBy.includes(userId);
    if (hasLiked) {
      news.likedBy = news.likedBy.filter(id => id !== userId);
      news.likes = Math.max(0, news.likes - 1);
    } else {
      news.likedBy.push(userId);
      news.likes += 1;
    }
    await news.save();
    res.json({ likes: news.likes, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/news/:id/bookmark', async (req, res) => {
  try {
    const { userId } = req.body;
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Not found' });
    const hasBookmarked = news.bookmarks.includes(userId);
    if (hasBookmarked) {
      news.bookmarks = news.bookmarks.filter(id => id !== userId);
    } else {
      news.bookmarks.push(userId);
    }
    await news.save();
    res.json({ bookmarked: !hasBookmarked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT KOMENTAR BERITA ====================
const KomentarBerita = require('./models/KomentarBerita');
app.get('/api/komentar-berita/:newsId', async (req, res) => {
  try {
    const comments = await KomentarBerita.find({ newsId: req.params.newsId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/komentar-berita', async (req, res) => {
  try {
    const newComment = new KomentarBerita(req.body);
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/komentar-berita/:id', async (req, res) => {
  try {
    await KomentarBerita.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT OCCUPATIONAL DISEASE ====================
const OccupationalDisease = require('./models/OccupationalDisease');
app.get('/api/occupational-diseases', async (req, res) => {
  try {
    const data = await OccupationalDisease.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/occupational-diseases/stats', async (req, res) => {
  try {
    const total = await OccupationalDisease.countDocuments();
    const byCategory = {};
    const categories = ['respiratory', 'musculoskeletal', 'dermatological', 'neurological', 'sensory', 'cancer'];
    for (const cat of categories) {
      byCategory[cat] = await OccupationalDisease.countDocuments({ category: cat });
    }
    const bySeverity = {
      Low: await OccupationalDisease.countDocuments({ severity: 'Low' }),
      Medium: await OccupationalDisease.countDocuments({ severity: 'Medium' }),
      High: await OccupationalDisease.countDocuments({ severity: 'High' }),
      Critical: await OccupationalDisease.countDocuments({ severity: 'Critical' })
    };
    const active = await OccupationalDisease.countDocuments({ status: 'Active' });
    res.json({ total, byCategory, bySeverity, active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/occupational-diseases', async (req, res) => {
  try {
    const newItem = new OccupationalDisease(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/occupational-diseases/:id', async (req, res) => {
  try {
    const updated = await OccupationalDisease.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/occupational-diseases/:id', async (req, res) => {
  try {
    await OccupationalDisease.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT OSH SYSTEM ====================
const { DashboardStats, OSHImplementation, OSHAudit, OSHTraining, OSHRiskAssessment, Activity, AIRecommendation } = require('./models/OSHSystem');

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    let stats = await DashboardStats.findOne();
    if (!stats) {
      stats = await DashboardStats.create({
        incidents: { total: 12, highRisk: 3, lowRisk: 9, trend: '-5' },
        nearMiss: { total: 28, highRisk: 6, trend: '+12' },
        observations: { total: 145, negative: 23, positive: 122, trend: '-3' },
        medical: { total: 4, critical: 1, minor: 3, trend: '0' },
        apdCompliance: 87
      });
    }
    const implementations = await OSHImplementation.countDocuments();
    const riskAssessments = await OSHRiskAssessment.countDocuments();
    res.json({ ...stats.toObject(), implementations, riskAssessments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osh-implementation', async (req, res) => {
  try {
    const data = await OSHImplementation.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/osh-implementation', async (req, res) => {
  try {
    const newData = new OSHImplementation(req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/osh-implementation/:id', async (req, res) => {
  try {
    const updated = await OSHImplementation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/osh-implementation/:id', async (req, res) => {
  try {
    await OSHImplementation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osh-audit', async (req, res) => {
  try {
    const data = await OSHAudit.find().sort({ auditDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/osh-audit', async (req, res) => {
  try {
    const newData = new OSHAudit(req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osh-training', async (req, res) => {
  try {
    const data = await OSHTraining.find().sort({ trainingDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/osh-training', async (req, res) => {
  try {
    const newData = new OSHTraining(req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/osh-risk-assessment', async (req, res) => {
  try {
    const data = await OSHRiskAssessment.find().sort({ assessmentDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/osh-risk-assessment', async (req, res) => {
  try {
    const newData = new OSHRiskAssessment(req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai-recommendations', async (req, res) => {
  try {
    let recommendations = await AIRecommendation.find({ isRead: false }).sort({ priority: -1, createdAt: -1 });
    if (recommendations.length === 0) {
      const defaults = [
        { title: 'APD Compliance', message: 'APD usage turun 15% di area produksi. Perlu inspeksi tambahan.', priority: 'high', action: '/manajemen-apd' },
        { title: 'Near Miss Trend', message: 'Near miss meningkat 20% di shift malam. Evaluasi prosedur.', priority: 'medium', action: '/near-miss' },
        { title: 'Training Due', message: '5 pekerja perlu sertifikasi APAR bulan ini.', priority: 'low', action: '/pelatihan' }
      ];
      recommendations = await AIRecommendation.insertMany(defaults);
    }
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT STATISTIK K3 ====================
app.get('/api/k3-stats/summary', async (req, res) => {
  try {
    const totalIncidents = await LaggingIncident.countDocuments();
    const totalNearMiss = await NearMiss.countDocuments();
    const totalObservations = await Observasi.countDocuments();
    const totalMedical = await MedicalCase.countDocuments();
    const criticalMedical = await MedicalCase.countDocuments({ severity: 'Critical', status: 'Open' });
    const highRiskIncidents = await LaggingIncident.countDocuments({ severity: 'Critical' });
    res.json({
      incidents: { total: totalIncidents, highRisk: highRiskIncidents },
      nearMiss: { total: totalNearMiss },
      observations: { total: totalObservations, negative: await Observasi.countDocuments({ type: 'Negative' }) },
      medical: { total: totalMedical, critical: criticalMedical },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/k3-stats/trend', async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    const trendData = [];
    for (let i = 0; i < 6; i++) {
      const month = new Date(currentYear, i, 1);
      const nextMonth = new Date(currentYear, i + 1, 1);
      const incidents = await LaggingIncident.countDocuments({ createdAt: { $gte: month, $lt: nextMonth } });
      const nearMiss = await NearMiss.countDocuments({ createdAt: { $gte: month, $lt: nextMonth } });
      trendData.push({ month: months[i], incidents, nearMiss });
    }
    res.json(trendData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT TRAINING ====================
const { Training, Enrollment, Certificate, TrainingCategory, TrainingRecommendation } = require('./models/Training');

app.get('/api/trainings', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };
    const trainings = await Training.find(query).sort({ startDate: 1 }).populate('createdBy', 'name username');
    const now = new Date();
    for (const training of trainings) {
      if (training.status === 'Scheduled' && new Date(training.startDate) <= now) {
        training.status = 'Ongoing';
        await training.save();
      }
      if (training.status === 'Ongoing' && new Date(training.endDate) < now) {
        training.status = 'Completed';
        await training.save();
      }
    }
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trainings', async (req, res) => {
  try {
    const training = new Training(req.body);
    await training.save();
    res.status(201).json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my-trainings/:userId', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.params.userId }).populate('trainingId').sort({ createdAt: -1 });
    const myTrainings = enrollments.map(e => ({
      ...e.trainingId._doc,
      enrollmentId: e._id,
      progress: e.progress,
      enrollmentStatus: e.status,
      certificateIssued: e.certificateIssued,
      certificateNumber: e.certificateNumber
    }));
    res.json(myTrainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/enrollments', async (req, res) => {
  try {
    const { userId, trainingId } = req.body;
    const existing = await Enrollment.findOne({ userId, trainingId });
    if (existing) return res.status(400).json({ error: 'Already enrolled' });
    const training = await Training.findById(trainingId);
    if (training.currentParticipants >= training.maxParticipants) {
      return res.status(400).json({ error: 'Training is full' });
    }
    const enrollment = new Enrollment(req.body);
    await enrollment.save();
    training.currentParticipants += 1;
    await training.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/enrollments/:id', async (req, res) => {
  try {
    const { progress, status } = req.body;
    const updateData = { progress };
    if (status) updateData.status = status;
    if (progress >= 100) {
      updateData.status = 'Completed';
      updateData.completedAt = new Date();
    }
    const updated = await Enrollment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/certificates', async (req, res) => {
  try {
    const { userId, trainingId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    if (trainingId) query.trainingId = trainingId;
    const certificates = await Certificate.find(query).populate('userId', 'name username').populate('trainingId', 'name category duration');
    res.json(certificates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/certificates', async (req, res) => {
  try {
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const certificate = new Certificate({ ...req.body, certificateNumber: certNumber });
    await certificate.save();
    await Enrollment.findByIdAndUpdate(req.body.enrollmentId, { certificateIssued: true, certificateNumber: certNumber, status: 'Certified' });
    res.status(201).json(certificate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/training-categories', async (req, res) => {
  try {
    let categories = await TrainingCategory.find({ isActive: true }).sort({ order: 1 });
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Fire Safety', slug: 'fire_safety', icon: '🔥', color: 'red', order: 1 },
        { name: 'First Aid', slug: 'first_aid', icon: '🚑', color: 'green', order: 2 },
        { name: 'APD Usage', slug: 'apd', icon: '🛡️', color: 'blue', order: 3 },
        { name: 'HSE Management', slug: 'hse', icon: '📋', color: 'purple', order: 4 },
        { name: 'General Safety', slug: 'general', icon: '⚠️', color: 'yellow', order: 5 }
      ];
      await TrainingCategory.insertMany(defaultCategories);
      categories = defaultCategories;
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT EMERGENCY ====================
const { EmergencyLog, FireSensor, EvacuationPoint, EmergencyBroadcast } = require('./models/Emergency');

app.get('/api/emergency-logs', async (req, res) => {
  try {
    const { limit = 50, userId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    const logs = await EmergencyLog.find(query).sort({ timestamp: -1 }).limit(parseInt(limit)).populate('userId', 'name username');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emergency-logs', async (req, res) => {
  try {
    const log = new EmergencyLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fire-sensors', async (req, res) => {
  try {
    let sensors = await FireSensor.find({ isActive: true });
    if (sensors.length === 0) {
      const defaultSensors = [
        { name: 'Sensor A1', location: 'Gudang Utama', coordinates: { lat: -6.198000, lng: 106.645000 }, status: 'normal', temperature: 28, smokeLevel: 0 },
        { name: 'Sensor A2', location: 'Ruang Produksi', coordinates: { lat: -6.198300, lng: 106.645300 }, status: 'warning', temperature: 45, smokeLevel: 30 },
        { name: 'Sensor A3', location: 'Kantin', coordinates: { lat: -6.197900, lng: 106.644900 }, status: 'normal', temperature: 26, smokeLevel: 0 },
        { name: 'Sensor B1', location: 'Laboratorium', coordinates: { lat: -6.198500, lng: 106.645500 }, status: 'alert', temperature: 68, smokeLevel: 85 },
        { name: 'Sensor B2', location: 'Ruang Server', coordinates: { lat: -6.197700, lng: 106.645200 }, status: 'normal', temperature: 24, smokeLevel: 0 }
      ];
      await FireSensor.insertMany(defaultSensors);
      sensors = defaultSensors;
    }
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/evacuation-points', async (req, res) => {
  try {
    let points = await EvacuationPoint.find({ isActive: true });
    if (points.length === 0) {
      const defaultPoints = [
        { name: 'Pintu Utama', location: 'Gedung Utama', coordinates: { lat: -6.198263, lng: 106.645141 }, capacity: 200, type: 'exit' },
        { name: 'Pintu Darurat Timur', location: 'Sayap Timur', coordinates: { lat: -6.197800, lng: 106.646000 }, capacity: 100, type: 'exit' },
        { name: 'Pintu Darurat Barat', location: 'Sayap Barat', coordinates: { lat: -6.198700, lng: 106.644500 }, capacity: 100, type: 'exit' },
        { name: 'Lapangan Parkir', location: 'Area Parkir', coordinates: { lat: -6.199000, lng: 106.645500 }, capacity: 300, type: 'assembly_point' }
      ];
      await EvacuationPoint.insertMany(defaultPoints);
      points = defaultPoints;
    }
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/emergency-broadcast', async (req, res) => {
  try {
    const { message, level, sentBy } = req.body;
    const broadcast = new EmergencyBroadcast({ message, level: level || 'red', sentBy, sentTo: ['all'], timestamp: new Date() });
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT NOTIFICATION SETTINGS ====================
const NotificationSetting = require('./models/NotificationSetting');
const NotificationMessage = require('./models/NotificationMessage');

app.get('/api/notification-settings/:userId', async (req, res) => {
  try {
    let settings = await NotificationSetting.findOne({ userId: req.params.userId });
    if (!settings) {
      const defaultCategories = [
        { id: 'apd', name: 'APD', enabled: true, priority: 'high', sound: true, whatsapp: false, email: false },
        { id: 'observasi', name: 'Observasi', enabled: true, priority: 'medium', sound: true, whatsapp: false, email: false },
        { id: 'nearmiss', name: 'Near Miss', enabled: true, priority: 'high', sound: true, whatsapp: true, email: false },
        { id: 'medical', name: 'Medical', enabled: true, priority: 'high', sound: true, whatsapp: true, email: true },
        { id: 'emergency', name: 'Emergency', enabled: true, priority: 'critical', sound: true, whatsapp: true, email: true },
        { id: 'training', name: 'Pelatihan', enabled: true, priority: 'medium', sound: false, whatsapp: false, email: false },
        { id: 'safety', name: 'Safety Moment', enabled: true, priority: 'low', sound: false, whatsapp: false, email: false },
        { id: 'system', name: 'Sistem', enabled: true, priority: 'low', sound: false, whatsapp: false, email: false }
      ];
      settings = new NotificationSetting({ userId: req.params.userId, categories: defaultCategories });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notification-settings/:userId', async (req, res) => {
  try {
    const updated = await NotificationSetting.findOneAndUpdate({ userId: req.params.userId }, { ...req.body, updatedAt: new Date() }, { new: true, upsert: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/history/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await NotificationMessage.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(limit);
    res.json({ data: notifications, total: notifications.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/history/:userId', async (req, res) => {
  try {
    await NotificationMessage.deleteMany({ userId: req.params.userId });
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await NotificationMessage.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Not found' });
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/unread/:userId', async (req, res) => {
  try {
    const count = await NotificationMessage.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/test', async (req, res) => {
  try {
    const { waNumber, email } = req.body;
    res.json({ success: true, message: 'Test notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT AI SUGGESTION ====================
const AISuggestion = require('./models/AISuggestion');

app.post('/api/ai/suggestion', async (req, res) => {
  try {
    const { module, type, retryCount } = req.body;
    const suggestions = {
      apd: { empty: '💡 Belum ada data APD. Mulai dengan menambahkan alat pelindung diri.', error: '⚠️ Gagal memuat data APD.', loading: '⏳ Sedang mengambil data APD...' },
      general: { empty: '💡 Coba refresh halaman atau periksa koneksi internet Anda.', error: '⚠️ Gagal memuat data. Coba lagi.', loading: '⏳ Sedang memuat data...' }
    };
    const moduleSuggestions = suggestions[module] || suggestions.general;
    const suggestion = moduleSuggestions[type] || moduleSuggestions.empty;
    res.json({ suggestion });
  } catch (err) {
    res.json({ suggestion: '💡 Coba refresh halaman. Jika masih error, hubungi tim dukungan.' });
  }
});

// ==================== ENDPOINT USER PROFILE ====================
const { UserProfile, LoginHistory, UserActivity } = require('./models/UserProfile');

app.get('/api/user-stats/:userId', async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      profile = new UserProfile({ userId: req.params.userId });
      await profile.save();
    }
    res.json(profile.stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/login-history/:userId', async (req, res) => {
  try {
    const history = await LoginHistory.find({ userId: req.params.userId }).sort({ timestamp: -1 }).limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login-record', async (req, res) => {
  try {
    const record = new LoginHistory(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-activity/:userId', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const activities = await UserActivity.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.params.userId), date: { $gte: startDate } } },
      { $group: { _id: { $dayOfWeek: '$date' }, observations: { $sum: { $cond: [{ $eq: ['$type', 'observation'] }, 1, 0] } }, trainings: { $sum: { $cond: [{ $eq: ['$type', 'training'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result = activities.map(a => ({ day: dayNames[a._id - 1] || 'Sen', observations: a.observations || 0, trainings: a.trainings || 0 }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user-profile/:userId', async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate({ userId: req.params.userId }, { ...req.body, updatedAt: new Date() }, { new: true, upsert: true });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.password !== oldPassword) return res.status(401).json({ error: 'Password lama salah' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-recommendations/:userId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    const user = await User.findById(req.params.userId);
    const recommendations = [];
    if (profile?.stats?.completedTrainings < 5) {
      recommendations.push({ title: 'Complete Basic Safety Training', reason: 'Essential for all workers', priority: 'high', action: '/pelatihan' });
    }
    if (user?.role === 'Supervisor' || user?.role === 'Admin') {
      recommendations.push({ title: 'Fire Marshal Certification', reason: 'Required for your role', priority: 'high', action: '/pelatihan-pemadam' });
    }
    if (recommendations.length === 0) {
      recommendations.push({ title: 'Keep Up the Good Work!', reason: 'You\'re on track with all trainings', priority: 'low', action: '/dashboard' });
    }
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT PSYCHOSOCIAL ====================
const { MoodCheck, BurnoutAnalysis, WellbeingReminder, StressReport } = require('./models/Psychosocial');

app.post('/api/mood-check', async (req, res) => {
  try {
    const moodCheck = new MoodCheck(req.body);
    await moodCheck.save();
    res.status(201).json(moodCheck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mood-history/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const history = await MoodCheck.find({ userId: req.params.userId }).sort({ date: -1 }).limit(limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/burnout-analysis', async (req, res) => {
  try {
    const analysis = new BurnoutAnalysis(req.body);
    await analysis.save();
    res.status(201).json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/burnout-analysis/:userId', async (req, res) => {
  try {
    const analysis = await BurnoutAnalysis.find({ userId: req.params.userId }).sort({ date: -1 }).limit(1);
    res.json(analysis[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stress-heatmap', async (req, res) => {
  try {
    const defaultHeatmap = [
      { department: 'Produksi', score: 75, employeeCount: 120 },
      { department: 'Logistik', score: 68, employeeCount: 45 },
      { department: 'Teknik', score: 62, employeeCount: 30 },
      { department: 'HRD', score: 45, employeeCount: 15 },
      { department: 'Keuangan', score: 52, employeeCount: 20 },
      { department: 'IT', score: 58, employeeCount: 25 }
    ];
    res.json(defaultHeatmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wellbeing-reminders/:userId', async (req, res) => {
  try {
    const reminders = await WellbeingReminder.find({ userId: req.params.userId, isActive: true });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const departments = [
      { id: 1, name: 'Produksi', employeeCount: 120 },
      { id: 2, name: 'Logistik', employeeCount: 45 },
      { id: 3, name: 'Teknik', employeeCount: 30 },
      { id: 4, name: 'HRD', employeeCount: 15 },
      { id: 5, name: 'Keuangan', employeeCount: 20 },
      { id: 6, name: 'IT', employeeCount: 25 }
    ];
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT RESOURCES ====================
// ✅ BENAR - Langsung require dari folder models
const Resource = require('./models/Resource');
const ResourceView = require('./models/ResourceView');
const UserBookmark = require('./models/UserBookmark');

app.get('/api/resources', async (req, res) => {
  try {
    const { type, category, search, limit = 20 } = req.query;
    let filter = { isActive: true };
    if (type && type !== 'all') filter.type = type;
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    const data = await Resource.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    resource.views += 1;
    await resource.save();
    const { userId } = req.query;
    if (userId) {
      await ResourceView.create({ resourceId: resource._id, userId, action: 'view' });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const newResource = new Resource(req.body);
    const saved = await newResource.save();
    if (saved.type === 'regulation' || saved.type === 'publication') {
      try {
        await fetch(`${API_BASE}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `📄 Dokumen baru: ${saved.title} (${saved.type}) telah tersedia`,
            type: 'info',
            category: 'Sumber Daya',
            link: '/publications-resources',
            read: false
          })
        });
      } catch (err) { console.error('Gagal kirim notifikasi'); }
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/resources/:id', async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    resource.downloads += 1;
    await resource.save();
    const { userId } = req.body;
    if (userId) {
      await ResourceView.create({ resourceId: resource._id, userId, action: 'download' });
    }
    res.json({ downloads: resource.downloads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources/popular', async (req, res) => {
  try {
    const popular = await Resource.find({ isActive: true }).sort({ views: -1 }).limit(5);
    res.json(popular);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const { userId, resourceId } = req.body;
    const existing = await UserBookmark.findOne({ userId, resourceId });
    if (existing) {
      await UserBookmark.deleteOne({ userId, resourceId });
      res.json({ bookmarked: false });
    } else {
      await UserBookmark.create({ userId, resourceId });
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookmarks/:userId', async (req, res) => {
  try {
    const bookmarks = await UserBookmark.find({ userId: req.params.userId }).populate('resourceId');
    res.json(bookmarks.map(b => b.resourceId).filter(r => r));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources/recommendations/:userId', async (req, res) => {
  try {
    const userViews = await ResourceView.find({ userId: req.params.userId }).populate('resourceId').limit(10);
    const viewedTypes = [...new Set(userViews.map(v => v.resourceId?.type).filter(Boolean))];
    const recommendations = await Resource.find({
      type: { $in: viewedTypes },
      isActive: true,
      _id: { $nin: userViews.map(v => v.resourceId?._id).filter(Boolean) }
    }).limit(5);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT SAFETY CHECKLIST ====================
const SafetyChecklist = require('./models/SafetyChecklist');

app.get('/api/safety-checklists', async (req, res) => {
  try {
    const { limit = 50, reporterId } = req.query;
    let filter = {};
    if (reporterId) filter.reporterId = reporterId;
    const data = await SafetyChecklist.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/safety-checklists/stats', async (req, res) => {
  try {
    const total = await SafetyChecklist.countDocuments();
    const completed = await SafetyChecklist.countDocuments({ status: 'Completed' });
    const failed = await SafetyChecklist.countDocuments({ status: 'Failed' });
    const needsReview = await SafetyChecklist.countDocuments({ status: 'NeedsReview' });
    const highRisk = await SafetyChecklist.countDocuments({ riskLevel: 'High' });
    const avgPassRate = await SafetyChecklist.aggregate([
      { $group: { _id: null, avg: { $avg: '$passRate' } } }
    ]);
    res.json({ total, completed, failed, needsReview, highRisk, avgPassRate: avgPassRate[0]?.avg || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/safety-checklists', async (req, res) => {
  try {
    const newChecklist = new SafetyChecklist(req.body);
    const saved = await newChecklist.save();
    if (saved.riskLevel === 'High' || saved.passRate < 70) {
      const observation = new Observasi({
        type: 'Negative',
        description: `Checklist ${saved.template} pada ${saved.location} memiliki pass rate ${saved.passRate}% dengan risiko ${saved.riskLevel}`,
        location: saved.location,
        locationGps: saved.latitude && saved.longitude ? { lat: saved.latitude, lng: saved.longitude } : null,
        observedBy: saved.reporter,
        observedById: saved.reporterId,
        relatedModule: 'Checklist',
        relatedId: saved._id
      });
      await observation.save();
      saved.relatedObservationId = observation._id;
      await saved.save();
      if (saved.passRate < 50) {
        const nearMiss = new NearMiss({
          title: `Checklist gagal: ${saved.template} di ${saved.location}`,
          severity: 'High',
          description: `Checklist ${saved.template} memiliki pass rate ${saved.passRate}%. Item yang gagal: ${saved.items.filter(i => !i.checked).map(i => i.name).join(', ')}`,
          location: saved.location,
          locationGps: saved.latitude && saved.longitude ? { lat: saved.latitude, lng: saved.longitude } : null,
          reporter: saved.reporter,
          reporterId: saved.reporterId,
          status: 'Open'
        });
        const savedNearMiss = await nearMiss.save();
        saved.relatedNearMissId = savedNearMiss._id;
        await saved.save();
        await fetch(`${API_BASE}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `⚠️ Checklist ${saved.template} gagal di ${saved.location} (Pass rate: ${saved.passRate}%)`,
            type: 'violation',
            category: 'Insiden',
            link: '/quick-safety-checklist',
            read: false
          })
        });
      }
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/safety-checklists/:id', async (req, res) => {
  try {
    const updated = await SafetyChecklist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/safety-checklists/:id', async (req, res) => {
  try {
    await SafetyChecklist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT VIDEOS ====================
const VideoWatchHistory = require('./models/VideoWatchHistory');
const UserBadge = require('./models/UserBadge');

app.get('/api/videos', async (req, res) => {
  try {
    const { category, limit = 20, userId } = req.query;
    let filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;
    const videos = await Video.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    let watchHistory = [];
    if (userId) {
      watchHistory = await VideoWatchHistory.find({ userId });
    }
    const videosWithUserData = videos.map(v => ({
      ...v.toObject(),
      watched: watchHistory.some(w => w.videoId.toString() === v._id.toString()),
      likedByUser: v.likedBy?.includes(userId) || false
    }));
    res.json(videosWithUserData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos/popular', async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true }).sort({ views: -1 }).limit(10);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos/recommendations/:userId', async (req, res) => {
  try {
    const watchHistory = await VideoWatchHistory.find({ userId: req.params.userId }).populate('videoId');
    const watchedCategories = [...new Set(watchHistory.map(w => w.videoId?.category).filter(Boolean))];
    const watchedTags = [...new Set(watchHistory.flatMap(w => w.videoId?.tags || []))];
    let recommendations = [];
    if (watchedCategories.length > 0) {
      recommendations = await Video.find({
        isActive: true,
        category: { $in: watchedCategories },
        _id: { $nin: watchHistory.map(w => w.videoId?._id).filter(Boolean) }
      }).limit(5);
    }
    if (recommendations.length < 5 && watchedTags.length > 0) {
      const more = await Video.find({
        isActive: true,
        tags: { $in: watchedTags },
        _id: { $nin: [...watchHistory.map(w => w.videoId?._id), ...recommendations.map(r => r._id)] }
      }).limit(5 - recommendations.length);
      recommendations = [...recommendations, ...more];
    }
    if (recommendations.length === 0) {
      recommendations = await Video.find({ isActive: true }).sort({ views: -1 }).limit(5);
    }
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Not found' });
    video.views += 1;
    await video.save();
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const newVideo = new Video(req.body);
    const saved = await newVideo.save();
    await fetch(`${API_BASE}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🎥 Video baru: ${saved.title} - Tonton untuk edukasi safety!`,
        type: 'info',
        category: 'Umum',
        link: '/reels',
        read: false
      })
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/videos/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Not found' });
    const hasLiked = video.likedBy.includes(userId);
    if (hasLiked) {
      video.likedBy = video.likedBy.filter(id => id !== userId);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      video.likedBy.push(userId);
      video.likes += 1;
    }
    await video.save();
    res.json({ likes: video.likes, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/watch-history', async (req, res) => {
  try {
    const { userId, videoId, completed, watchDuration, quizScore, quizPassed } = req.body;
    const existing = await VideoWatchHistory.findOne({ userId, videoId });
    if (existing) {
      existing.completed = completed || existing.completed;
      existing.quizScore = quizScore || existing.quizScore;
      existing.quizPassed = quizPassed || existing.quizPassed;
      await existing.save();
    } else {
      await VideoWatchHistory.create({ userId, videoId, completed, watchDuration, quizScore, quizPassed });
    }
    if (completed) {
      let points = 10;
      if (quizPassed) points += 20;
      const totalPoints = (await UserBadge.aggregate([{ $match: { userId }, $group: { _id: null, total: { $sum: '$points' } } }])[0]?.total || 0) + points;
      const watchCount = await VideoWatchHistory.countDocuments({ userId, completed: true });
      if (watchCount >= 5 && !(await UserBadge.findOne({ userId, badgeType: 'ConsistentViewer' }))) {
        await UserBadge.create({ userId, badgeType: 'ConsistentViewer', points: 50 });
      }
      if (quizPassed && !(await UserBadge.findOne({ userId, badgeType: 'QuizChampion' }))) {
        await UserBadge.create({ userId, badgeType: 'QuizChampion', points: 100 });
      }
      if (totalPoints >= 500 && !(await UserBadge.findOne({ userId, badgeType: 'SafetyMaster' }))) {
        await UserBadge.create({ userId, badgeType: 'SafetyMaster', points: 500 });
      }
    }
    res.json({ message: 'History saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-badges/:userId', async (req, res) => {
  try {
    const badges = await UserBadge.find({ userId: req.params.userId });
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-watch-stats/:userId', async (req, res) => {
  try {
    const totalWatched = await VideoWatchHistory.countDocuments({ userId: req.params.userId });
    const totalCompleted = await VideoWatchHistory.countDocuments({ userId: req.params.userId, completed: true });
    const totalPoints = await UserBadge.aggregate([{ $match: { userId: req.params.userId } }, { $group: { _id: null, total: { $sum: '$points' } } }]);
    res.json({ totalWatched, totalCompleted, totalPoints: totalPoints[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT REPORTS ====================
const Report = require('./models/Report');

app.get('/api/reports', async (req, res) => {
  try {
    const { limit = 50, type, severity, status } = req.query;
    let filter = {};
    if (type && type !== 'all') filter.type = type;
    if (severity && severity !== 'all') filter.severity = severity;
    if (status && status !== 'all') filter.status = status;
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/stats', async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const open = await Report.countDocuments({ status: 'Open' });
    const inProgress = await Report.countDocuments({ status: 'In Progress' });
    const resolved = await Report.countDocuments({ status: 'Resolved' });
    const closed = await Report.countDocuments({ status: 'Closed' });
    const byType = {
      Incident: await Report.countDocuments({ type: 'Incident' }),
      NearMiss: await Report.countDocuments({ type: 'Near Miss' }),
      Observation: await Report.countDocuments({ type: 'Observation' }),
      Hazard: await Report.countDocuments({ type: 'Hazard' }),
      Inspection: await Report.countDocuments({ type: 'Inspection' })
    };
    const bySeverity = {
      Low: await Report.countDocuments({ severity: 'Low' }),
      Medium: await Report.countDocuments({ severity: 'Medium' }),
      High: await Report.countDocuments({ severity: 'High' }),
      Critical: await Report.countDocuments({ severity: 'Critical' })
    };
    res.json({ total, open, inProgress, resolved, closed, byType, bySeverity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const reportData = req.body;
    const detectedHazards = analyzeHazards(reportData.description);
    reportData.autoDetectedHazards = detectedHazards;
    if (!reportData.severity) {
      if (detectedHazards.includes('Fire') || detectedHazards.includes('Explosion') || 
          detectedHazards.includes('Fall') || detectedHazards.includes('Chemical')) {
        reportData.severity = 'High';
      } else if (detectedHazards.includes('Electrical') || detectedHazards.includes('Machinery')) {
        reportData.severity = 'Medium';
      } else {
        reportData.severity = 'Low';
      }
    }
    const newReport = new Report(reportData);
    const saved = await newReport.save();
    if (saved.severity === 'High' || saved.severity === 'Critical') {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🚨 Laporan ${saved.type} baru: ${saved.title} (${saved.severity}) di ${saved.location || 'lokasi tidak diketahui'}`,
          type: 'violation',
          category: 'Insiden',
          link: `/reports/${saved._id}`,
          read: false,
          role: 'Supervisor'
        })
      }).catch(notifErr => console.error('Gagal kirim notifikasi:', notifErr));
    }
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT SAFETY MOMENTS ====================
const SafetyMoment = require('./models/SafetyMoment');
const UserSafetyProgress = require('./models/UserSafetyProgress');
const AISafetyTip = require('./models/AISafetyTip');

app.get('/api/safety-moments', async (req, res) => {
  try {
    const { limit = 20, category, search, userId } = req.query;
    let filter = { isActive: true };
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    let moments = await SafetyMoment.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    
    if (userId) {
      const progress = await UserSafetyProgress.findOne({ userId });
      const readMomentIds = progress?.readMoments.map(r => r.momentId.toString()) || [];
      
      moments = moments.map(m => ({
        ...m.toObject(),
        isRead: readMomentIds.includes(m._id.toString()),
        isLiked: m.likedBy.includes(userId)
      }));
    }
    
    res.json(moments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/safety-moments/:id', async (req, res) => {
  try {
    const moment = await SafetyMoment.findById(req.params.id);
    if (!moment) return res.status(404).json({ error: 'Not found' });
    moment.views += 1;
    await moment.save();
    res.json(moment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/safety-moments', async (req, res) => {
  try {
    const newMoment = new SafetyMoment(req.body);
    const saved = await newMoment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/safety-moments/:id', async (req, res) => {
  try {
    const updated = await SafetyMoment.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/safety-moments/:id', async (req, res) => {
  try {
    await SafetyMoment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/safety-moments/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const moment = await SafetyMoment.findById(req.params.id);
    if (!moment) return res.status(404).json({ error: 'Not found' });
    const hasLiked = moment.likedBy.includes(userId);
    if (hasLiked) {
      moment.likedBy = moment.likedBy.filter(id => id !== userId);
      moment.likes = Math.max(0, moment.likes - 1);
    } else {
      moment.likedBy.push(userId);
      moment.likes += 1;
    }
    await moment.save();
    res.json({ likes: moment.likes, liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/safety-moments/:id/read', async (req, res) => {
  try {
    const { userId, userName, timeSpent } = req.body;
    let progress = await UserSafetyProgress.findOne({ userId });
    if (!progress) {
      progress = new UserSafetyProgress({ userId, userName, readMoments: [] });
    }
    const alreadyRead = progress.readMoments.some(r => r.momentId.toString() === req.params.id);
    if (!alreadyRead) {
      progress.readMoments.push({
        momentId: req.params.id,
        readAt: new Date(),
        timeSpent: timeSpent || 0
      });
      progress.totalReadCount += 1;
      const today = new Date().toDateString();
      const lastRead = progress.lastReadDate ? new Date(progress.lastReadDate).toDateString() : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastRead === yesterday.toDateString()) {
        progress.streak += 1;
      } else if (lastRead !== today) {
        progress.streak = 1;
      }
      progress.lastReadDate = new Date();
      progress.updatedAt = new Date();
      await progress.save();
    }
    res.json({ totalRead: progress.totalReadCount, streak: progress.streak, alreadyRead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/safety-progress/:userId', async (req, res) => {
  try {
    let progress = await UserSafetyProgress.findOne({ userId: req.params.userId }).populate('readMoments.momentId');
    if (!progress) {
      progress = { totalReadCount: 0, streak: 0, dailyGoal: 1, readMoments: [] };
    }
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai-safety-tip', async (req, res) => {
  try {
    const { category } = req.query;
    const safetyTips = {
      'Fire Safety': ['🔥 Pastikan APAR tersedia dan mudah dijangkau di setiap area kerja', '🔥 Jangan menumpuk barang di depan panel listrik atau hydrant', '🔥 Matikan peralatan listrik saat tidak digunakan untuk mencegah konsleting', '🔥 Lakukan simulasi kebakaran minimal 1x per bulan'],
      'Electrical': ['⚡ Jangan menggunakan colokan yang rusak atau kabel yang terkelupas', '⚡ Hindari penggunaan kabel extension secara berantai (daisy chain)', '⚡ Cabut charger HP setelah selesai digunakan', '⚡ Gunakan sarung tangan karet saat bekerja dengan listrik'],
      'Chemical': ['🧪 Simpan bahan kimia di tempat yang sesuai dengan labelnya', '🧪 Gunakan APD lengkap saat menangani bahan kimia berbahaya', '🧪 Pastikan ventilasi ruangan berjalan dengan baik', '🧪 Baca MSDS sebelum menggunakan bahan kimia baru'],
      'Fall Protection': ['🪜 Periksa tangga sebelum digunakan, pastikan tidak licin atau rusak', '🪜 Gunakan safety harness saat bekerja di ketinggian >1.8 meter', '🪜 Jangan berdiri di kursi atau meja sebagai pengganti tangga', '🪜 Bersihkan tumpahan cairan segera untuk mencegah terpeleset'],
      'General': ['⚠️ Selalu gunakan APD yang sesuai dengan area kerja Anda', '⚠️ Jaga kebersihan area kerja untuk mencegah kecelakaan', '⚠️ Laporkan setiap near miss atau kondisi berbahaya', '⚠️ Istirahat yang cukup untuk menjaga konsentrasi saat bekerja', '⚠️ Jangan menggunakan HP saat mengoperasikan mesin', '⚠️ Safety is not a choice, it is a lifestyle']
    };
    const tipList = safetyTips[category] || safetyTips.General;
    const randomTip = tipList[Math.floor(Math.random() * tipList.length)];
    const aiTip = new AISafetyTip({ tip: randomTip, category: category || 'General' });
    await aiTip.save();
    res.json({ tip: randomTip, category: category || 'General' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/safety-moments/seed', async (req, res) => {
  const defaultMoments = [
    { title: 'Gunakan APD dengan Benar', message: 'Pastikan helm safety, sepatu safety, dan rompi reflektif selalu digunakan saat berada di area proyek. Keselamatan dimulai dari diri sendiri!', category: 'General', severity: 'High', tags: ['APD', 'Safety'] },
    { title: 'Kebakaran - Siap Siaga', message: 'Kenali lokasi APAR terdekat dan jalur evakuasi. Simulasi kebakaran rutin meningkatkan kesiapsiagaan 80% lebih efektif.', category: 'Fire Safety', severity: 'Critical', tags: ['Fire', 'Emergency'] },
    { title: 'Bahaya Listrik', message: 'Jangan menyentuh panel listrik dengan tangan basah. Selalu gunakan alat pelindung dan pastikan instalasi listrik sesuai standar.', category: 'Electrical', severity: 'High', tags: ['Electrical', 'Safety'] },
    { title: 'Working at Height', message: 'Gunakan full body harness dan lanyard saat bekerja di ketinggian. Pastikan anchorage point kuat dan sudah diinspeksi.', category: 'Fall Protection', severity: 'Critical', tags: ['Height', 'Safety'] },
    { title: 'Chemical Safety', message: 'Simpan bahan kimia di tempat yang aman dan berlabel. Gunakan MSDS sebagai panduan penanganan.', category: 'Chemical', severity: 'High', tags: ['Chemical', 'Hazardous'] },
    { title: '5 Langkah Safety Sebelum Bekerja', message: '1. STOP - Berhenti sejenak, 2. THINK - Pikirkan risiko, 3. CHECK - Periksa area dan alat, 4. PLAN - Rencanakan pekerjaan, 5. GO - Lakukan dengan safety', category: 'General', severity: 'Medium', tags: ['Procedure'] }
  ];
  try {
    await SafetyMoment.deleteMany({});
    const inserted = await SafetyMoment.insertMany(defaultMoments);
    res.json({ message: 'Seed berhasil', count: inserted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT SECTORS & HAZARDS ====================
const Sector = require('./models/Sector');
const HazardReport = require('./models/HazardReport');
const LocationHazard = require('./models/LocationHazard');

app.get('/api/sectors', async (req, res) => {
  try {
    const sectors = await Sector.find({ isActive: true }).sort({ riskLevel: -1 });
    res.json(sectors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sectors/:id', async (req, res) => {
  try {
    const sector = await Sector.findOne({ id: req.params.id });
    if (!sector) return res.status(404).json({ error: 'Sector not found' });
    res.json(sector);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sector-locations/:sectorId', async (req, res) => {
  try {
    const sector = await Sector.findOne({ id: req.params.sectorId });
    if (!sector) return res.status(404).json({ error: 'Sector not found' });
    res.json(sector.locations || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hazard-reports', async (req, res) => {
  try {
    const report = new HazardReport(req.body);
    const saved = await report.save();
    if (saved.coordinates?.lat && saved.coordinates?.lng) {
      await LocationHazard.findOneAndUpdate(
        { sectorId: saved.sectorId, 'coordinates.lat': saved.coordinates.lat },
        { 
          $push: { hazards: { name: saved.hazardType, level: saved.severity, description: saved.description } },
          riskScore: { $inc: 5 },
          status: saved.severity === 'Critical' ? 'Danger' : saved.severity === 'High' ? 'Warning' : 'Caution',
          updatedAt: new Date()
        },
        { upsert: true }
      );
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/hazard-reports', async (req, res) => {
  try {
    const { sectorId, limit = 50 } = req.query;
    let filter = {};
    if (sectorId) filter.sectorId = sectorId;
    const reports = await HazardReport.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai-detect-hazard', async (req, res) => {
  try {
    const { imageBase64, location } = req.body;
    const commonHazards = [
      { name: 'No APD', confidence: 85, apd: ['Helm', 'Safety Shoes', 'Rompi'] },
      { name: 'Kabel terbuka', confidence: 78, apd: ['Safety Shoes', 'Sarung Tangan'] },
      { name: 'Area licin', confidence: 72, apd: ['Safety Shoes Anti Slip'] },
      { name: 'Ketinggian tanpa safety', confidence: 68, apd: ['Full Body Harness', 'Lanyard'] },
      { name: 'Material menumpuk', confidence: 65, apd: ['Safety Shoes', 'Helm'] },
      { name: 'Api terbuka', confidence: 60, apd: ['APAR', 'Sarung Tahan Api'] }
    ];
    const randomHazard = commonHazards[Math.floor(Math.random() * commonHazards.length)];
    res.json({
      success: true,
      detected: randomHazard,
      recommendation: `⚠️ Terdeteksi: ${randomHazard.name}. Gunakan ${randomHazard.apd.join(', ')}. Segera laporkan ke safety officer.`,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/location-hazards', async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    if (!lat || !lng) {
      const hazards = await LocationHazard.find({ isActive: true }).sort({ riskScore: -1 }).limit(10);
      return res.json(hazards);
    }
    const hazards = await LocationHazard.find({ isActive: true });
    const nearbyHazards = hazards.filter(h => {
      if (!h.coordinates?.lat) return false;
      const distance = Math.sqrt(Math.pow(h.coordinates.lat - parseFloat(lat), 2) + Math.pow(h.coordinates.lng - parseFloat(lng), 2)) * 111000;
      return distance <= parseFloat(radius);
    });
    res.json(nearbyHazards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sector-stats', async (req, res) => {
  try {
    const sectors = await Sector.find();
    const reports = await HazardReport.find();
    const stats = sectors.map(sector => {
      const sectorReports = reports.filter(r => r.sectorId === sector._id.toString());
      return {
        sectorId: sector.id,
        sectorName: sector.name,
        totalReports: sectorReports.length,
        criticalReports: sectorReports.filter(r => r.severity === 'Critical').length,
        openReports: sectorReports.filter(r => r.status === 'Open').length,
        riskScore: sector.riskLevel === 'Very High' ? 85 : sector.riskLevel === 'High' ? 65 : 40,
        topHazards: [...new Set(sectorReports.map(r => r.hazardType))].slice(0, 3)
      };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sectors/seed', async (req, res) => {
  const defaultSectors = [
    {
      id: 'construction', name: 'Konstruksi', icon: '🏗️', iconType: 'construction', riskLevel: 'Very High', color: 'from-red-500 to-red-600',
      stats: { fatalities: '30%', injuries: '25%', workers: '110 Juta', ltiRate: 2.5, fatalityRate: 12.5 },
      hazards: [
        { name: 'Jatuh dari ketinggian', level: 'Critical', description: 'Pekerjaan di scaffolding, atap, atau struktur tinggi tanpa pengaman', icon: '📉' },
        { name: 'Tertimpa benda berat', level: 'High', description: 'Material bangunan, peralatan, atau struktur yang jatuh', icon: '📦' }
      ],
      controls: [
        { name: 'Penggunaan APD lengkap', steps: ['Helm', 'Safety Shoes', 'Rompi', 'Kacamata'], apdRequired: ['Helm', 'Safety Shoes'], priority: 'High' }
      ],
      locations: [
        { name: 'Area Scaffolding A', coordinates: { lat: -6.200000, lng: 106.816666 }, hazardLevel: 'High', hazards: ['Jatuh', 'Material Jatuh'] }
      ]
    },
    {
      id: 'mining', name: 'Pertambangan', icon: '⛏️', iconType: 'mining', riskLevel: 'Very High', color: 'from-orange-500 to-orange-600',
      stats: { fatalities: '15%', injuries: '20%', workers: '45 Juta', ltiRate: 3.2, fatalityRate: 15.8 },
      hazards: [
        { name: 'Ledakan gas/debu batubara', level: 'Critical', description: 'Metana atau debu batubara yang terkumpul dan terbakar', icon: '💥' },
        { name: 'Runtuhan tambang', level: 'Critical', description: 'Keruntuhan atap atau dinding tambang bawah tanah', icon: '🏔️' }
      ],
      controls: [
        { name: 'Sistem ventilasi dan monitoring gas', steps: ['Install sensor gas', 'Kalibrasi rutin', 'Alert system'], apdRequired: ['Gas Detector'], priority: 'High' }
      ],
      locations: [
        { name: 'Area Penambangan Barat', coordinates: { lat: -6.202000, lng: 106.814000 }, hazardLevel: 'Critical', hazards: ['Ledakan', 'Runtuhan'] }
      ]
    },
    {
      id: 'manufacturing', name: 'Manufaktur', icon: '🏭', iconType: 'factory', riskLevel: 'High', color: 'from-blue-500 to-blue-600',
      stats: { fatalities: '10%', injuries: '22%', workers: '460 Juta', ltiRate: 1.8, fatalityRate: 5.2 },
      hazards: [
        { name: 'Mesin bergerak', level: 'High', description: 'Bagian mesin yang berputar, bergerak, atau berputar', icon: '⚙️' },
        { name: 'Noise', level: 'High', description: 'Kebisingan dari proses produksi mekanis', icon: '🔊' }
      ],
      controls: [
        { name: 'Pengaman mesin (guard)', steps: ['Instalasi safety guard', 'Interlock system'], apdRequired: [], priority: 'High' }
      ],
      locations: [
        { name: 'Area Produksi', coordinates: { lat: -6.198000, lng: 106.816000 }, hazardLevel: 'High', hazards: ['Mesin', 'Noise'] }
      ]
    },
    {
      id: 'chemical', name: 'Industri Kimia', icon: '⚗️', iconType: 'flask', riskLevel: 'High', color: 'from-purple-500 to-purple-600',
      stats: { fatalities: '8%', injuries: '12%', workers: '20 Juta', ltiRate: 1.5, fatalityRate: 4.8 },
      hazards: [
        { name: 'Keracunan kimia', level: 'Critical', description: 'Paparan bahan kimia beracun melalui inhalasi, kulit, atau mata', icon: '☠️' },
        { name: 'Ledakan/kebakaran', level: 'Critical', description: 'Bahan kimia mudah terbakar atau reaktif', icon: '💥' }
      ],
      controls: [
        { name: 'Ventilasi dan enclosure', steps: ['Local exhaust ventilation', 'Fume hood'], apdRequired: ['Respirator'], priority: 'High' }
      ],
      locations: [
        { name: 'Area Penyimpanan B3', coordinates: { lat: -6.197000, lng: 106.815000 }, hazardLevel: 'Critical', hazards: ['Kebakaran', 'Keracunan'] }
      ]
    }
  ];
  try {
    await Sector.deleteMany({});
    const inserted = await Sector.insertMany(defaultSectors);
    res.json({ message: 'Seed berhasil', count: inserted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT USER MANAGEMENT ====================
// ✅ User sudah didefinisikan di bagian ENDPOINT USER (baris 210)
// Jangan require ulang!
const UserActivityLog = require('./models/UserActivityLog');
const UserSession = require('./models/UserSession');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jsms_hsse_secret_key_2024';

// Middleware untuk authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await UserSession.findOne({ token, isActive: true });
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware untuk role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// GET all users (Admin only)
app.get('/api/users', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { search, role, status, limit = 50, page = 1 } = req.query;
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select('-password');
    const total = await User.countDocuments(filter);
    res.json({ users, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user statistics
app.get('/api/user-stats', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const inactiveUsers = await User.countDocuments({ status: 'Inactive' });
    const suspendedUsers = await User.countDocuments({ status: 'Suspended' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActive = await UserSession.countDocuments({ lastActivity: { $gte: today }, isActive: true });
    const roleStats = {};
    const roles = ['Admin', 'Supervisor', 'Karyawan', 'Manager', 'HSE Officer'];
    for (const role of roles) {
      roleStats[role] = await User.countDocuments({ role });
    }
    const recentLogins = await UserActivityLog.aggregate([
      { $match: { action: 'login', status: 'success' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    res.json({ totalUsers, activeUsers, inactiveUsers, suspendedUsers, todayActive, roleStats, recentLogins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
app.post('/api/users', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { id, name, username, email, password, role, department, position, phoneNumber } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      id: id || `USER-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      name, username, email, password: hashedPassword, role: role || 'Karyawan',
      department, position, phoneNumber, createdBy: req.userId, createdAt: new Date(), updatedAt: new Date()
    });
    const saved = await newUser.save();
    await UserActivityLog.create({
      userId: req.userId, userName: req.userName, action: 'create', module: 'User',
      description: `Created user: ${name} (${username})`, ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    const { password: _, ...userWithoutPassword } = saved.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { name, email, role, status, department, position, phoneNumber, password } = req.body;
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.userRole !== 'Admin' && req.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const updateData = {
      name: name || user.name, email: email || user.email,
      department: department || user.department, position: position || user.position,
      phoneNumber: phoneNumber || user.phoneNumber, updatedBy: req.userId, updatedAt: new Date()
    };
    if (req.userRole === 'Admin') {
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updated = await User.findOneAndUpdate({ id: req.params.id }, updateData, { new: true }).select('-password');
    await UserActivityLog.create({
      userId: req.userId, userName: req.userName, action: 'update', module: 'User',
      description: `Updated user: ${user.name}`, ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
app.delete('/api/users/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.findOneAndDelete({ id: req.params.id });
    await UserSession.deleteMany({ userId: req.params.id });
    await UserActivityLog.create({
      userId: req.userId, userName: req.userName, action: 'delete', module: 'User',
      description: `Deleted user: ${user.name} (${user.username})`, ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await UserActivityLog.create({
        userId: user.id, userName: user.name, action: 'login', module: 'User',
        description: `Failed login attempt for ${username}`, status: 'failed',
        ipAddress: req.ip, userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (user.status !== 'Active') {
      return res.status(401).json({ error: 'Account is not active' });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    await UserSession.create({
      userId: user.id, token, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      loginAt: new Date(), lastActivity: new Date(), isActive: true
    });
    await User.findOneAndUpdate({ id: user.id }, { lastLogin: new Date(), lastLoginIp: req.ip });
    await UserActivityLog.create({
      userId: user.id, userName: user.name, action: 'login', module: 'User',
      description: `User ${username} logged in`, ipAddress: req.ip, userAgent: req.headers['user-agent'], status: 'success'
    });
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST logout
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await UserSession.findOneAndUpdate({ token }, { isActive: false, logoutAt: new Date() });
    await UserActivityLog.create({
      userId: req.userId, userName: req.userName, action: 'logout', module: 'User',
      description: 'User logged out', ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user activity logs
app.get('/api/user-activity-logs', authenticate, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { userId, action, module, limit = 100, page = 1 } = req.query;
    let filter = {};
    if (userId) filter.userId = userId;
    if (action && action !== 'all') filter.action = action;
    if (module && module !== 'all') filter.module = module;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await UserActivityLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit));
    const total = await UserActivityLog.countDocuments(filter);
    res.json({ logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET current session info
app.get('/api/auth/session', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const session = await UserSession.findOne({ token });
    const user = await User.findOne({ id: req.userId }).select('-password');
    res.json({ user, session: { loginAt: session?.loginAt, lastActivity: session?.lastActivity, ipAddress: session?.ipAddress } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST AI role suggestion
app.post('/api/ai/role-suggestion', async (req, res) => {
  try {
    const { name, department, position, experience, skills } = req.body;
    const suggestions = {
      'Produksi': ['Supervisor', 'Manager'], 'HSE': ['HSE Officer', 'Supervisor'],
      'HRD': ['Admin', 'Manager'], 'Teknik': ['Supervisor', 'Karyawan'], 'Logistik': ['Karyawan', 'Supervisor']
    };
    const suggestedRoles = suggestions[department] || ['Karyawan'];
    const primarySuggestion = suggestedRoles[0];
    const reasons = [];
    if (department === 'HSE') reasons.push('Department HSE membutuhkan akses penuh ke fitur safety');
    if (position?.toLowerCase().includes('kepala') || position?.toLowerCase().includes('head')) {
      reasons.push('Posisi kepala/memimpin cocok untuk role Manager/Supervisor');
    }
    res.json({ suggestion: primarySuggestion, alternatives: suggestedRoles, reasons: reasons.length ? reasons : ['Berdasarkan departemen dan posisi yang diinput'], confidence: 85 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEED admin user
app.post('/api/users/seed-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', admin: existingAdmin });
    }
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      id: 'ADMIN-001', name: 'System Administrator', username: 'admin',
      email: 'admin@jsms.com', password: hashedPassword, role: 'Admin',
      status: 'Active', department: 'HSE', position: 'System Administrator',
      joinDate: new Date(), createdAt: new Date()
    });
    await admin.save();
    res.json({ message: 'Admin user created', admin: { id: admin.id, name: admin.name, username: admin.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT VISION ZERO ====================
const VisionRule = require('./models/VisionZeroContent');
const VisionCommitment = require('./models/VisionZeroCommitment');
const VisionQuiz = require('./models/VisionZeroQuiz');
const VisionProgress = require('./models/VisionZeroUserProgress');

app.get('/api/vision/rules', async (req, res) => {
  try {
    const rules = await VisionRule.find({ isActive: true }).sort({ order: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/rules/:id', async (req, res) => {
  try {
    const rule = await VisionRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/commitments', async (req, res) => {
  try {
    const commitments = await VisionCommitment.find({ isActive: true });
    res.json(commitments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/quizzes', async (req, res) => {
  try {
    const quizzes = await VisionQuiz.find({ isActive: true });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/quizzes/:id', async (req, res) => {
  try {
    const quiz = await VisionQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vision/quizzes/:id/submit', async (req, res) => {
  try {
    const { userId, userName, answers, timeSpent } = req.body;
    const quiz = await VisionQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    let correctCount = 0;
    const evaluatedAnswers = answers.map((ans, idx) => {
      const isCorrect = ans === quiz.questions[idx].correctAnswer;
      if (isCorrect) correctCount++;
      return { questionIndex: idx, selectedAnswer: ans, isCorrect };
    });
    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;
    let progress = await VisionProgress.findOne({ userId });
    if (!progress) {
      progress = new VisionProgress({ userId, userName, completedQuizzes: [], earnedBadges: [] });
    }
    progress.completedQuizzes.push({ quizId: quiz._id, score, passed, answers: evaluatedAnswers, timeSpent, completedAt: new Date() });
    const totalQuizScore = progress.completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    progress.safetyScore = Math.min(100, totalQuizScore / (progress.completedQuizzes.length * 10));
    const badgesToAdd = [];
    if (score === 100 && !progress.earnedBadges.some(b => b.badgeId === 'perfect-score')) {
      badgesToAdd.push({ badgeId: 'perfect-score', name: 'Perfect Score', icon: '🏆', description: 'Got 100% on a quiz' });
    }
    if (progress.completedQuizzes.length >= 3 && !progress.earnedBadges.some(b => b.badgeId === 'quiz-master')) {
      badgesToAdd.push({ badgeId: 'quiz-master', name: 'Quiz Master', icon: '🎓', description: 'Completed 3 quizzes' });
    }
    if (passed && !progress.earnedBadges.some(b => b.badgeId === 'safety-aware')) {
      badgesToAdd.push({ badgeId: 'safety-aware', name: 'Safety Aware', icon: '🛡️', description: 'Passed a Vision Zero quiz' });
    }
    progress.earnedBadges.push(...badgesToAdd);
    progress.lastActivityDate = new Date();
    progress.updatedAt = new Date();
    await progress.save();
    res.json({ score, passed, correctCount, totalQuestions: quiz.questions.length, badgesEarned: badgesToAdd, safetyScore: progress.safetyScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vision/rules/:id/view', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const rule = await VisionRule.findById(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    let progress = await VisionProgress.findOne({ userId });
    if (!progress) {
      progress = new VisionProgress({ userId, userName, viewedRules: [], completedQuizzes: [], earnedBadges: [] });
    }
    const alreadyViewed = progress.viewedRules.some(v => v.ruleId.toString() === req.params.id);
    if (!alreadyViewed) {
      progress.viewedRules.push({ ruleId: rule._id, viewedAt: new Date() });
      const today = new Date().toDateString();
      const lastActivity = progress.lastActivityDate ? new Date(progress.lastActivityDate).toDateString() : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActivity === yesterday.toDateString()) {
        progress.dailyStreak += 1;
      } else if (lastActivity !== today) {
        progress.dailyStreak = 1;
      }
      if (progress.dailyStreak >= 7 && !progress.earnedBadges.some(b => b.badgeId === '7-day-streak')) {
        progress.earnedBadges.push({ badgeId: '7-day-streak', name: '7 Day Streak', icon: '🔥', description: 'Learned safety for 7 days in a row' });
      }
      if (progress.dailyStreak >= 30 && !progress.earnedBadges.some(b => b.badgeId === 'safety-champion')) {
        progress.earnedBadges.push({ badgeId: 'safety-champion', name: 'Safety Champion', icon: '🏅', description: '30 day learning streak!' });
      }
      progress.lastActivityDate = new Date();
      await progress.save();
    }
    res.json({ viewed: true, streak: progress.dailyStreak, badgesCount: progress.earnedBadges.length, totalRulesViewed: progress.viewedRules.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/progress/:userId', async (req, res) => {
  try {
    let progress = await VisionProgress.findOne({ userId: req.params.userId });
    if (!progress) {
      progress = { safetyScore: 0, dailyStreak: 0, earnedBadges: [], completedQuizzes: [], viewedRules: [] };
    }
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vision/dashboard-stats', async (req, res) => {
  try {
    const totalRules = await VisionRule.countDocuments({ isActive: true });
    const totalQuizzes = await VisionQuiz.countDocuments({ isActive: true });
    const totalUsers = await VisionProgress.countDocuments();
    const totalQuizAttempts = await VisionProgress.aggregate([{ $project: { quizCount: { $size: '$completedQuizzes' } } }, { $group: { _id: null, total: { $sum: '$quizCount' } } }]);
    const averageScore = await VisionProgress.aggregate([{ $unwind: '$completedQuizzes' }, { $group: { _id: null, avg: { $avg: '$completedQuizzes.score' } } }]);
    const badgeDistribution = await VisionProgress.aggregate([{ $unwind: '$earnedBadges' }, { $group: { _id: '$earnedBadges.name', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]);
    res.json({ totalRules, totalQuizzes, totalUsers, totalQuizAttempts: totalQuizAttempts[0]?.total || 0, averageScore: Math.round(averageScore[0]?.avg || 0), topBadges: badgeDistribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vision/share/:userId', async (req, res) => {
  try {
    const { platform } = req.body;
    let progress = await VisionProgress.findOne({ userId: req.params.userId });
    if (!progress) return res.status(404).json({ error: 'User not found' });
    progress.shareCount += 1;
    if (progress.shareCount >= 3 && !progress.earnedBadges.some(b => b.badgeId === 'safety-advocate')) {
      progress.earnedBadges.push({ badgeId: 'safety-advocate', name: 'Safety Advocate', icon: '📢', description: 'Shared safety content 3 times' });
    }
    await progress.save();
    res.json({ shareCount: progress.shareCount, badgesEarned: progress.earnedBadges.filter(b => b.badgeId === 'safety-advocate') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vision/seed', async (req, res) => {
  const defaultRules = [
    { order: 1, title: 'Kepemimpinan & Komitmen', icon: 'FaBullseye', iconType: 'FaBullseye', longDesc: 'Kepemimpinan yang kuat dan komitmen yang tak terbatas dari semua level manajemen untuk keselamatan dan kesehatan kerja.', shortDesc: 'Komitmen dari pimpinan untuk K3', color: 'from-green-500 to-emerald-500', actions: [{ title: 'Tetapkan kebijakan K3 yang jelas', steps: ['Review kebijakan existing', 'Libatkan stakeholder', 'Sosialisasikan ke semua pekerja'] }, { title: 'Alokasikan sumber daya yang cukup', steps: ['Budget K3', 'APD berkualitas', 'Pelatihan rutin'] }, { title: 'Tunjukkan komitmen melalui tindakan', steps: ['Walk the talk', 'Safety walk', 'Contoh nyata'] }] },
    { order: 2, title: 'Identifikasi Bahaya & Kontrol Risiko', icon: 'FaUsers', iconType: 'FaUsers', longDesc: 'Identifikasi semua bahaya di tempat kerja dan implementasi kontrol risiko yang efektif menggunakan hierarki kontrol.', shortDesc: 'Kenali bahaya dan kendalikan risiko', color: 'from-blue-500 to-indigo-500', actions: [{ title: 'Lakukan risk assessment rutin', steps: ['Identifikasi hazard', 'Analisis risiko', 'Evaluasi kontrol'] }, { title: 'Dokumentasikan semua bahaya', steps: ['Register hazard', 'Update berkala', 'Komunikasikan ke tim'] }] },
    { order: 3, title: 'Kualifikasi & Pelatihan', icon: 'FaLightbulb', iconType: 'FaLightbulb', longDesc: 'Pastikan semua pekerja memiliki kualifikasi dan pelatihan yang memadai untuk melakukan pekerjaan dengan aman.', shortDesc: 'Pastikan pekerja terlatih dan kompeten', color: 'from-yellow-500 to-orange-500', actions: [{ title: 'Assess kompetensi pekerja', steps: ['Skill matrix', 'Identifikasi gap', 'Rencana pengembangan'] }, { title: 'Sediakan pelatihan K3', steps: ['Induksi K3', 'Pelatihan berkala', 'Refresh training'] }] },
    { order: 4, title: 'Kerja Sama & Komunikasi', icon: 'FaHandshake', iconType: 'FaHandshake', longDesc: 'Bangun budaya kerja sama dan komunikasi terbuka antara manajemen dan pekerja tentang isu K3.', shortDesc: 'Komunikasi terbuka tentang K3', color: 'from-purple-500 to-pink-500', actions: [{ title: 'Bentuk komite K3', steps: ['Pilih perwakilan', 'Jadwal meeting', 'Tindak lanjut'] }, { title: 'Adakan safety meeting rutin', steps: ['Toolbox talk', 'Safety briefing', 'Safety campaign'] }] }
  ];
  const defaultCommitments = [
    { title: 'Zero Fatalities', description: 'Tidak ada kematian akibat kecelakaan kerja', icon: '💀', target: '0 fatalities', progress: 85 },
    { title: 'Zero Injuries', description: 'Tidak ada cedera serius di tempat kerja', icon: '🤕', target: '0 LTI', progress: 72 },
    { title: 'Zero Diseases', description: 'Tidak ada penyakit akibat kerja', icon: '🦠', target: '0 occupational disease', progress: 90 },
    { title: 'Zero Harm', description: 'Tidak ada dampak negatif pada lingkungan', icon: '🌱', target: 'Zero environmental incident', progress: 78 }
  ];
  const defaultQuiz = {
    title: 'Vision Zero Awareness Quiz', description: 'Uji pengetahuan Anda tentang Vision Zero dan 7 Golden Rules',
    difficulty: 'Medium', passingScore: 70,
    questions: [
      { question: 'Apa yang dimaksud dengan Vision Zero?', options: ['Filosofi mencapai nol kecelakaan', 'Target 50% pengurangan kecelakaan', 'Program pelatihan K3', 'Sistem pelaporan insiden'], correctAnswer: 0, explanation: 'Vision Zero adalah filosofi global untuk mencapai nol kecelakaan, nol cedera, dan nol penyakit akibat kerja.', points: 10 },
      { question: 'Berapa jumlah Aturan Emas (Golden Rules) Vision Zero?', options: ['5', '6', '7', '8'], correctAnswer: 2, explanation: 'Vision Zero memiliki 7 Aturan Emas yang menjadi panduan implementasi.', points: 10 },
      { question: 'Aturan pertama Vision Zero adalah...', options: ['Pelatihan K3', 'Kepemimpinan & Komitmen', 'Identifikasi bahaya', 'Tanggap darurat'], correctAnswer: 1, explanation: 'Aturan pertama adalah Kepemimpinan & Komitmen dari level manajemen tertinggi.', points: 10 },
      { question: 'Apa prinsip dasar Vision Zero?', options: ['Kecelakaan tidak bisa dicegah', 'Keselamatan hanya tanggung jawab safety officer', 'Semua kecelakaan bisa dicegah', 'Kecelakaan adalah risiko bisnis'], correctAnswer: 2, explanation: 'Prinsip dasar Vision Zero adalah bahwa semua kecelakaan dapat dicegah.', points: 10 },
      { question: 'Apa tujuan utama dari program safety quiz?', options: ['Menguji kemampuan', 'Meningkatkan kesadaran safety', 'Memberi nilai', 'Mencari pekerja terbaik'], correctAnswer: 1, explanation: 'Safety quiz bertujuan meningkatkan kesadaran dan pemahaman tentang K3.', points: 10 }
    ]
  };
  try {
    await VisionRule.deleteMany({});
    await VisionRule.insertMany(defaultRules);
    await VisionCommitment.deleteMany({});
    await VisionCommitment.insertMany(defaultCommitments);
    await VisionQuiz.deleteMany({});
    await VisionQuiz.insertMany([defaultQuiz]);
    res.json({ message: 'Seed berhasil', rules: defaultRules.length, commitments: defaultCommitments.length, quizzes: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ENDPOINT WORKFLOW ====================
const Workflow = require('./models/Workflow');
const WorkflowTemplate = require('./models/WorkflowTemplate');
const WorkflowNotification = require('./models/WorkflowNotification');

const generateWorkflowId = (type) => {
  const prefix = { 'PTW': 'PTW', 'Incident': 'INC', 'Compliance': 'CMP', 'Training': 'TRN', 'APD': 'APD', 'Inspection': 'INSP' };
  return `${prefix[type] || 'WF'}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

app.get('/api/workflows', async (req, res) => {
  try {
    const { status, type, assignedTo, search, limit = 50, page = 1 } = req.query;
    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { workflowId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const workflows = await Workflow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Workflow.countDocuments(filter);
    res.json({ workflows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workflows/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ workflowId: req.params.id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const { type, title, description, priority, createdBy, createdByName, assignedTo, assignedToName, department, location, dueDate } = req.body;
    const template = await WorkflowTemplate.findOne({ type });
    const steps = template?.steps.map(step => ({
      stepId: `step-${Date.now()}-${step.order}`, name: step.name, order: step.order,
      status: step.order === 0 ? 'in_progress' : 'pending',
      assignedTo: step.order === 0 ? assignedTo : null, assignedToName: step.order === 0 ? assignedToName : null
    })) || [];
    const workflow = new Workflow({
      workflowId: generateWorkflowId(type), type, title, description, priority: priority || 'Medium',
      status: 'Pending', currentStep: 0, steps, createdBy, createdByName, assignedTo, assignedToName,
      department, location, dueDate: dueDate ? new Date(dueDate) : null, createdAt: new Date(), updatedAt: new Date()
    });
    const saved = await workflow.save();
    if (assignedTo) {
      await WorkflowNotification.create({
        workflowId: saved.workflowId, userId: assignedTo, userName: assignedToName, type: 'assignment',
        title: 'New Workflow Assigned', message: `You have been assigned to "${title}"`, actionUrl: `/workflows/${saved.workflowId}`
      });
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/workflows/:id/steps/:stepId', async (req, res) => {
  try {
    const { status, notes, attachments } = req.body;
    const workflow = await Workflow.findOne({ workflowId: req.params.id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    const stepIndex = workflow.steps.findIndex(s => s.stepId === req.params.stepId);
    if (stepIndex === -1) return res.status(404).json({ error: 'Step not found' });
    workflow.steps[stepIndex].status = status;
    if (notes) workflow.steps[stepIndex].notes = notes;
    if (attachments) workflow.steps[stepIndex].attachments = attachments;
    if (status === 'completed') {
      workflow.steps[stepIndex].completedAt = new Date();
      if (stepIndex + 1 < workflow.steps.length) {
        workflow.currentStep = stepIndex + 1;
        workflow.steps[stepIndex + 1].status = 'in_progress';
        workflow.steps[stepIndex + 1].startedAt = new Date();
      } else {
        workflow.status = 'Completed';
        workflow.completedAt = new Date();
      }
    } else if (status === 'rejected') {
      workflow.status = 'Rejected';
    }
    workflow.updatedAt = new Date();
    await workflow.save();
    if (workflow.assignedTo) {
      await WorkflowNotification.create({
        workflowId: workflow.workflowId, userId: workflow.assignedTo, userName: workflow.assignedToName,
        type: 'status_change', title: `Workflow Step ${status}`, message: `Step "${workflow.steps[stepIndex].name}" has been ${status}`,
        actionUrl: `/workflows/${workflow.workflowId}`
      });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflows/:id/comments', async (req, res) => {
  try {
    const { userId, userName, comment } = req.body;
    const workflow = await Workflow.findOne({ workflowId: req.params.id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    workflow.comments.push({ userId, userName, comment, createdAt: new Date() });
    workflow.updatedAt = new Date();
    await workflow.save();
    if (workflow.assignedTo && workflow.assignedTo !== userId) {
      await WorkflowNotification.create({
        workflowId: workflow.workflowId, userId: workflow.assignedTo, userName: workflow.assignedToName,
        type: 'comment', title: 'New Comment', message: `${userName} commented on "${workflow.title}"`,
        actionUrl: `/workflows/${workflow.workflowId}`
      });
    }
    res.json(workflow.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflows/:id/approve', async (req, res) => {
  try {
    const { userId, userName, role, comment } = req.body;
    const workflow = await Workflow.findOne({ workflowId: req.params.id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    workflow.approvals.push({ userId, userName, role, status: 'approved', comment, approvedAt: new Date() });
    const allApproved = workflow.approvals.length >= 2 && workflow.approvals.every(a => a.status === 'approved');
    if (allApproved) {
      workflow.status = 'Approved';
    }
    workflow.updatedAt = new Date();
    await workflow.save();
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workflows/stats', async (req, res) => {
  try {
    const total = await Workflow.countDocuments();
    const pending = await Workflow.countDocuments({ status: { $in: ['Draft', 'Pending', 'In Review'] } });
    const approved = await Workflow.countDocuments({ status: 'Approved' });
    const rejected = await Workflow.countDocuments({ status: 'Rejected' });
    const completed = await Workflow.countDocuments({ status: 'Completed' });
    const byType = {};
    const types = ['PTW', 'Incident', 'Compliance', 'Training', 'APD', 'Inspection'];
    for (const type of types) {
      byType[type] = await Workflow.countDocuments({ type });
    }
    const byPriority = {
      Low: await Workflow.countDocuments({ priority: 'Low' }),
      Medium: await Workflow.countDocuments({ priority: 'Medium' }),
      High: await Workflow.countDocuments({ priority: 'High' }),
      Critical: await Workflow.countDocuments({ priority: 'Critical' })
    };
    const avgCompletionTime = await Workflow.aggregate([
      { $match: { status: 'Completed', completedAt: { $exists: true } } },
      { $project: { duration: { $subtract: ['$completedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } }
    ]);
    res.json({ total, pending, approved, rejected, completed, byType, byPriority, avgCompletionTimeMs: avgCompletionTime[0]?.avg || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workflows/notifications/:userId', async (req, res) => {
  try {
    const notifications = await WorkflowNotification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await WorkflowNotification.countDocuments({ userId: req.params.userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/workflows/notifications/:id/read', async (req, res) => {
  try {
    await WorkflowNotification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflows/ai-suggest', async (req, res) => {
  try {
    const { type, priority, department, history } = req.body;
    const suggestions = {
      PTW: { estimatedTime: '2-3 days', requiredApprovals: ['Supervisor', 'HSE Officer', 'Manager'], riskNotes: 'High risk work requires additional JSA' },
      Incident: { estimatedTime: '1-2 days', requiredApprovals: ['Safety Team', 'Manager'], riskNotes: 'Critical incidents require immediate escalation' },
      Compliance: { estimatedTime: '5-7 days', requiredApprovals: ['Compliance Officer', 'Legal', 'Manager'], riskNotes: 'Ensure all documents are complete' }
    };
    const suggestion = suggestions[type] || suggestions.PTW;
    const confidence = priority === 'Critical' ? 95 : priority === 'High' ? 85 : 70;
    res.json({ suggestion, confidence, recommendedAssignee: department === 'HSE' ? 'HSE Officer' : 'Supervisor', estimatedCompletion: suggestion.estimatedTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workflows/templates/seed', async (req, res) => {
  const templates = [
    { type: 'PTW', name: 'Permit to Work', description: 'Standard workflow for work permit approval',
      steps: [
        { name: 'Submit Request', order: 0, requiredRole: 'Worker', estimatedDuration: 30, instructions: 'Fill all required fields and attach JSA' },
        { name: 'Supervisor Review', order: 1, requiredRole: 'Supervisor', estimatedDuration: 60, instructions: 'Review work plan and risk assessment' },
        { name: 'HSE Approval', order: 2, requiredRole: 'HSE Officer', estimatedDuration: 30, instructions: 'Verify safety controls are in place' },
        { name: 'Manager Approval', order: 3, requiredRole: 'Manager', estimatedDuration: 30, instructions: 'Final approval for high risk work' },
        { name: 'Work Execution', order: 4, requiredRole: 'Worker', estimatedDuration: 0, instructions: 'Execute work as per permit' },
        { name: 'Close Permit', order: 5, requiredRole: 'Supervisor', estimatedDuration: 15, instructions: 'Verify work completion and close permit' }
      ],
      defaultApprovers: [{ role: 'Supervisor', order: 1 }, { role: 'HSE Officer', order: 2 }, { role: 'Manager', order: 3 }]
    },
    { type: 'Incident', name: 'Incident Report', description: 'Workflow for reporting and investigating incidents',
      steps: [
        { name: 'Report Incident', order: 0, requiredRole: 'Worker', estimatedDuration: 15, instructions: 'Report incident details immediately' },
        { name: 'Initial Assessment', order: 1, requiredRole: 'Supervisor', estimatedDuration: 60, instructions: 'Assess severity and immediate actions' },
        { name: 'Investigation', order: 2, requiredRole: 'HSE Officer', estimatedDuration: 180, instructions: 'Conduct root cause analysis' },
        { name: 'Review Findings', order: 3, requiredRole: 'Manager', estimatedDuration: 60, instructions: 'Review investigation report' },
        { name: 'Action Plan', order: 4, requiredRole: 'HSE Officer', estimatedDuration: 120, instructions: 'Develop corrective actions' },
        { name: 'Close Incident', order: 5, requiredRole: 'Manager', estimatedDuration: 30, instructions: 'Verify actions completed' }
      ],
      defaultApprovers: [{ role: 'Supervisor', order: 1 }, { role: 'HSE Officer', order: 2 }, { role: 'Manager', order: 3 }]
    },
    { type: 'Compliance', name: 'Compliance Review', description: 'Workflow for compliance document review',
      steps: [
        { name: 'Submit Documents', order: 0, requiredRole: 'Worker', estimatedDuration: 30, instructions: 'Upload all required documents' },
        { name: 'Initial Review', order: 1, requiredRole: 'Compliance Officer', estimatedDuration: 120, instructions: 'Verify document completeness' },
        { name: 'Technical Review', order: 2, requiredRole: 'Technical Expert', estimatedDuration: 240, instructions: 'Technical assessment' },
        { name: 'Legal Review', order: 3, requiredRole: 'Legal', estimatedDuration: 180, instructions: 'Legal compliance check' },
        { name: 'Final Approval', order: 4, requiredRole: 'Manager', estimatedDuration: 60, instructions: 'Final sign-off' }
      ],
      defaultApprovers: [{ role: 'Compliance Officer', order: 1 }, { role: 'Legal', order: 2 }, { role: 'Manager', order: 3 }]
    }
  ];
  try {
    await WorkflowTemplate.deleteMany({});
    await WorkflowTemplate.insertMany(templates);
    res.json({ message: 'Templates seeded', count: templates.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const SessionLog = require('./models/SessionLog');
const crypto = require('crypto');

// ==================== ENDPOINT LOGOUT ====================

// POST logout (single device)
app.post('/api/logout', async (req, res) => {
  try {
    const { userId, sessionToken, deviceInfo } = req.body;
    
    // Deactivate session
    if (sessionToken) {
      await UserSession.findOneAndUpdate(
        { sessionToken, isActive: true },
        { isActive: false }
      );
    }
    
    // Log logout activity
    await SessionLog.create({
      userId,
      action: 'logout',
      deviceInfo
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST logout from all devices
app.post('/api/logout-all', async (req, res) => {
  try {
    const { userId, deviceInfo } = req.body;
    
    // Deactivate all sessions for this user
    await UserSession.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );
    
    // Log force logout activity
    await SessionLog.create({
      userId,
      action: 'force_logout',
      deviceInfo
    });
    
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record session (for tracking)
app.post('/api/session', async (req, res) => {
  try {
    const { userId, sessionToken, deviceInfo } = req.body;
    
    // Check if session exists and is active
    const session = await UserSession.findOne({ sessionToken, isActive: true });
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    
    // Update last activity
    session.lastActivity = new Date();
    await session.save();
    
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create session (after login)
app.post('/api/session/create', async (req, res) => {
  try {
    const { userId, deviceInfo } = req.body;
    const sessionToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Deactivate old sessions for this device (optional)
    await UserSession.updateMany(
      { userId, deviceId: deviceInfo?.deviceId, isActive: true },
      { isActive: false }
    );
    
    const newSession = await UserSession.create({
      userId,
      sessionToken,
      deviceId: deviceInfo?.deviceId,
      deviceName: deviceInfo?.deviceName,
      expiresAt,
      isActive: true
    });
    
    // Log login
    await SessionLog.create({
      userId,
      action: 'login',
      deviceInfo
    });
    
    res.json({ sessionToken, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user sessions (for admin)
app.get('/api/user-sessions/:userId', async (req, res) => {
  try {
    const sessions = await UserSession.find({ userId: req.params.userId, isActive: true });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET session logs
app.get('/api/session-logs/:userId', async (req, res) => {
  try {
    const logs = await SessionLog.find({ userId: req.params.userId }).sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==================== JALANKAN SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});