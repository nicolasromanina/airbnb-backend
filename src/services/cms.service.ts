import fs from 'fs/promises';
import path from 'path';

const STORE_PATH = path.resolve(__dirname, '../../data/cms-store.json');

type Store = {
  pages: Record<string, any>;
  history: Record<string, Array<{ id: number; at: number; data: any }>>;
};

const defaultStore: Store = { pages: {}, history: {} };

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as Store;
  } catch (err) {
    // If file doesn't exist or invalid, return default
    return defaultStore;
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

const cmsService = {
  async loadPage(key: string) {
    const store = await readStore();
    return store.pages[key] ?? null;
  },
  async savePage(key: string, data: any) {
    const store = await readStore();
    store.pages[key] = data;
    const hist = store.history[key] || [];
    const snapshot = { id: Date.now(), at: Date.now(), data };
    hist.unshift(snapshot);
    store.history[key] = hist.slice(0, 100);
    await writeStore(store);
    return snapshot;
  },
  async getHistory(key: string) {
    const store = await readStore();
    return store.history[key] || [];
  },
  async restoreSnapshot(key: string, id: number) {
    const store = await readStore();
    const hist = store.history[key] || [];
    const snap = hist.find(s => s.id === id);
    if (!snap) return null;
    store.pages[key] = snap.data;
    await writeStore(store);
    return snap.data;
  }
};

export default cmsService;
