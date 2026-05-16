const svc = require('./accounts.service');
const { ok, created } = require('../../utils/response');

const list    = async (req, res, next) => { try { ok(res, await svc.listAccounts(req.tenantId)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { created(res, await svc.createAccount(req.tenantId, req.body), 'Account added'); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { ok(res, await svc.updateAccount(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { ok(res, await svc.deleteAccount(req.tenantId, req.params.id), 'Account removed'); } catch (e) { next(e); } };
const txns    = async (req, res, next) => { try { ok(res, await svc.getTransactions(req.params.id, req.query)); } catch (e) { next(e); } };
const addTxn  = async (req, res, next) => { try { created(res, await svc.addTransaction(req.tenantId, req.params.id, req.body), 'Transaction added'); } catch (e) { next(e); } };
const balance = async (req, res, next) => { try { ok(res, { totalBalance: await svc.totalBalance(req.tenantId) }); } catch (e) { next(e); } };

module.exports = { list, create, update, remove, txns, addTxn, balance };
