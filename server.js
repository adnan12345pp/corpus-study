const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
} else {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || Object.prototype.hasOwnProperty.call(process.env, match[1])) {
        return;
      }

      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else {
        value = value.replace(/\s+#.*$/, '');
      }
      process.env[match[1]] = value;
    });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const inMemoryProgress = {};
let mongoReady = false;

if (MONGO_URI) {
  console.log('Connecting to MongoDB...');
  mongoose.connect(MONGO_URI)
    .then(() => {
      mongoReady = true;
      console.log('Connected to MongoDB');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.log('Falling back to in-memory progress storage.');
    });
} else {
  console.log('MONGO_URI not set. Running with in-memory progress storage.');
}

const progressSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  completed: { type: Boolean, default: false }
});

const Progress = mongoose.model('Progress', progressSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function toProgressMap(records) {
  const progressMap = {};
  records.forEach(record => {
    progressMap[record.itemId] = record.completed;
  });
  return progressMap;
}

app.get('/api/progress', async (req, res) => {
  try {
    if (!mongoReady) {
      res.json(inMemoryProgress);
      return;
    }

    const records = await Progress.find({});
    res.json(toProgressMap(records));
  } catch (err) {
    console.error('Error reading progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { itemId, completed } = req.body;

    if (typeof itemId !== 'string' || itemId.trim() === '') {
      return res.status(400).json({ error: 'itemId is required' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    if (!mongoReady) {
      inMemoryProgress[itemId] = completed;
      return res.json({ success: true });
    }

    await Progress.findOneAndUpdate(
      { itemId },
      { completed },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
