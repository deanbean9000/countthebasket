import express from 'express';
import cors from 'cors';
import { testDbConnection } from './db.js';
import Item from './models/Item.js';
import Player from './models/Player.js';
import Roster from './models/Roster.js';

const app = express();
app.use(cors());
app.use(express.json());

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find().sort({ team: 1, number: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update player stats (e.g., adding points)
app.patch('/api/players/:id/score', async (req, res) => {
  const { pointsToAdd } = req.body;
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { $inc: { points: pointsToAdd } }, // $inc increment the value
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add rebounds to a player
app.patch('/api/players/:id/rebound', async (req, res) => {
  const { type } = req.body; // 'offensive' or 'defensive'
  try {
    const updateField = type === 'offensive' ? 'offensiveRebounds' : 'defensiveRebounds';
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { 
          rebounds: 1,
          [updateField]: 1
        } 
      },
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Reset all player stats to 0
app.post('/api/players/reset', async (req, res) => {
  try {
    await Player.updateMany(
      {},
      { 
        $set: { 
          points: 0, 
          rebounds: 0, 
          offensiveRebounds: 0, 
          defensiveRebounds: 0 
        } 
      }
    );
    const players = await Player.find().sort({ team: 1, number: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// This is needed to save the rosters you create in RosterSetup.jsx
app.post('/api/rosters', async (req, res) => {
  try {
    // If you haven't created a Roster model yet, you can use a generic collection 
    // or I can help you define the Roster Schema.
    console.log("Roster data received:", req.body);
    res.status(201).json({ message: "Roster received by server!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Clear all players and load a new roster
app.post('/api/players/load-roster', async (req, res) => {
  const { players } = req.body;
  try {
    // Clear existing players
    await Player.deleteMany({});
    // Add new players
    const newPlayers = await Player.insertMany(players);
    res.json(newPlayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ROSTER ENDPOINTS
// Get all saved rosters
app.get('/api/rosters', async (req, res) => {
  try {
    const rosters = await Roster.find().sort({ createdAt: -1 });
    res.json(rosters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single roster
app.get('/api/rosters/:id', async (req, res) => {
  try {
    const roster = await Roster.findById(req.params.id);
    res.json(roster);
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

// Save a new roster
app.post('/api/rosters', async (req, res) => {
  console.log('Received roster save request:', req.body);
  const roster = new Roster(req.body);
  try {
    const newRoster = await roster.save();
    console.log('Roster saved successfully:', newRoster._id);
    res.status(201).json(newRoster);
  } catch (err) {
    console.error('Error saving roster:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// Delete a roster
app.delete('/api/rosters/:id', async (req, res) => {
  try {
    await Roster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Roster deleted' });
  } catch (err) {
    res.status(404).json({ message: 'Roster not found' });
  }
});

// This route returns all items in the basket
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3001; // Render will tell the server which port to use
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));