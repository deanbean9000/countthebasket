import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config();

// Use the same DATABASE_URL as your main app
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/countthebasket';

const seedPlayers = [
  // Home Team Players
  { name: 'Alex Johnson', number: 10, team: 'Home', points: 0, rebounds: 0 },
  { name: 'Sam Williams', number: 12, team: 'Home', points: 0, rebounds: 0 },
  { name: 'Jordan Davis', number: 15, team: 'Home', points: 0, rebounds: 0 },
  { name: 'Taylor Brown', number: 20, team: 'Home', points: 0, rebounds: 0 },
  { name: 'Casey Martinez', number: 23, team: 'Home', points: 0, rebounds: 0 },
  
  // Away Team Players
  { name: 'Morgan Garcia', number: 11, team: 'Away', points: 0, rebounds: 0 },
  { name: 'Riley Anderson', number: 13, team: 'Away', points: 0, rebounds: 0 },
  { name: 'Cameron Lee', number: 14, team: 'Away', points: 0, rebounds: 0 },
  { name: 'Drew Thomas', number: 21, team: 'Away', points: 0, rebounds: 0 },
  { name: 'Avery Wilson', number: 24, team: 'Away', points: 0, rebounds: 0 }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing players
    await Player.deleteMany({});
    console.log('🗑️  Cleared existing players');

    // Insert seed players
    const players = await Player.insertMany(seedPlayers);
    console.log(`✅ Successfully seeded ${players.length} players`);
    
    // Display seeded players
    console.log('\n📋 Seeded Players:');
    players.forEach(player => {
      console.log(`   ${player.team} Team - #${player.number} ${player.name}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
