const rolesService = require('./roles.service');
const { ok, created } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const roles = await rolesService.list(req.tenantId);
    ok(res, roles);
  } catch (err) { next(err); }
};

const get = async (req, res, next) => {
  try {
    const role = await rolesService.get(req.tenantId, req.params.id);
    ok(res, role);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const role = await rolesService.create(req.tenantId, req.body);
    created(res, role, 'Role created');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const role = await rolesService.update(req.tenantId, req.params.id, req.body);
    ok(res, role, 'Role updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await rolesService.remove(req.tenantId, req.params.id);
    ok(res, {}, 'Role deleted');
  } catch (err) { next(err); }
};

const assignToUser = async (req, res, next) => {
  try {
    const user = await rolesService.assignToUser(req.tenantId, req.params.userId, req.body.roleId);
    ok(res, user, 'Role assigned');
  } catch (err) { next(err); }
};

module.exports = { list, get, create, update, remove, assignToUser };
