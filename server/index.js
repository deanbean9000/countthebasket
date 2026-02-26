import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDbConnection } from './db.js'; // <--- ADD THIS LINE

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  testDbConnection(); // This will now work!
});