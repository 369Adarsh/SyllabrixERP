const svc = require('./training.service');
const { ok, created, notFound } = require('../../utils/response');

// Exercises
const listExercises  = async (req, res, next) => { try { ok(res, await svc.listExercises(req.tenantId)); } catch (e) { next(e); } };
const createExercise = async (req, res, next) => { try { created(res, await svc.createExercise(req.tenantId, req.body)); } catch (e) { next(e); } };
const updateExercise = async (req, res, next) => { try { ok(res, await svc.updateExercise(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteExercise = async (req, res, next) => { try { ok(res, await svc.deleteExercise(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const seedExercises  = async (req, res, next) => { try { ok(res, await svc.seedExercises(req.tenantId)); } catch (e) { next(e); } };

// Templates
const listTemplates  = async (req, res, next) => { try { ok(res, await svc.listTemplates(req.tenantId)); } catch (e) { next(e); } };
const createTemplate = async (req, res, next) => { try { created(res, await svc.createTemplate(req.tenantId, req.body)); } catch (e) { next(e); } };
const updateTemplate = async (req, res, next) => { try { ok(res, await svc.updateTemplate(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteTemplate = async (req, res, next) => { try { ok(res, await svc.deleteTemplate(req.tenantId, req.params.id)); } catch (e) { next(e); } };
const getTemplate    = async (req, res, next) => {
  try {
    const t = await svc.getTemplate(req.tenantId, req.params.id);
    if (!t) return notFound(res, 'Template not found');
    ok(res, t);
  } catch (e) { next(e); }
};

// Template days
const addDay          = async (req, res, next) => { try { created(res, await svc.addDay(req.params.id, req.body)); } catch (e) { next(e); } };
const updateDay       = async (req, res, next) => { try { ok(res, await svc.updateDay(req.params.dayId, req.body)); } catch (e) { next(e); } };
const deleteDay       = async (req, res, next) => { try { ok(res, await svc.deleteDay(req.params.dayId)); } catch (e) { next(e); } };
const addExToDayCtrl  = async (req, res, next) => { try { created(res, await svc.addExerciseToDay(req.params.dayId, req.body)); } catch (e) { next(e); } };
const updateDayExCtrl = async (req, res, next) => { try { ok(res, await svc.updateDayExercise(req.params.exId, req.body)); } catch (e) { next(e); } };
const removeDayExCtrl = async (req, res, next) => { try { ok(res, await svc.removeDayExercise(req.params.exId)); } catch (e) { next(e); } };

// Member plans
const listMemberPlans  = async (req, res, next) => { try { ok(res, await svc.listMemberPlans(req.tenantId, req.query.trainerId || null)); } catch (e) { next(e); } };
const assignPlan       = async (req, res, next) => { try { created(res, await svc.assignPlan(req.tenantId, req.body)); } catch (e) { next(e); } };
const updateMemberPlan = async (req, res, next) => { try { ok(res, await svc.updateMemberPlan(req.tenantId, req.params.id, req.body)); } catch (e) { next(e); } };
const deleteMemberPlan = async (req, res, next) => { try { ok(res, await svc.deleteMemberPlan(req.tenantId, req.params.id)); } catch (e) { next(e); } };

// Sessions
const listSessions = async (req, res, next) => { try { ok(res, await svc.listSessions(req.params.planId)); } catch (e) { next(e); } };
const logSession   = async (req, res, next) => { try { created(res, await svc.logSession(req.params.planId, req.body)); } catch (e) { next(e); } };

// Misc
const getActivity = async (req, res, next) => { try { ok(res, await svc.getActivity(req.tenantId, req.query.trainerId || null)); } catch (e) { next(e); } };
const getStats    = async (req, res, next) => { try { ok(res, await svc.getStats(req.tenantId, req.query.trainerId || null)); } catch (e) { next(e); } };

// Member Card
const getMemberCard = async (req, res, next) => {
  try { ok(res, await svc.getMemberCard(req.tenantId, req.params.memberId)); } catch (e) { next(e); }
};

// Body Stats
const addBodyStats = async (req, res, next) => {
  try { created(res, await svc.addBodyStats(req.tenantId, req.body)); } catch (e) { next(e); }
};
const getBodyStats = async (req, res, next) => {
  try { ok(res, await svc.getBodyStats(req.tenantId, req.params.memberId)); } catch (e) { next(e); }
};

// Trainer Notes
const addTrainerNote = async (req, res, next) => {
  try { created(res, await svc.addTrainerNote(req.tenantId, req.body)); } catch (e) { next(e); }
};
const getTrainerNotes = async (req, res, next) => {
  try { ok(res, await svc.getTrainerNotes(req.tenantId, req.params.memberId)); } catch (e) { next(e); }
};

// Trainer Board & Performance
const getTrainerBoard = async (req, res, next) => {
  try { ok(res, await svc.getTrainerBoard(req.tenantId, req.query.trainerId || null)); } catch (e) { next(e); }
};
const getTrainerPerformance = async (req, res, next) => {
  try { ok(res, await svc.getTrainerPerformance(req.tenantId)); } catch (e) { next(e); }
};

module.exports = {
  listExercises, createExercise, updateExercise, deleteExercise, seedExercises,
  listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate,
  addDay, updateDay, deleteDay, addExToDayCtrl, updateDayExCtrl, removeDayExCtrl,
  listMemberPlans, assignPlan, updateMemberPlan, deleteMemberPlan,
  listSessions, logSession, getActivity, getStats,
  getMemberCard, addBodyStats, getBodyStats, addTrainerNote, getTrainerNotes,
  getTrainerBoard, getTrainerPerformance,
};
