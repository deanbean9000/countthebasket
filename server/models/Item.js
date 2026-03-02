import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  category: { type: String, default: 'General' }
});

export default mongoose.model('Item', itemSchema);