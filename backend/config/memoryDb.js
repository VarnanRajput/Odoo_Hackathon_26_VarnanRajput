const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// In-Memory store
let store = {
  users: [],
  departments: [],
  categories: [],
  assets: [],
  allocations: [],
  bookings: [],
  maintenances: [],
  audits: [],
  activitylogs: [],
  notifications: []
};

// Load data if exists
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      if (content.trim()) {
        const loaded = JSON.parse(content);
        store = { ...store, ...loaded };
      }
    }
  } catch (error) {
    console.error('Error loading DB file, starting with empty store:', error);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving DB file:', error);
  }
}

// Load initial database
loadDb();

// Generate unique ID helper
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Helper to evaluate query matching
function matchesQuery(item, query) {
  if (!query) return true;
  for (const key in query) {
    // Basic support for query operators like $or, $ne, $in
    if (key === '$or') {
      if (!Array.isArray(query[key])) continue;
      const matched = query[key].some(subQuery => matchesQuery(item, subQuery));
      if (!matched) return false;
      continue;
    }
    
    const queryValue = query[key];
    const itemValue = item[key];

    if (queryValue && typeof queryValue === 'object' && !Array.isArray(queryValue)) {
      // Operator checks
      if ('$ne' in queryValue) {
        if (itemValue === queryValue.$ne) return false;
      }
      if ('$in' in queryValue) {
        if (!Array.isArray(queryValue.$in)) continue;
        if (!queryValue.$in.includes(itemValue)) return false;
      }
      if ('$nin' in queryValue) {
        if (!Array.isArray(queryValue.$nin)) continue;
        if (queryValue.$nin.includes(itemValue)) return false;
      }
      if ('$gte' in queryValue) {
        if (itemValue < queryValue.$gte) return false;
      }
      if ('$lte' in queryValue) {
        if (itemValue > queryValue.$lte) return false;
      }
      if ('$gt' in queryValue) {
        if (itemValue <= queryValue.$gt) return false;
      }
      if ('$lt' in queryValue) {
        if (itemValue >= queryValue.$lt) return false;
      }
    } else {
      if (itemValue !== queryValue) return false;
    }
  }
  return true;
}

class MockModel {
  constructor(collectionName) {
    this.collection = collectionName.toLowerCase();
    if (!store[this.collection]) {
      store[this.collection] = [];
    }
  }

  async find(query = {}) {
    loadDb();
    let results = store[this.collection].filter(item => matchesQuery(item, query));
    return JSON.parse(JSON.stringify(results));
  }

  async findOne(query = {}) {
    loadDb();
    const results = store[this.collection].find(item => matchesQuery(item, query));
    return results ? JSON.parse(JSON.stringify(results)) : null;
  }

  async findById(id) {
    loadDb();
    const results = store[this.collection].find(item => item._id === id);
    return results ? JSON.parse(JSON.stringify(results)) : null;
  }

  async create(data) {
    loadDb();
    const newItem = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store[this.collection].push(newItem);
    saveDb();
    return JSON.parse(JSON.stringify(newItem));
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    loadDb();
    const index = store[this.collection].findIndex(item => item._id === id);
    if (index === -1) return null;

    const oldItem = store[this.collection][index];
    const updatedItem = {
      ...oldItem,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    store[this.collection][index] = updatedItem;
    saveDb();
    return JSON.parse(JSON.stringify(updatedItem));
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    loadDb();
    const index = store[this.collection].findIndex(item => matchesQuery(item, query));
    if (index === -1) return null;

    const oldItem = store[this.collection][index];
    const updatedItem = {
      ...oldItem,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    store[this.collection][index] = updatedItem;
    saveDb();
    return JSON.parse(JSON.stringify(updatedItem));
  }

  async deleteOne(query) {
    loadDb();
    const index = store[this.collection].findIndex(item => matchesQuery(item, query));
    if (index === -1) return { deletedCount: 0 };

    store[this.collection].splice(index, 1);
    saveDb();
    return { deletedCount: 1 };
  }

  async deleteMany(query) {
    loadDb();
    const originalCount = store[this.collection].length;
    store[this.collection] = store[this.collection].filter(item => !matchesQuery(item, query));
    saveDb();
    return { deletedCount: originalCount - store[this.collection].length };
  }

  async countDocuments(query = {}) {
    loadDb();
    return store[this.collection].filter(item => matchesQuery(item, query)).length;
  }
}

module.exports = {
  MockModel,
  store,
  loadDb,
  saveDb
};
