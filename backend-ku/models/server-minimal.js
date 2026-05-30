const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Koneksi ke MongoDB (pastikan MongoDB nyala)
mongoose.connect('mongodb://localhost:27017/jsms_hsse')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Schema User sederhana
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  name: String
});
const User = mongoose.model('User', UserSchema);

// Seed user default (hanya sekali)
const seedUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    const hashed = await bcrypt.hash('admin', 10);
    await User.create({ username: 'admin', password: hashed, role: 'Admin', name: 'Admin User' });
    console.log('✅ User admin dibuat (admin / admin)');
  }
};
seedUsers();

// Endpoint login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username}`);
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Password salah' });
  const token = jwt.sign({ id: user._id, role: user.role }, 'rahasia');
  res.json({ token, user: { id: user._id, username: user.username, name: user.name, role: user.role } });
});

// Endpoint test
app.get('/api/users', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));