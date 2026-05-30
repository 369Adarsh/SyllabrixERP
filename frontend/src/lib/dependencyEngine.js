export const MODULE_DEPENDENCIES = {
  pos:          ['inventory', 'invoicing'],
  payroll:      ['attendance'],
  fees:         ['customers'],
  campaigns:    ['customers'],
  creditnotes:  ['invoicing'],
  quotations:   ['customers', 'invoicing'],
  returns:      ['inventory', 'invoicing'],
  bills:        ['vendors'],
  subscriptions: ['customers'],
};

export const REVERSE_DEPENDENCIES = {
  inventory: ['pos', 'returns'],
  invoicing: ['pos', 'creditnotes', 'quotations', 'returns'],
  customers: ['fees', 'campaigns', 'quotations', 'subscriptions'],
  attendance: ['payroll'],
  vendors:   ['bills'],
};

// Given a new module key and current canvas modules, returns extra modules to auto-add
export const resolveDependencies = (newKey, currentKeys) => {
  const deps = MODULE_DEPENDENCIES[newKey] || [];
  return deps.filter(d => !currentKeys.includes(d));
};

// Given a key to remove and current canvas, returns which modules would break
export const checkRemovalImpact = (removeKey, currentKeys) => {
  const dependants = REVERSE_DEPENDENCIES[removeKey] || [];
  return dependants.filter(d => currentKeys.includes(d));
};
