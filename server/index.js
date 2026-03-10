import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { testDbConnection } from './db.js';
import Item from './models/Item.js';
import Player from './models/Player.js';
import Roster from './models/Roster.js';
import League from './models/League.js';

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

const app = express();

// 1. MIDDLEWARE 
app.use(express.json()); // Moved up so all routes can read JSON data

app.use(cors({
  origin: [
    'https://countthebasket.onrender.com',   // Original URL
    'https://countthebasket-1.onrender.com', // THE NEW URL FROM YOUR ERROR
    /\.github\.dev$/,                       // Codespaces
    'http://localhost:5173'                 // Local testing
  ],
  credentials: true
}));

// 2. HEALTH CHECK
app.get('/', (req, res) => {
  res.send('Count The Basket API is running! 🏀');
});

// 3. LEAGUE ROUTES
app.post('/api/leagues/create', async (req, res) => {
  const { name, key } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'League name is required.' });
  }
  if (!key || typeof key !== 'string' || key.length < 4) {
    return res.status(400).json({ message: 'Key must be at least 4 characters.' });
  }
  try {
    const keyHash = hashKey(key);
    const existing = await League.findOne({ keyHash });
    if (existing) {
      return res.status(409).json({ message: 'That key is already taken. Choose a different one.' });
    }
    const league = new League({ name: name.trim(), keyHash });
    const saved = await league.save();
    res.status(201).json({ _id: saved._id, name: saved.name });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/leagues/join', async (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ message: 'Key is required.' });
  }
  try {
    const keyHash = hashKey(key);
    const league = await League.findOne({ keyHash });
    if (!league) return res.status(404).json({ message: 'No league found with that key. Check and try again.' });
    res.json({ _id: league._id, name: league.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. PLAYER ROUTES
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ team: 1, number: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/players/:id/score', async (req, res) => {
  const { pointsToAdd } = req.body;
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $inc: { points: pointsToAdd } },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/players/:id/rebound', async (req, res) => {
  const { type } = req.body;
  try {
    const updateField = type === 'offensive' ? 'offensiveRebounds' : 'defensiveRebounds';
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $inc: { rebounds: 1, [updateField]: 1 } },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/players/reset', async (req, res) => {
  try {
    await Player.updateMany({}, { 
      $set: { points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0 } 
    });
    const players = await Player.find().sort({ team: 1, number: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/players/load-roster', async (req, res) => {
  const { players } = req.body;
  try {
    await Player.deleteMany({});
    const newPlayers = await Player.insertMany(players);
    res.json(newPlayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. ROSTER ROUTES
app.get('/api/rosters', async (req, res) => {
  try {
    const { leagueId } = req.query;
    const filter = leagueId ? { leagueId } : {};
    const rosters = await Roster.find(filter).sort({ createdAt: -1 });
    res.json(rosters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/rosters/:id', async (req, res) => {
  try {
    const roster = await Roster.findById(req.params.id);
    res.json(roster);
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

app.post('/api/rosters', async (req, res) => {
  try {
    const roster = new Roster(req.body);
    const newRoster = await roster.save();
    res.status(201).json(newRoster);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/rosters/:id', async (req, res) => {
  try {
    await Roster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Roster deleted' });
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

// 6. SERVER STARTUP
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await testDbConnection();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Stop the server if DB fails
  }
};

startServer();