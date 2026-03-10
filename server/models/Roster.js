import mongoose from 'mongoose';

const rosterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  homeTeamName: { type: String, default: 'Home' },
  awayTeamName: { type: String, default: 'Away' },
  leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League', index: true },
  players: [{
    name: String,
    number: Number,
    team: { type: String, enum: ['Home', 'Away'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Roster', rosterSchema);
