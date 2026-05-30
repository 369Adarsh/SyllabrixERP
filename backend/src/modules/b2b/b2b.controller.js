const svc = require('./b2b.service');
const { ok, created } = require('../../utils/response');

// Display Catalog
const getMyDisplayCatalog = async (req, res, next) => {
  try { ok(res, await svc.getMyDisplayCatalog(req.tenantId)); } catch (e) { next(e); }
};
const addDisplayCatalogItem = async (req, res, next) => {
  try { created(res, await svc.addDisplayCatalogItem(req.tenantId, req.body)); } catch (e) { next(e); }
};
const updateDisplayCatalogItem = async (req, res, next) => {
  try { ok(res, await svc.updateDisplayCatalogItem(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};
const deleteDisplayCatalogItem = async (req, res, next) => {
  try { ok(res, await svc.deleteDisplayCatalogItem(req.tenantId, req.params.id), 'Removed'); } catch (e) { next(e); }
};

// Supplier Discovery
const searchSuppliers = async (req, res, next) => {
  try { ok(res, await svc.searchSuppliers(req.tenantId, req.query.q || req.query.search)); } catch (e) { next(e); }
};
const getLocalSuppliers = async (req, res, next) => {
  try { ok(res, await svc.getLocalSuppliers(req.tenantId)); } catch (e) { next(e); }
};
const getSupplierProfile = async (req, res, next) => {
  try { ok(res, await svc.getSupplierProfile(req.tenantId, req.params.supplierTenantId)); } catch (e) { next(e); }
};

// Partnerships
const sendPartnerRequest = async (req, res, next) => {
  try {
    created(res, await svc.sendPartnerRequest(req.tenantId, req.body.supplierTenantId, req.body.message, req.body.paymentPrefs));
  } catch (e) { next(e); }
};
const getMyPartnerships = async (req, res, next) => {
  try { ok(res, await svc.getMyPartnerships(req.tenantId)); } catch (e) { next(e); }
};
const respondToPartnerRequest = async (req, res, next) => {
  try {
    ok(res, await svc.respondToPartnerRequest(req.tenantId, req.params.id, req.body.accept, req.body.paymentPrefs));
  } catch (e) { next(e); }
};
const setPartnershipTerms = async (req, res, next) => {
  try { ok(res, await svc.setPartnershipTerms(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};

// Ratings
const ratePartner = async (req, res, next) => {
  try { ok(res, await svc.ratePartner(req.tenantId, req.params.targetTenantId, req.body)); } catch (e) { next(e); }
};
const getSupplierRatings = async (req, res, next) => {
  try { ok(res, await svc.getSupplierRatings(req.params.supplierTenantId)); } catch (e) { next(e); }
};

// Supplier catalog browse
const getSupplierCatalog = async (req, res, next) => {
  try { ok(res, await svc.getSupplierCatalog(req.tenantId, req.params.supplierTenantId)); } catch (e) { next(e); }
};

// Price Negotiations
const requestBestPrice = async (req, res, next) => {
  try { created(res, await svc.requestBestPrice(req.tenantId, req.body)); } catch (e) { next(e); }
};
const getMyNegotiations = async (req, res, next) => {
  try { ok(res, await svc.getMyNegotiations(req.tenantId)); } catch (e) { next(e); }
};
const respondToNegotiation = async (req, res, next) => {
  try { ok(res, await svc.respondToNegotiation(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); }
};

module.exports = {
  getMyDisplayCatalog, addDisplayCatalogItem, updateDisplayCatalogItem, deleteDisplayCatalogItem,
  searchSuppliers, getLocalSuppliers, getSupplierProfile,
  sendPartnerRequest, getMyPartnerships, respondToPartnerRequest, setPartnershipTerms,
  ratePartner, getSupplierRatings,
  getSupplierCatalog,
  requestBestPrice, getMyNegotiations, respondToNegotiation,
};
