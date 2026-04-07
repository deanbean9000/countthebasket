import mongoose from 'mongoose';

const playerStatSchema = new mongoose.Schema({
  name: String,
  number: Number,
  team: { type: String, enum: ['Home', 'Away'] },
  points: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  offensiveRebounds: { type: Number, default: 0 },
  defensiveRebounds: { type: Number, default: 0 },
  fouls: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  steals: { type: Number, default: 0 },
  blocks: { type: Number, default: 0 }
}, { _id: false });

const gameSummarySchema = new mongoose.Schema({
  leagueId: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true, index: true },
  homeTeamName: { type: String, default: 'Home' },
  awayTeamName: { type: String, default: 'Away' },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  winner: { type: String, default: null },
  players: [playerStatSchema],
  playedAt: { type: Date, default: Date.now }
});

export default mongoose.model('GameSummary', gameSummarySchema);
