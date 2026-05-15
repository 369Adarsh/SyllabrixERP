// GST calculation helpers for Indian tax compliance

const GST_RATES = [0, 5, 12, 18, 28];

const calculateGst = (amount, gstRate, isInterState = false) => {
  const taxAmount = (amount * gstRate) / 100;
  if (isInterState) {
    return { igst: taxAmount, cgst: 0, sgst: 0, total: taxAmount };
  }
  const half = taxAmount / 2;
  return { igst: 0, cgst: half, sgst: half, total: taxAmount };
};

const calculateLineItem = (quantity, unitPrice, discountPct = 0, gstRate = 0, isInterState = false) => {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gst = calculateGst(taxableAmount, gstRate, isInterState);
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount: gst.total,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    total: taxableAmount + gst.total,
  };
};

const formatInvoiceTotals = (items) => {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const discountAmount = items.reduce((s, i) => s + i.discountAmount, 0);
  const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);
  const total = items.reduce((s, i) => s + i.total, 0);
  return { subtotal, discountAmount, taxAmount, total };
};

module.exports = { GST_RATES, calculateGst, calculateLineItem, formatInvoiceTotals };
