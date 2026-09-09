// InvenTrack API and static-file server. Uses only Node.js built-in modules.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, 'data', 'inventrack.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const seed = {
  suppliers: [
    { id: 's1', name: 'Nova Tech Distributors', contact: 'Arjun Mehta', phone: '+91 98765 43210', email: 'orders@novatech.example', address: 'Bengaluru, Karnataka' },
    { id: 's2', name: 'GreenLeaf Wholesale', contact: 'Priya Nair', phone: '+91 98220 11223', email: 'sales@greenleaf.example', address: 'Kochi, Kerala' },
    { id: 's3', name: 'Metro Office Supplies', contact: 'Rohan Shah', phone: '+91 97654 32109', email: 'hello@metrooffice.example', address: 'Mumbai, Maharashtra' }
  ],
  products: [
    { id: 'p1', name: 'Wireless Keyboard', sku: 'ELEC-001', category: 'Electronics', quantity: 28, reorder: 10, cost: 1250, price: 1899, supplierId: 's1' },
    { id: 'p2', name: 'USB-C Hub 7-in-1', sku: 'ELEC-014', category: 'Electronics', quantity: 7, reorder: 8, cost: 1750, price: 2499, supplierId: 's1' },
    { id: 'p3', name: 'A4 Premium Paper', sku: 'STAT-021', category: 'Stationery', quantity: 64, reorder: 15, cost: 245, price: 349, supplierId: 's3' },
    { id: 'p4', name: 'Ergonomic Office Chair', sku: 'FURN-005', category: 'Furniture', quantity: 4, reorder: 5, cost: 7200, price: 9999, supplierId: 's3' },
    { id: 'p5', name: 'Organic Green Tea', sku: 'PAN-032', category: 'Pantry', quantity: 42, reorder: 12, cost: 180, price: 275, supplierId: 's2' },
    { id: 'p6', name: 'Desk Organizer', sku: 'STAT-044', category: 'Stationery', quantity: 0, reorder: 6, cost: 320, price: 499, supplierId: 's3' }
  ],
  movements: [
    { id: 'm1', productId: 'p1', type: 'in', quantity: 20, balance: 28, reference: 'PO-1042', notes: 'Monthly replenishment', date: '2026-08-20T09:30:00' },
    { id: 'm2', productId: 'p3', type: 'out', quantity: 6, balance: 64, reference: 'SALE-218', notes: 'Customer order', date: '2026-08-19T14:10:00' },
    { id: 'm3', productId: 'p4', type: 'out', quantity: 2, balance: 4, reference: 'SALE-215', notes: 'Corporate order', date: '2026-08-18T11:20:00' },
    { id: 'm4', productId: 'p5', type: 'in', quantity: 24, balance: 42, reference: 'PO-1039', notes: 'Supplier delivery', date: '2026-08-17T16:00:00' }
  ],
  regions: [
    { id: 'r1', city: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.877, sales: 284000, units: 176, status: 'healthy' },
    { id: 'r2', city: 'Bengaluru', country: 'India', latitude: 12.972, longitude: 77.594, sales: 219000, units: 142, status: 'healthy' },
    { id: 'r3', city: 'Delhi', country: 'India', latitude: 28.614, longitude: 77.209, sales: 178000, units: 93, status: 'watch' },
    { id: 'r4', city: 'Dubai', country: 'UAE', latitude: 25.205, longitude: 55.271, sales: 133000, units: 61, status: 'healthy' },
    { id: 'r5', city: 'Singapore', country: 'Singapore', latitude: 1.352, longitude: 103.82, sales: 97000, units: 48, status: 'watch' },
    { id: 'r6', city: 'London', country: 'United Kingdom', latitude: 51.507, longitude: -0.128, sales: 76000, units: 31, status: 'risk' }
  ]
};

const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, contact TEXT, phone TEXT, email TEXT, address TEXT);
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL COLLATE NOCASE UNIQUE, category TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity >= 0), reorder_level INTEGER NOT NULL CHECK(reorder_level >= 0), cost REAL NOT NULL CHECK(cost >= 0), price REAL NOT NULL CHECK(price >= 0), supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL);
  CREATE TABLE IF NOT EXISTS movements (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')), quantity INTEGER NOT NULL CHECK(quantity >= 0), balance INTEGER NOT NULL CHECK(balance >= 0), reference TEXT, notes TEXT, date TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sales_regions (id TEXT PRIMARY KEY, city TEXT NOT NULL, country TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, sales REAL NOT NULL CHECK(sales >= 0), units INTEGER NOT NULL CHECK(units >= 0), status TEXT NOT NULL CHECK(status IN ('healthy', 'watch', 'risk')));`);

function rows() {
  return {
    suppliers: db.prepare('SELECT id, name, contact, phone, email, address FROM suppliers ORDER BY name').all(),
    products: db.prepare('SELECT id, name, sku, category, quantity, reorder_level AS reorder, cost, price, COALESCE(supplier_id, \'\') AS supplierId FROM products ORDER BY rowid DESC').all(),
    movements: db.prepare('SELECT id, product_id AS productId, type, quantity, balance, reference, notes, date FROM movements ORDER BY date DESC').all(),
    regions: db.prepare('SELECT id, city, country, latitude, longitude, sales, units, status FROM sales_regions ORDER BY sales DESC').all()
  };
}
function replaceInventory(payload) {
  if (!payload || !Array.isArray(payload.suppliers) || !Array.isArray(payload.products) || !Array.isArray(payload.movements)) throw new Error('Expected suppliers, products, and movements arrays.');
  const insertSupplier = db.prepare('INSERT INTO suppliers VALUES (?, ?, ?, ?, ?, ?)');
  const insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertMovement = db.prepare('INSERT INTO movements VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertRegion = db.prepare('INSERT INTO sales_regions VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM movements; DELETE FROM products; DELETE FROM suppliers; DELETE FROM sales_regions;');
    for (const s of payload.suppliers) insertSupplier.run(s.id, s.name, s.contact || '', s.phone || '', s.email || '', s.address || '');
    for (const p of payload.products) insertProduct.run(p.id, p.name, p.sku, p.category, p.quantity, p.reorder, p.cost, p.price, p.supplierId || null);
    for (const m of payload.movements) insertMovement.run(m.id, m.productId, m.type, m.quantity, m.balance, m.reference || '', m.notes || '', m.date);
    for (const region of (payload.regions || [])) insertRegion.run(region.id, region.city, region.country, region.latitude, region.longitude, region.sales, region.units, region.status);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
if (!db.prepare('SELECT 1 FROM products LIMIT 1').get()) replaceInventory(seed);
if (!db.prepare('SELECT 1 FROM sales_regions LIMIT 1').get()) {
  const insertRegion = db.prepare('INSERT INTO sales_regions VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const region of seed.regions) insertRegion.run(region.id, region.city, region.country, region.latitude, region.longitude, region.sales, region.units, region.status);
}

function send(res, code, body, type = 'application/json') { res.writeHead(code, { 'Content-Type': `${type}; charset=utf-8` }); res.end(type === 'application/json' ? JSON.stringify(body) : body); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('Request body is too large.')); }); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Invalid JSON.')); } }); }); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/inventory' && req.method === 'GET') return send(res, 200, rows());
    if (url.pathname === '/api/inventory' && req.method === 'PUT') { replaceInventory(await body(req)); return send(res, 200, rows()); }
    if (url.pathname === '/api/health') return send(res, 200, { status: 'ok' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
    const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.resolve(ROOT, requested);
    if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, req.method === 'HEAD' ? '' : fs.readFileSync(file), mime[path.extname(file)] || 'application/octet-stream');
  } catch (error) { console.error(error); return send(res, 400, { error: error.message || 'Request failed.' }); }
}).listen(PORT, () => console.log(`InvenTrack is running at http://localhost:${PORT}`));
