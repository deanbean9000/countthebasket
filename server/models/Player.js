import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true },
  team: { type: String, enum: ['Home', 'Away'], required: true },
  points: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  offensiveRebounds: { type: Number, default: 0 },
  defensiveRebounds: { type: Number, default: 0 }
});

export default mongoose.model('Player', playerSchema);