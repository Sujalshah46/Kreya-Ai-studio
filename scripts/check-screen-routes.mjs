import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const routes = '/ /daily-rates /customers /payments /orders /bookings /cancellations /register /buybacks /shipments /repairs /loans /old-gold /deposits /outflows /inventory /stock /stock-ledger /stock-verification /metal-stock /suppliers /purchase-orders /goods-receipts /supplier-bills /supplier-payments /purchase-reports /sales-reports /gst-reports /reports /export /data-import /settings /admin/business /admin/integrations /admin/users /admin/roles /admin/theme /admin/login-page /admin/security /admin/license /admin/audit /admin/errors'.split(' ');
assert.equal(routes.length, 42);
const expectedLandings = {
  '/': /Monthly Revenue &amp; Collections/,
  '/stock': />Stock &amp; Valuation<\/h1>/,
  '/export': />Export &amp; Data Backup<\/h1>/,
  '/settings': />Shop Settings<\/h1>/,
  '/admin/audit': />Audit Log<\/h1>/
};
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let failed = 0;
const previousError = console.error;
console.error = (...args) => {
  if (!String(args[0]).startsWith('Warning: useLayoutEffect does nothing on the server')) previousError(...args);
};
try {
  const { App } = await server.ssrLoadModule('/src/App.tsx');
  for (const pathname of routes) {
    try {
      globalThis.window = { location: { pathname }, localStorage: { getItem: () => null } };
      const html = renderToStaticMarkup(React.createElement(App));
      const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1];
      assert.ok(main && main.trim().length > 100, 'empty main region');
      if (expectedLandings[pathname]) assert.match(main, expectedLandings[pathname], 'unexpected screen');
      const heading = main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]*>/g, '') || 'dashboard content';
      if (pathname !== '/') assert.doesNotMatch(main, /Monthly Revenue &amp; Collections/, 'fell back to dashboard');
      console.log(pathname, heading);
    } catch (e) { failed++; console.log('FAIL', pathname, e.message); }
  }
} finally {
  console.error = previousError;
  delete globalThis.window;
  await server.close();
}
assert.equal(failed, 0);
