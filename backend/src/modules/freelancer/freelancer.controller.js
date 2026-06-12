const svc = require('./freelancer.service');

const tid = req => req.user.tenantId;

// ── Jobs ──────────────────────────────────────────────────────────────────────
exports.createJob    = async (req, res, next) => { try { res.status(201).json(await svc.createJob(tid(req), req.body)); } catch(e){next(e);} };
exports.listJobs     = async (req, res, next) => { try { res.json(await svc.listJobs(tid(req), req.query)); } catch(e){next(e);} };
exports.getJob       = async (req, res, next) => { try { const j = await svc.getJob(tid(req), req.params.id); if(!j) return res.status(404).json({error:'Job not found'}); res.json(j); } catch(e){next(e);} };
exports.updateJob    = async (req, res, next) => { try { res.json(await svc.updateJob(tid(req), req.params.id, req.body)); } catch(e){next(e);} };
exports.updateJobStatus = async (req, res, next) => { try { res.json(await svc.updateJobStatus(tid(req), req.params.id, req.body.status)); } catch(e){next(e);} };
exports.deleteJob    = async (req, res, next) => { try { await svc.deleteJob(tid(req), req.params.id); res.json({success:true}); } catch(e){next(e);} };

// ── Estimates ─────────────────────────────────────────────────────────────────
exports.saveEstimate = async (req, res, next) => { try { res.json(await svc.saveEstimate(tid(req), req.params.id, req.body)); } catch(e){next(e);} };
exports.getEstimate  = async (req, res, next) => { try { res.json(await svc.getEstimate(tid(req), req.params.id)); } catch(e){next(e);} };

// ── Materials ─────────────────────────────────────────────────────────────────
exports.addMaterial    = async (req, res, next) => { try { res.status(201).json(await svc.addMaterial(tid(req), req.params.id, req.body)); } catch(e){next(e);} };
exports.listMaterials  = async (req, res, next) => { try { res.json(await svc.listMaterials(tid(req), req.params.id)); } catch(e){next(e);} };
exports.deleteMaterial = async (req, res, next) => { try { await svc.deleteMaterial(tid(req), req.params.mid); res.json({success:true}); } catch(e){next(e);} };

// ── Payments ─────────────────────────────────────────────────────────────────
exports.recordPayment = async (req, res, next) => { try { res.status(201).json(await svc.recordPayment(tid(req), req.params.id, req.body)); } catch(e){next(e);} };
exports.listPayments  = async (req, res, next) => { try { res.json(await svc.listPayments(tid(req), req.params.id)); } catch(e){next(e);} };

// ── Helpers ───────────────────────────────────────────────────────────────────
exports.createHelper   = async (req, res, next) => { try { res.status(201).json(await svc.createHelper(tid(req), req.body)); } catch(e){next(e);} };
exports.listHelpers    = async (req, res, next) => { try { res.json(await svc.listHelpers(tid(req))); } catch(e){next(e);} };
exports.assignHelper   = async (req, res, next) => { try { res.json(await svc.assignHelper(tid(req), req.params.id, req.body)); } catch(e){next(e);} };
exports.updateJobHelper= async (req, res, next) => { try { res.json(await svc.updateJobHelper(tid(req), req.params.id, req.params.hid, req.body)); } catch(e){next(e);} };

// ── Partners ──────────────────────────────────────────────────────────────────
exports.createPartner = async (req, res, next) => { try { res.status(201).json(await svc.createPartner(tid(req), req.body)); } catch(e){next(e);} };
exports.listPartners  = async (req, res, next) => { try { res.json(await svc.listPartners(tid(req))); } catch(e){next(e);} };

// ── Clients ───────────────────────────────────────────────────────────────────
exports.createClient = async (req, res, next) => { try { res.status(201).json(await svc.createClient(tid(req), req.body)); } catch(e){next(e);} };
exports.listClients  = async (req, res, next) => { try { res.json(await svc.listClients(tid(req), req.query)); } catch(e){next(e);} };
exports.getClient    = async (req, res, next) => { try { const c = await svc.getClient(tid(req), req.params.id); if(!c) return res.status(404).json({error:'Client not found'}); res.json(c); } catch(e){next(e);} };
exports.updateClient = async (req, res, next) => { try { res.json(await svc.updateClient(tid(req), req.params.id, req.body)); } catch(e){next(e);} };

// ── Expenses ──────────────────────────────────────────────────────────────────
exports.createExpense = async (req, res, next) => { try { res.status(201).json(await svc.createExpense(tid(req), req.body)); } catch(e){next(e);} };
exports.listExpenses  = async (req, res, next) => { try { res.json(await svc.listExpenses(tid(req), req.query)); } catch(e){next(e);} };
exports.deleteExpense = async (req, res, next) => { try { await svc.deleteExpense(tid(req), req.params.id); res.json({success:true}); } catch(e){next(e);} };

// ── Suppliers ─────────────────────────────────────────────────────────────────
exports.createSupplier = async (req, res, next) => { try { res.status(201).json(await svc.createSupplier(tid(req), req.body)); } catch(e){next(e);} };
exports.listSuppliers  = async (req, res, next) => { try { res.json(await svc.listSuppliers(tid(req))); } catch(e){next(e);} };
exports.updateSupplier = async (req, res, next) => { try { res.json(await svc.updateSupplier(tid(req), req.params.id, req.body)); } catch(e){next(e);} };

// ── Tools ─────────────────────────────────────────────────────────────────────
exports.createTool = async (req, res, next) => { try { res.status(201).json(await svc.createTool(tid(req), req.body)); } catch(e){next(e);} };
exports.listTools  = async (req, res, next) => { try { res.json(await svc.listTools(tid(req))); } catch(e){next(e);} };
exports.updateTool = async (req, res, next) => { try { res.json(await svc.updateTool(tid(req), req.params.id, req.body)); } catch(e){next(e);} };

// ── AMC ───────────────────────────────────────────────────────────────────────
exports.createAMC = async (req, res, next) => { try { res.status(201).json(await svc.createAMC(tid(req), req.body)); } catch(e){next(e);} };
exports.listAMC   = async (req, res, next) => { try { res.json(await svc.listAMC(tid(req))); } catch(e){next(e);} };
exports.updateAMC = async (req, res, next) => { try { res.json(await svc.updateAMC(tid(req), req.params.id, req.body)); } catch(e){next(e);} };

// ── Reports ───────────────────────────────────────────────────────────────────
exports.dashboardStats  = async (req, res, next) => { try { res.json(await svc.dashboardStats(tid(req))); } catch(e){next(e);} };
exports.monthlyReport   = async (req, res, next) => { try { res.json(await svc.monthlyReport(tid(req), req.query)); } catch(e){next(e);} };
exports.pendingPayments = async (req, res, next) => { try { res.json(await svc.pendingPayments(tid(req))); } catch(e){next(e);} };
exports.jobsReport      = async (req, res, next) => { try { res.json(await svc.jobsReport(tid(req))); } catch(e){next(e);} };
exports.financeReport   = async (req, res, next) => { try { res.json(await svc.financeReport(tid(req), req.query)); } catch(e){next(e);} };

// ── Settings ──────────────────────────────────────────────────────────────────
exports.getSettings    = async (req, res, next) => { try { res.json(await svc.getSettings(tid(req))); } catch(e){next(e);} };
exports.updateSettings = async (req, res, next) => { try { res.json(await svc.updateSettings(tid(req), req.body)); } catch(e){next(e);} };
