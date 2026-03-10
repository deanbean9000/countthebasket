import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('League', leagueSchema);
