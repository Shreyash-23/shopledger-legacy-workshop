'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, sku, hsn, price, qty, gstRate) {
  return { name, sku, hsn, price, qty, gstRate };
}

// gstRate is present because computeInvoiceFigures reads this field as a percent.
// hsn is also retained so checkout pricing can resolve its configured slab.
const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 model with 5% and 12% items and no coupon',
    coupon: '',
    items: [
      line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      line('A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 450, 1, 12)
    ],
    invoiceExpected: { subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176, gstPercents: [5, 12] },
    checkoutExpected: { subtotal: 1090, discount: 0, tax: 86, total: 1176 }
  },
  {
    name: 'Checkout parity: #1002 SAVE10 discount is applied before tax',
    coupon: 'SAVE10',
    items: [
      line('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      line('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
    ],
    invoiceExpected: { subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, gstPercents: [5, 5] },
    checkoutExpected: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  },
  {
    name: 'Checkout parity: #1004 SAVE10 respects the ₹150 cap on ₹2,240',
    coupon: 'SAVE10',
    items: [
      line('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
    ],
    invoiceExpected: { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, gstPercents: [5] },
    checkoutExpected: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all-18% lines with no coupon match checkout totals',
    coupon: '',
    items: [
      line('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
      line('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
    ],
    invoiceExpected: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, gstPercents: [18, 18] },
    checkoutExpected: { subtotal: 500, discount: 0, tax: 90, total: 590 }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const invoiceFigures = invoice.computeInvoiceFigures({
      id: 1,
      coupon: scenario.coupon,
      items: scenario.items
    });
    const checkoutFigures = pricing.computeTotals(scenario.items, scenario.coupon);

    assert.deepEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      gstPercents: invoiceFigures.rows.map(row => row.gstPercent)
    }, scenario.invoiceExpected);

    assert.deepEqual({
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      total: checkoutFigures.total
    }, scenario.checkoutExpected);
  });
}

test('INVOICE PARITY: legacy #1004 line uses its HSN slab and the capped pre-tax coupon', () => {
  const items = [
    { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
  ];
  const invoiceFigures = invoice.computeInvoiceFigures({ coupon: 'SAVE10', items });
  const checkoutFigures = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    gstPercents: invoiceFigures.rows.map(row => row.gstPercent),
    lineTaxes: invoiceFigures.rows.map(row => row.lineTax)
  }, {
    subtotal: checkoutFigures.subtotal,
    discount: checkoutFigures.discount,
    tax: checkoutFigures.tax,
    cgst: checkoutFigures.cgst,
    sgst: checkoutFigures.sgst,
    total: checkoutFigures.total,
    gstPercents: checkoutFigures.lines.map(line => line.gstPercent),
    lineTaxes: checkoutFigures.lines.map(line => line.tax)
  });
});
