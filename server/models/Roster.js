import mongoose from 'mongoose';

const rosterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  homeTeamName: { type: String, default: 'Home' },
  awayTeamName: { type: String, default: 'Away' },
  players: [{
    name: String,
    number: Number,
    team: { type: String, enum: ['Home', 'Away'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Roster', rosterSchema);
