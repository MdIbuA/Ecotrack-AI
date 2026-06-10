import admin from 'firebase-admin';

// In-memory mock database store for local dev fallback
const mockStore = new Map<string, any>();

class MockDocRef {
  constructor(private collectionPath: string, public id: string) {}

  get path() {
    return `${this.collectionPath}/${this.id}`;
  }

  async get() {
    const data = mockStore.get(this.path);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : null),
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    if (options?.merge) {
      const existing = mockStore.get(this.path) || {};
      mockStore.set(this.path, { ...existing, ...data });
    } else {
      mockStore.set(this.path, data);
    }
    return { writeTime: new Date() };
  }

  async update(data: any) {
    const existing = mockStore.get(this.path) || {};
    mockStore.set(this.path, { ...existing, ...data });
    return { writeTime: new Date() };
  }

  async delete() {
    mockStore.delete(this.path);
    return { writeTime: new Date() };
  }
}

class MockQuery {
  constructor(private collectionPath: string, private filters: Array<{ field: string; op: string; val: any }> = []) {}

  where(field: string, op: string, val: any) {
    return new MockQuery(this.collectionPath, [...this.filters, { field, op, val }]);
  }

  async get() {
    const docs: any[] = [];
    const prefix = `${this.collectionPath}/`;
    
    for (const [key, val] of mockStore.entries()) {
      if (key.startsWith(prefix)) {
        const id = key.replace(prefix, '');
        let matches = true;
        
        for (const filter of this.filters) {
          const itemVal = val[filter.field];
          if (filter.op === '==' && itemVal !== filter.val) matches = false;
          if (filter.op === '>=' && itemVal < filter.val) matches = false;
          if (filter.op === '<=' && itemVal > filter.val) matches = false;
        }

        if (matches) {
          docs.push({
            id,
            exists: true,
            data: () => JSON.parse(JSON.stringify(val)),
          });
        }
      }
    }
    return { docs };
  }
}

class MockCollection {
  constructor(private path: string) {}

  doc(id?: string) {
    const docId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocRef(this.path, docId);
  }

  where(field: string, op: string, val: any) {
    return new MockQuery(this.path, [{ field, op, val }]);
  }

  async get() {
    return new MockQuery(this.path).get();
  }
}

class MockFirestore {
  collection(path: string) {
    return new MockCollection(path);
  }
}

let db: any;
let isMockMode = false;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG || process.env.NODE_ENV === 'production') {
  try {
    admin.initializeApp();
    db = admin.firestore();
    console.log('🔥 Real Firebase Admin SDK Initialized Successfully');

    // Run a non-blocking check to verify if the Firestore API is active on the GCP project
    db.collection('_connection_check_').limit(1).get().then(() => {
      console.log('⚡ Firestore Database connection verified successfully.');
    }).catch((err: any) => {
      if (err.message && (err.message.includes('disabled') || err.message.includes('has not been used'))) {
        console.error('\n========================================================================');
        console.error('⚠️  CRITICAL WARNING: Cloud Firestore is not enabled on your Firebase project.');
        console.error('To fix this, please visit the activation URL below and click "Create Database":');
        console.error('👉 https://console.firebase.google.com/project/ecotrack-ai-56ab0/firestore');
        console.error('\nOr, if you wish to run in offline developer mode, comment out');
        console.error('GOOGLE_APPLICATION_CREDENTIALS in your server/.env file.');
        console.error('========================================================================\n');
      } else {
        console.warn('⚠️  Firestore startup check warning:', err.message || err);
      }
    });

  } catch (error) {
    console.error('⚠️ Failed to initialize Real Firebase. Falling back to Mock Mode.', error);
    db = new MockFirestore();
    isMockMode = true;
  }
} else {
  console.log('🌱 No Firebase Credentials found. Running in MOCK Mode.');
  db = new MockFirestore();
  isMockMode = true;
}

export { db, isMockMode };
export default admin;
