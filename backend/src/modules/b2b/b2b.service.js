const prisma = require('../../config/prisma');

const B2B_TYPES = ['DEALER', 'SUPPLIER', 'WHOLESALE'];

// Syllabrix ID pattern: SYL + 6 uppercase alphanumeric chars
const isSyllabrixId = (q) => /^SYL[A-Z0-9]{6}$/i.test((q || '').trim());

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Get avg rating for a tenant
const getRatingAgg = (targetTenantId) =>
  prisma.businessRating.aggregate({
    where: { targetTenantId },
    _avg: { overallRating: true, qualityRating: true, deliveryRating: true, communicationRating: true, paymentRating: true },
    _count: { id: true },
  });

// Attach partnership status + rating to a raw tenant row
const enrichSupplier = async (s, tenantId, partnershipRows) => {
  const p = partnershipRows.find(
    (p) =>
      (p.requesterTenantId === tenantId && p.supplierTenantId === s.id) ||
      (p.supplierTenantId === tenantId && p.requesterTenantId === s.id),
  );
  const agg = await getRatingAgg(s.id);
  return {
    ...s,
    catalogCount: s.displayCatalog?.length ?? 0,
    displayCatalog: undefined,
    partnershipStatus: p?.status ?? null,
    partnershipId: p?.id ?? null,
    avgRating: agg._avg.overallRating,
    ratingCount: agg._count.id,
  };
};

// ─── My Display Catalog (supplier-side) ───────────────────────────────────────

const getMyDisplayCatalog = (tenantId) =>
  prisma.displayCatalogItem.findMany({
    where: { supplierTenantId: tenantId },
    orderBy: { productName: 'asc' },
  });

const addDisplayCatalogItem = (tenantId, data) =>
  prisma.displayCatalogItem.create({
    data: {
      supplierTenantId: tenantId,
      productName: data.productName,
      description: data.description || null,
      sku: data.sku || null,
      unit: data.unit || 'pcs',
      basePrice: Number(data.basePrice),
      moq: Number(data.moq || 1),
      maxOrderQty: data.maxOrderQty ? Number(data.maxOrderQty) : null,
      hsnCode: data.hsnCode || null,
      taxRate: Number(data.taxRate || 0),
      category: data.category || null,
    },
  });

const updateDisplayCatalogItem = (tenantId, id, data) => {
  const allowed = ['productName', 'description', 'sku', 'unit', 'basePrice', 'moq', 'maxOrderQty', 'hsnCode', 'taxRate', 'category', 'isAvailable'];
  const update = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  if (update.basePrice !== undefined) update.basePrice = Number(update.basePrice);
  if (update.moq !== undefined) update.moq = Number(update.moq);
  if (update.maxOrderQty !== undefined) update.maxOrderQty = update.maxOrderQty ? Number(update.maxOrderQty) : null;
  if (update.taxRate !== undefined) update.taxRate = Number(update.taxRate);
  return prisma.displayCatalogItem.update({ where: { id, supplierTenantId: tenantId }, data: update });
};

const deleteDisplayCatalogItem = (tenantId, id) =>
  prisma.displayCatalogItem.delete({ where: { id, supplierTenantId: tenantId } });

// ─── Supplier Discovery ───────────────────────────────────────────────────────

const SUPPLIER_SELECT = {
  id: true, name: true, businessType: true, city: true, state: true, pincode: true,
  syllabrixId: true, gstin: true, address: true,
  displayCatalog: { where: { isAvailable: true }, select: { id: true } },
};

const searchSuppliers = async (tenantId, search) => {
  const exactId = isSyllabrixId(search);

  const suppliers = await prisma.tenant.findMany({
    where: {
      isActive: true,
      id: { not: tenantId },
      businessType: { in: B2B_TYPES },
      ...(search
        ? {
            OR: exactId
              ? [{ syllabrixId: search.toUpperCase() }]
              : [
                  { name: { contains: search, mode: 'insensitive' } },
                  { city: { contains: search, mode: 'insensitive' } },
                  { state: { contains: search, mode: 'insensitive' } },
                  { syllabrixId: { startsWith: search.toUpperCase() } },
                ],
          }
        : {}),
    },
    select: SUPPLIER_SELECT,
    take: 50,
    orderBy: { name: 'asc' },
  });

  const myPartnerships = await prisma.businessPartnership.findMany({
    where: { OR: [{ requesterTenantId: tenantId }, { supplierTenantId: tenantId }] },
  });

  return Promise.all(
    suppliers.map(async (s) => ({
      ...(await enrichSupplier(s, tenantId, myPartnerships)),
      isExactIdMatch: exactId,
    })),
  );
};

// Suppliers in the same city/state as the buyer — for "Near You" discovery
const getLocalSuppliers = async (tenantId) => {
  const me = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { city: true, state: true },
  });

  const myPartnerships = await prisma.businessPartnership.findMany({
    where: { OR: [{ requesterTenantId: tenantId }, { supplierTenantId: tenantId }] },
  });

  const baseWhere = {
    isActive: true,
    id: { not: tenantId },
    businessType: { in: B2B_TYPES },
  };

  const cityRows = me?.city
    ? await prisma.tenant.findMany({
        where: { ...baseWhere, city: { equals: me.city, mode: 'insensitive' } },
        select: SUPPLIER_SELECT,
        take: 6,
        orderBy: { name: 'asc' },
      })
    : [];

  const cityIds = cityRows.map((s) => s.id);

  const stateRows = me?.state
    ? await prisma.tenant.findMany({
        where: {
          ...baseWhere,
          state: { equals: me.state, mode: 'insensitive' },
          id: { notIn: [tenantId, ...cityIds] },
        },
        select: SUPPLIER_SELECT,
        take: 8,
        orderBy: { name: 'asc' },
      })
    : [];

  const [enrichedCity, enrichedState] = await Promise.all([
    Promise.all(cityRows.map((s) => enrichSupplier(s, tenantId, myPartnerships))),
    Promise.all(stateRows.map((s) => enrichSupplier(s, tenantId, myPartnerships))),
  ]);

  return {
    buyerCity: me?.city,
    buyerState: me?.state,
    sameCity: enrichedCity,
    sameState: enrichedState,
  };
};

// Full supplier profile with ratings (public — no partnership required)
const getSupplierProfile = async (tenantId, supplierTenantId) => {
  const [supplier, ratingData] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: supplierTenantId },
      select: {
        id: true, name: true, businessType: true, city: true, state: true,
        pincode: true, address: true, syllabrixId: true, gstin: true,
        displayCatalog: { where: { isAvailable: true }, select: { id: true } },
      },
    }),
    getSupplierRatings(supplierTenantId),
  ]);
  if (!supplier) throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
  if (!B2B_TYPES.includes(supplier.businessType))
    throw Object.assign(new Error('This business is not a registered supplier on the B2B Marketplace'), { statusCode: 403 });

  const myPartnership = await prisma.businessPartnership.findFirst({
    where: {
      OR: [
        { requesterTenantId: tenantId, supplierTenantId },
        { requesterTenantId: supplierTenantId, supplierTenantId: tenantId },
      ],
    },
    select: { id: true, status: true, paymentTerms: true, creditDays: true, advancePct: true, creditLimit: true, termsNotes: true },
  });

  return {
    ...supplier,
    catalogCount: supplier.displayCatalog?.length ?? 0,
    displayCatalog: undefined,
    partnershipStatus: myPartnership?.status ?? null,
    partnershipId: myPartnership?.id ?? null,
    partnership: myPartnership ?? null,
    ratings: ratingData,
  };
};

// ─── Business Partnerships ────────────────────────────────────────────────────

const sendPartnerRequest = async (requesterTenantId, supplierTenantId, message, paymentPrefs) => {
  if (requesterTenantId === supplierTenantId)
    throw Object.assign(new Error('Cannot partner with yourself'), { statusCode: 400 });

  const existing = await prisma.businessPartnership.findUnique({
    where: { requesterTenantId_supplierTenantId: { requesterTenantId, supplierTenantId } },
  });
  if (existing) throw Object.assign(new Error('Partnership request already sent'), { statusCode: 409 });

  const supplier = await prisma.tenant.findUnique({ where: { id: supplierTenantId }, select: { businessType: true } });
  if (!supplier || !B2B_TYPES.includes(supplier.businessType))
    throw Object.assign(new Error('Target is not a registered dealer/supplier'), { statusCode: 400 });

  return prisma.businessPartnership.create({
    data: {
      requesterTenantId,
      supplierTenantId,
      message,
      ...(paymentPrefs?.paymentTerms ? {
        paymentTerms: paymentPrefs.paymentTerms,
        creditDays: paymentPrefs.creditDays ? Number(paymentPrefs.creditDays) : null,
        advancePct: paymentPrefs.advancePct ? Number(paymentPrefs.advancePct) : null,
        creditLimit: paymentPrefs.creditLimit ? Number(paymentPrefs.creditLimit) : null,
        termsNotes: paymentPrefs.termsNotes || null,
      } : {}),
    },
    include: { supplier: { select: { id: true, name: true, businessType: true, city: true } } },
  });
};

const getMyPartnerships = async (tenantId) => {
  const [sent, received] = await Promise.all([
    prisma.businessPartnership.findMany({
      where: { requesterTenantId: tenantId, supplier: { businessType: { in: B2B_TYPES } } },
      include: { supplier: { select: { id: true, name: true, businessType: true, city: true, state: true, syllabrixId: true } } },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.businessPartnership.findMany({
      where: { supplierTenantId: tenantId },
      include: { requester: { select: { id: true, name: true, businessType: true, city: true, state: true, syllabrixId: true } } },
      orderBy: { requestedAt: 'desc' },
    }),
  ]);

  // Attach live rating to active partners
  const enrichPartner = async (p, field) => {
    if (p.status !== 'ACTIVE' || !p[field]) return p;
    const agg = await getRatingAgg(p[field].id);
    return { ...p, [field]: { ...p[field], avgRating: agg._avg.overallRating, ratingCount: agg._count.id } };
  };

  const [enrichedSent, enrichedReceived] = await Promise.all([
    Promise.all(sent.map((p) => enrichPartner(p, 'supplier'))),
    Promise.all(received.map((p) => enrichPartner(p, 'requester'))),
  ]);

  return { sent: enrichedSent, received: enrichedReceived };
};

const respondToPartnerRequest = (tenantId, partnershipId, accept, paymentPrefs) =>
  prisma.businessPartnership.update({
    where: { id: partnershipId, supplierTenantId: tenantId },
    data: {
      status: accept ? 'ACTIVE' : 'REJECTED',
      respondedAt: new Date(),
      ...(accept && paymentPrefs?.paymentTerms ? {
        paymentTerms: paymentPrefs.paymentTerms,
        creditDays: paymentPrefs.creditDays ? Number(paymentPrefs.creditDays) : null,
        advancePct: paymentPrefs.advancePct ? Number(paymentPrefs.advancePct) : null,
        creditLimit: paymentPrefs.creditLimit ? Number(paymentPrefs.creditLimit) : null,
        termsNotes: paymentPrefs.termsNotes || null,
      } : {}),
    },
    include: { requester: { select: { id: true, name: true, city: true } } },
  });

// Update payment terms on an existing active partnership (either party can propose)
const setPartnershipTerms = async (tenantId, partnershipId, terms) => {
  const p = await prisma.businessPartnership.findUnique({ where: { id: partnershipId } });
  if (!p) throw Object.assign(new Error('Partnership not found'), { statusCode: 404 });
  if (p.requesterTenantId !== tenantId && p.supplierTenantId !== tenantId)
    throw Object.assign(new Error('Not your partnership'), { statusCode: 403 });
  if (p.status !== 'ACTIVE')
    throw Object.assign(new Error('Can only update terms on an active partnership'), { statusCode: 400 });

  return prisma.businessPartnership.update({
    where: { id: partnershipId },
    data: {
      paymentTerms: terms.paymentTerms,
      creditDays: terms.creditDays ? Number(terms.creditDays) : null,
      advancePct: terms.advancePct ? Number(terms.advancePct) : null,
      creditLimit: terms.creditLimit ? Number(terms.creditLimit) : null,
      termsNotes: terms.termsNotes || null,
    },
  });
};

// ─── Ratings ──────────────────────────────────────────────────────────────────

const ratePartner = async (reviewerTenantId, targetTenantId, data) => {
  // Must have an active partnership to rate
  const partnership = await prisma.businessPartnership.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { requesterTenantId: reviewerTenantId, supplierTenantId: targetTenantId },
        { requesterTenantId: targetTenantId, supplierTenantId: reviewerTenantId },
      ],
    },
  });
  if (!partnership)
    throw Object.assign(new Error('You can only rate an active business partner'), { statusCode: 403 });

  const { overallRating, qualityRating, deliveryRating, communicationRating, paymentRating, review } = data;
  if (!overallRating || overallRating < 1 || overallRating > 5)
    throw Object.assign(new Error('Overall rating must be between 1 and 5'), { statusCode: 400 });

  const payload = {
    overallRating: Number(overallRating),
    qualityRating: qualityRating ? Number(qualityRating) : null,
    deliveryRating: deliveryRating ? Number(deliveryRating) : null,
    communicationRating: communicationRating ? Number(communicationRating) : null,
    paymentRating: paymentRating ? Number(paymentRating) : null,
    review: review || null,
    partnershipId: partnership.id,
  };

  return prisma.businessRating.upsert({
    where: { reviewerTenantId_targetTenantId: { reviewerTenantId, targetTenantId } },
    update: payload,
    create: { reviewerTenantId, targetTenantId, ...payload },
  });
};

const getSupplierRatings = async (targetTenantId) => {
  const [ratings, agg] = await Promise.all([
    prisma.businessRating.findMany({
      where: { targetTenantId },
      include: { reviewer: { select: { id: true, name: true, city: true, businessType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.businessRating.aggregate({
      where: { targetTenantId },
      _avg: { overallRating: true, qualityRating: true, deliveryRating: true, communicationRating: true, paymentRating: true },
      _count: { id: true },
    }),
  ]);

  return {
    ratings,
    avgOverall: agg._avg.overallRating,
    avgQuality: agg._avg.qualityRating,
    avgDelivery: agg._avg.deliveryRating,
    avgCommunication: agg._avg.communicationRating,
    avgPayment: agg._avg.paymentRating,
    count: agg._count.id,
  };
};

// ─── Browse Supplier Catalog (buyer-side) ─────────────────────────────────────

const getSupplierCatalog = async (tenantId, supplierTenantId) => {
  const partnership = await prisma.businessPartnership.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { requesterTenantId: tenantId, supplierTenantId },
        { requesterTenantId: supplierTenantId, supplierTenantId: tenantId },
      ],
    },
  });
  if (!partnership) throw Object.assign(new Error('No active partnership with this supplier'), { statusCode: 403 });

  const [supplier, items] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: supplierTenantId },
      select: { id: true, name: true, businessType: true, city: true, state: true, pincode: true, syllabrixId: true },
    }),
    prisma.displayCatalogItem.findMany({ where: { supplierTenantId, isAvailable: true }, orderBy: { productName: 'asc' } }),
  ]);

  return { partnership, supplier, items };
};

// ─── Price Negotiations ───────────────────────────────────────────────────────

const requestBestPrice = async (buyerTenantId, data) => {
  const { partnershipId, catalogItemId, requestedQty, buyerTargetPrice, notes } = data;

  const partnership = await prisma.businessPartnership.findFirst({
    where: { id: partnershipId, status: 'ACTIVE', requesterTenantId: buyerTenantId },
  });
  if (!partnership) throw Object.assign(new Error('No active partnership'), { statusCode: 403 });

  const item = await prisma.displayCatalogItem.findUnique({
    where: { id: catalogItemId, supplierTenantId: partnership.supplierTenantId },
  });
  if (!item) throw Object.assign(new Error('Catalog item not found'), { statusCode: 404 });

  if (Number(buyerTargetPrice) >= item.basePrice)
    throw Object.assign(new Error('Target price must be lower than the listed base price'), { statusCode: 400 });

  return prisma.priceNegotiation.create({
    data: {
      partnershipId, catalogItemId,
      buyerTenantId, supplierTenantId: partnership.supplierTenantId,
      requestedQty: Number(requestedQty),
      buyerTargetPrice: Number(buyerTargetPrice),
      notes,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rounds: { create: { offeredBy: 'BUYER', price: Number(buyerTargetPrice), qty: Number(requestedQty), message: notes || null } },
    },
    include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } }, supplierTenant: { select: { id: true, name: true } } },
  });
};

const getMyNegotiations = async (tenantId) => {
  const [asBuyer, asSupplier] = await Promise.all([
    prisma.priceNegotiation.findMany({
      where: { buyerTenantId: tenantId },
      include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } }, supplierTenant: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.priceNegotiation.findMany({
      where: { supplierTenantId: tenantId },
      include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } }, buyerTenant: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  return { asBuyer, asSupplier };
};

const respondToNegotiation = async (tenantId, negotiationId, { action, price, qty, message }) => {
  const neg = await prisma.priceNegotiation.findUnique({ where: { id: negotiationId } });
  if (!neg) throw Object.assign(new Error('Negotiation not found'), { statusCode: 404 });

  const isSupplier = neg.supplierTenantId === tenantId;
  const isBuyer = neg.buyerTenantId === tenantId;
  if (!isSupplier && !isBuyer) throw Object.assign(new Error('Not your negotiation'), { statusCode: 403 });
  if (['ACCEPTED', 'REJECTED', 'PO_CREATED'].includes(neg.status))
    throw Object.assign(new Error('Negotiation is already closed'), { statusCode: 400 });

  const offeredBy = isSupplier ? 'SUPPLIER' : 'BUYER';

  if (action === 'ACCEPT') {
    const finalPrice = price ? Number(price) : neg.buyerTargetPrice;
    return prisma.priceNegotiation.update({
      where: { id: negotiationId },
      data: { status: 'ACCEPTED', finalPrice, rounds: { create: { offeredBy, price: finalPrice, message: message || 'Accepted' } } },
      include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } } },
    });
  }
  if (action === 'REJECT') {
    return prisma.priceNegotiation.update({
      where: { id: negotiationId },
      data: { status: 'REJECTED', rounds: { create: { offeredBy, price: neg.buyerTargetPrice, message: message || 'Not interested' } } },
      include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } } },
    });
  }
  if (action === 'COUNTER') {
    if (!price) throw Object.assign(new Error('Counter price required'), { statusCode: 400 });
    return prisma.priceNegotiation.update({
      where: { id: negotiationId },
      data: { status: 'COUNTERED', rounds: { create: { offeredBy, price: Number(price), qty: qty ? Number(qty) : null, message: message || null } } },
      include: { catalogItem: true, rounds: { orderBy: { createdAt: 'asc' } } },
    });
  }
  throw Object.assign(new Error('Invalid action — use ACCEPT, REJECT, or COUNTER'), { statusCode: 400 });
};

module.exports = {
  getMyDisplayCatalog, addDisplayCatalogItem, updateDisplayCatalogItem, deleteDisplayCatalogItem,
  searchSuppliers, getLocalSuppliers, getSupplierProfile,
  sendPartnerRequest, getMyPartnerships, respondToPartnerRequest, setPartnershipTerms,
  getSupplierCatalog,
  ratePartner, getSupplierRatings,
  requestBestPrice, getMyNegotiations, respondToNegotiation,
};
