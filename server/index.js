import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import admin from 'firebase-admin';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { testDbConnection } from './db.js';
import Item from './models/Item.js';
import Player from './models/Player.js';
import Roster from './models/Roster.js';
import League from './models/League.js';
import GameSummary from './models/GameSummary.js';

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// ── Firebase Admin SDK init ───────────────────────────────────────────────────
// Set FIREBASE_SERVICE_ACCOUNT env var to the contents of your serviceAccountKey.json
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: 'countthebasket-28508',
  });
}

const app = express();

// 1. MIDDLEWARE
app.use(helmet()); // Secure HTTP headers

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
}));

app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://countthebasket-28508.web.app',
      'https://countthebasket-28508.firebaseapp.com',
    ];
    // Allow requests with no origin (e.g. curl, Postman) and localhost/Codespaces dev origins
    if (!origin || allowed.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || origin.includes('.app.github.dev')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Auth middleware: verify Firebase ID token ─────────────────────────────────
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }
  const idToken = authHeader.slice(7);
  try {
    req.user = await admin.auth().verifyIdToken(idToken);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
  }
};

// ── Body sanitizer: strip any fields not in the Roster schema ─────────────────
const ALLOWED_ROSTER_FIELDS = new Set(['name', 'homeTeamName', 'awayTeamName', 'leagueId', 'players']);

const sanitizeRosterBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => ALLOWED_ROSTER_FIELDS.has(key))
    );
  }
  next();
};

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
  if (!Number.isInteger(pointsToAdd) || pointsToAdd < 1 || pointsToAdd > 3) {
    return res.status(400).json({ message: 'pointsToAdd must be 1, 2, or 3.' });
  }
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
  if (!['offensive', 'defensive'].includes(type)) {
    return res.status(400).json({ message: 'type must be offensive or defensive.' });
  }
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

app.patch('/api/players/:id/foul', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $inc: { fouls: 1 } },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Undo endpoints — decrement stats, floored at 0 via $max
app.patch('/api/players/:id/undo-score', async (req, res) => {
  const { pointsToRemove } = req.body;
  if (!Number.isInteger(pointsToRemove) || pointsToRemove < 1 || pointsToRemove > 3) {
    return res.status(400).json({ message: 'pointsToRemove must be 1, 2, or 3.' });
  }
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $set: { points: Math.max(0, current.points - pointsToRemove) } },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/players/:id/undo-rebound', async (req, res) => {
  const { type } = req.body;
  if (!['offensive', 'defensive'].includes(type)) {
    return res.status(400).json({ message: 'type must be offensive or defensive.' });
  }
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const subField = type === 'offensive' ? 'offensiveRebounds' : 'defensiveRebounds';
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          rebounds: Math.max(0, current.rebounds - 1),
          [subField]: Math.max(0, current[subField] - 1),
        }
      },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/players/:id/undo-foul', async (req, res) => {
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $set: { fouls: Math.max(0, (current.fouls || 0) - 1) } },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Assists / Steals / Blocks
app.patch('/api/players/:id/assist', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, { $inc: { assists: 1 } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/players/:id/steal', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, { $inc: { steals: 1 } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/players/:id/block', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, { $inc: { blocks: 1 } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/players/:id/undo-assist', async (req, res) => {
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const player = await Player.findByIdAndUpdate(req.params.id, { $set: { assists: Math.max(0, (current.assists || 0) - 1) } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/players/:id/undo-steal', async (req, res) => {
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const player = await Player.findByIdAndUpdate(req.params.id, { $set: { steals: Math.max(0, (current.steals || 0) - 1) } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/players/:id/undo-block', async (req, res) => {
  try {
    const current = await Player.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Player not found.' });
    const player = await Player.findByIdAndUpdate(req.params.id, { $set: { blocks: Math.max(0, (current.blocks || 0) - 1) } }, { new: true });
    res.json(player);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post('/api/players/reset', async (req, res) => {
  try {
    await Player.updateMany({}, { 
      $set: { points: 0, rebounds: 0, offensiveRebounds: 0, defensiveRebounds: 0, fouls: 0, assists: 0, steals: 0, blocks: 0 } 
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

// 5. GAME SUMMARY ROUTES
app.post('/api/game-summaries', async (req, res) => {
  const { leagueId, homeTeamName, awayTeamName, homeScore, awayScore, winner, players } = req.body;
  if (!leagueId) return res.status(400).json({ message: 'leagueId is required.' });
  try {
    const summary = new GameSummary({ leagueId, homeTeamName, awayTeamName, homeScore, awayScore, winner, players });
    const saved = await summary.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/game-summaries', async (req, res) => {
  const { leagueId } = req.query;
  if (!leagueId || !mongoose.Types.ObjectId.isValid(leagueId)) {
    return res.status(400).json({ message: 'leagueId is required and must be a valid ID.' });
  }
  try {
    const summaries = await GameSummary.find({ leagueId }).sort({ playedAt: -1 });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/game-summaries/:id', async (req, res) => {
  try {
    const deleted = await GameSummary.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Game not found.' });
    res.json({ message: 'Game deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. SEASON STATS ROUTE
// Aggregates all GameSummary player entries for a league into per-player season averages.
app.get('/api/season-stats', async (req, res) => {
  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ message: 'leagueId is required.' });

  // Validate leagueId is a proper ObjectId to avoid injection
  if (!/^[0-9a-fA-F]{24}$/.test(leagueId)) {
    return res.status(400).json({ message: 'Invalid leagueId.' });
  }

  try {
    const stats = await GameSummary.aggregate([
      { $match: { leagueId: new mongoose.Types.ObjectId(leagueId) } },
      { $unwind: '$players' },
      {
        $group: {
          _id: { name: '$players.name', number: '$players.number' },
          games:             { $sum: 1 },
          totalPoints:       { $sum: '$players.points' },
          totalRebounds:     { $sum: '$players.rebounds' },
          totalOffRebounds:  { $sum: '$players.offensiveRebounds' },
          totalDefRebounds:  { $sum: '$players.defensiveRebounds' },
          totalFouls:        { $sum: '$players.fouls' },
          totalAssists:      { $sum: '$players.assists' },
          totalSteals:       { $sum: '$players.steals' },
          totalBlocks:       { $sum: '$players.blocks' },
        }
      },
      {
        $project: {
          _id: 0,
          name:   '$_id.name',
          number: '$_id.number',
          games:  1,
          totalPoints:      1,
          totalRebounds:    1,
          totalOffRebounds: 1,
          totalDefRebounds: 1,
          totalFouls:       1,
          totalAssists:     1,
          totalSteals:      1,
          totalBlocks:      1,
          ppg: { $round: [{ $divide: ['$totalPoints',   '$games'] }, 1] },
          rpg: { $round: [{ $divide: ['$totalRebounds', '$games'] }, 1] },
          fpg: { $round: [{ $divide: ['$totalFouls',    '$games'] }, 1] },
          apg: { $round: [{ $divide: ['$totalAssists',  '$games'] }, 1] },
          spg: { $round: [{ $divide: ['$totalSteals',   '$games'] }, 1] },
          bpg: { $round: [{ $divide: ['$totalBlocks',   '$games'] }, 1] },
        }
      },
      { $sort: { ppg: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. ROSTER ROUTES  (protected — requires a valid Firebase ID token)
app.get('/api/rosters', verifyFirebaseToken, async (req, res) => {
  try {
    const { leagueId } = req.query;
    const filter = leagueId ? { leagueId } : {};
    const rosters = await Roster.find(filter).sort({ createdAt: -1 });
    res.json(rosters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/rosters/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const roster = await Roster.findById(req.params.id);
    res.json(roster);
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

app.post('/api/rosters', verifyFirebaseToken, sanitizeRosterBody, async (req, res) => {
  try {
    const roster = new Roster(req.body);
    const newRoster = await roster.save();
    res.status(201).json(newRoster);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/rosters/:id', verifyFirebaseToken, async (req, res) => {
  try {
    await Roster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Roster deleted' });
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

// 8. SERVER STARTUP
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