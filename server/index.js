import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { testDbConnection } from './db.js';



const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // Test database connectivity on startup without crashing the server
  testDbConnection();
});
