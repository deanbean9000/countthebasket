import express from 'express';
import cors from 'cors';
import { testDbConnection } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  testDbConnection(); 
});