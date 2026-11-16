import { query, pool } from './db.js';

export async function handleApiRequest(req, res, pathname, searchParams) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Helper to parse JSON body
  const getBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });

  try {
    // 1. Health check & DB Migration Trigger
    if (pathname === '/api/v1/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', db: !!pool }));
      return true;
    }

    if (pathname === '/api/v1/db/migrate' || pathname === '/api/v1/admin/seed') {
      const { initDatabase } = await import('./db.js');
      const migrated = await initDatabase(true);
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', migrated }));
      return true;
    }

    // 2. Auth - Me
    if (pathname === '/api/v1/me') {
      if (pool) {
        const u = await query('SELECT id, name, email, role, is_owner, username FROM public.users WHERE is_owner = true LIMIT 1');
        const user = u.rows[0] || { id: 1, name: 'Admin', email: 'admin@jewellery.com', role: 'admin', isOwner: true };
        res.writeHead(200);
        res.end(JSON.stringify({
          user: { ...user, isOwner: true, permissions: ['*'] },
          license: { active: true, validUntil: '2027-12-31', blocked: false }
        }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({
          user: { id: 1, name: 'Admin', email: 'admin@jewellery.com', role: 'admin', isOwner: true, permissions: ['*'] },
          license: { active: true, validUntil: '2027-12-31', blocked: false }
        }));
      }
      return true;
    }

    // 3. Auth - Login
    if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
      const { email, password } = await getBody();
      if (pool) {
        const userRes = await query('SELECT id, name, email, role, is_owner, must_change_password FROM public.users WHERE email = $1 OR username = $1 LIMIT 1', [email]);
        const user = userRes.rows[0] || { id: 1, name: 'Admin', email: email || 'admin@jewellery.com', role: 'admin', is_owner: true };
        res.writeHead(200);
        res.end(JSON.stringify({
          data: {
            token: 'jwt_token_' + Date.now(),
            user: { ...user, isOwner: !!user.is_owner, permissions: ['*'] }
          }
        }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({
          data: {
            token: 'mock_jwt_token',
            user: { id: 1, name: 'Admin', email: email || 'admin@jewellery.com', role: 'admin', isOwner: true, permissions: ['*'] }
          }
        }));
      }
      return true;
    }

    // 4. Shop Settings
    if (pathname === '/api/v1/settings') {
      if (req.method === 'GET') {
        if (pool) {
          const s = await query('SELECT * FROM public.shop_settings LIMIT 1');
          res.writeHead(200);
          res.end(JSON.stringify({ data: s.rows[0] || {} }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            data: {
              shop_name: 'S.B Borana Jewellers',
              owner_name: 'Sujal shah',
              city: 'Mumbai',
              state: 'Maharashtra',
              gst_no: '27ACZPJ7126B1ZA',
              currency: 'INR'
            }
          }));
        }
        return true;
      }
    }

    // 5. Daily Metal Rates
    if (pathname === '/api/v1/daily-rates' || pathname === '/api/v1/rates/today') {
      if (req.method === 'GET') {
        if (pool) {
          const r = await query('SELECT * FROM public.daily_rates ORDER BY rate_date DESC LIMIT 1');
          res.writeHead(200);
          res.end(JSON.stringify({ data: r.rows[0] || { gold_24k: 150000, gold_22k: 137400, gold_18k: 112500 } }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            data: { gold_24k: 150000, gold_22k: 137400, gold_18k: 112500, gold_14k: 87750, silver: 92000 }
          }));
        }
        return true;
      }

      if (req.method === 'POST') {
        const body = await getBody();
        if (pool) {
          const insert = await query(`
            INSERT INTO public.daily_rates (rate_date, gold_24k, gold_22k, gold_18k, gold_14k, silver)
            VALUES (CURRENT_DATE, $1, $2, $3, $4, $5)
            RETURNING *;
          `, [body.gold_24k, body.gold_22k, body.gold_18k, body.gold_14k || 0, body.silver || 0]);
          res.writeHead(200);
          res.end(JSON.stringify({ data: insert.rows[0] }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ data: body }));
        }
        return true;
      }
    }

    // 6. Customers List & Create
    if (pathname === '/api/v1/customers') {
      if (req.method === 'GET') {
        const q = searchParams.get('q');
        if (pool) {
          let sql = 'SELECT * FROM public.customers WHERE is_active = true';
          let params = [];
          if (q) {
            sql += ' AND (name ILIKE $1 OR phone ILIKE $1 OR customer_code ILIKE $1)';
            params.push(`%${q}%`);
          }
          sql += ' ORDER BY id DESC LIMIT 100';
          const cust = await query(sql, params);
          res.writeHead(200);
          res.end(JSON.stringify({ data: cust.rows, total: cust.rows.length }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            data: [
              { id: 1, customer_code: 'CUST-00001', name: 'Pakshal', phone: '9876543210', total_purchased: 196532 },
              { id: 2, customer_code: 'CUST-00002', name: 'Vikram Rathore', phone: '9820112233', total_purchased: 367968 }
            ],
            total: 2
          }));
        }
        return true;
      }

      if (req.method === 'POST') {
        const c = await getBody();
        if (pool) {
          const code = `CUST-${Date.now().toString().slice(-5)}`;
          const inserted = await query(`
            INSERT INTO public.customers (customer_code, name, phone, email, pan_no, aadhar_no, city, state, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *;
          `, [code, c.name, c.phone, c.email || null, c.pan_no || null, c.aadhar_no || null, c.city || 'Mumbai', c.state || 'Maharashtra']);
          res.writeHead(201);
          res.end(JSON.stringify({ data: inserted.rows[0] }));
        } else {
          res.writeHead(201);
          res.end(JSON.stringify({ data: { id: Date.now(), customer_code: 'CUST-NEW', ...c } }));
        }
        return true;
      }
    }

    // 7. Inventory Items List & Create
    if (pathname === '/api/v1/inventory/items') {
      if (req.method === 'GET') {
        if (pool) {
          const items = await query('SELECT * FROM public.inventory ORDER BY id DESC LIMIT 100');
          res.writeHead(200);
          res.end(JSON.stringify({ data: items.rows, total: items.rows.length }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            data: [
              { id: 1, item_code: 'ITM-001', name: 'Gold Bridal Choker 22K', metal_type: 'gold', purity: '22K', gross_weight: 48.5, net_weight: 46.2, quantity: 1, status: 'in_stock' },
              { id: 2, item_code: 'ITM-002', name: 'Solitaire Diamond Ring 18K', metal_type: 'diamond', purity: '18K', gross_weight: 4.8, net_weight: 4.2, quantity: 2, status: 'in_stock' }
            ],
            total: 2
          }));
        }
        return true;
      }

      if (req.method === 'POST') {
        const itm = await getBody();
        if (pool) {
          const inserted = await query(`
            INSERT INTO public.inventory (item_code, name, category, metal_type, purity, gross_weight, net_weight, huid, quantity, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_stock')
            RETURNING *;
          `, [itm.item_code, itm.name, itm.category || 'Jewellery', itm.metal_type || 'gold', itm.purity || '22K', itm.gross_weight || 0, itm.net_weight || 0, itm.huid || null, itm.quantity || 1]);
          res.writeHead(201);
          res.end(JSON.stringify({ data: inserted.rows[0] }));
        } else {
          res.writeHead(201);
          res.end(JSON.stringify({ data: { id: Date.now(), ...itm } }));
        }
        return true;
      }
    }

    // 8. Sales Orders / Invoices
    if (pathname === '/api/v1/sales/orders') {
      if (req.method === 'GET') {
        if (pool) {
          const ord = await query('SELECT * FROM public.orders ORDER BY id DESC LIMIT 100');
          res.writeHead(200);
          res.end(JSON.stringify({ data: ord.rows, total: ord.rows.length }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({
            data: [
              { id: 1, order_no: 'INV-2026-00001', customer_name: 'Pakshal', total_amount: 196532, paid_amount: 110000, pending_amount: 86532, status: 'partially_paid' },
              { id: 2, order_no: 'INV-2026-00002', customer_name: 'Vikram Rathore', total_amount: 367968, paid_amount: 50000, pending_amount: 317968, status: 'partially_paid' }
            ],
            total: 2
          }));
        }
        return true;
      }

      if (req.method === 'POST') {
        const order = await getBody();
        if (pool) {
          const orderNo = `INV-2026-${Date.now().toString().slice(-5)}`;
          const inserted = await query(`
            INSERT INTO public.orders (order_no, order_type, customer_id, customer_name, subtotal, total_gst, total_amount, paid_amount, pending_amount, status)
            VALUES ($1, 'sale', $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
          `, [orderNo, order.customer_id || 1, order.customer_name || 'Walk-in', order.subtotal || 0, order.total_gst || 0, order.total_amount || 0, order.paid_amount || 0, (order.total_amount || 0) - (order.paid_amount || 0), order.paid_amount >= order.total_amount ? 'paid' : 'partially_paid']);
          res.writeHead(201);
          res.end(JSON.stringify({ data: inserted.rows[0] }));
        } else {
          res.writeHead(201);
          res.end(JSON.stringify({ data: { id: Date.now(), order_no: 'INV-NEW', ...order } }));
        }
        return true;
      }
    }

    // 9. Girvi Loans
    if (pathname === '/api/v1/loans') {
      if (req.method === 'GET') {
        if (pool) {
          const l = await query('SELECT * FROM public.loans ORDER BY id DESC LIMIT 100');
          res.writeHead(200);
          res.end(JSON.stringify({ data: l.rows, total: l.rows.length }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ data: [], total: 0 }));
        }
        return true;
      }
    }

    // 10. Cash Register
    if (pathname === '/api/v1/register/mine' || pathname === '/api/v1/register/counters') {
      if (pool) {
        const c = await query('SELECT * FROM public.register_counters LIMIT 5');
        res.writeHead(200);
        res.end(JSON.stringify({
          data: c.rows.length ? c.rows : [{ id: 1, counter_code: 'MAIN', counter_name: 'Main Counter', is_active: true }]
        }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({
          data: [{ id: 1, counter_code: 'MAIN', counter_name: 'Main Counter', is_active: true }]
        }));
      }
      return true;
    }

    // 11. Suppliers
    if (pathname === '/api/v1/suppliers') {
      if (pool) {
        const s = await query('SELECT * FROM public.suppliers ORDER BY id DESC LIMIT 50');
        res.writeHead(200);
        res.end(JSON.stringify({ data: s.rows }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ data: [] }));
      }
      return true;
    }

    // 12. Purchase Orders
    if (pathname === '/api/v1/purchase-orders') {
      if (pool) {
        const po = await query('SELECT * FROM public.purchase_orders ORDER BY id DESC LIMIT 50');
        res.writeHead(200);
        res.end(JSON.stringify({ data: po.rows }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ data: [] }));
      }
      return true;
    }

    // 13. Shipments
    if (pathname === '/api/v1/shipments') {
      if (pool) {
        const shp = await query('SELECT * FROM public.shipments ORDER BY id DESC LIMIT 50');
        res.writeHead(200);
        res.end(JSON.stringify({ data: shp.rows }));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ data: [] }));
      }
      return true;
    }

  } catch (err) {
    console.error(`❌ API Handler Error on ${pathname}:`, err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
    return true;
  }

  return false;
}
