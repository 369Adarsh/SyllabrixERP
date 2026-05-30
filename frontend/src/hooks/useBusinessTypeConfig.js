import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getBusinessTypeConfig,
  getBusinessTypeCodes,
  isFeatureEnabled,
  isModuleEnabled,
} from '../config/businessTypes';

/**
 * Returns the business type config for the currently logged-in tenant.
 *
 * Usage:
 *   const { config, typeCode, categoryCode, hasModule, hasFeature } = useBusinessTypeConfig();
 *
 *   // Gate a module in the sidebar:
 *   {hasModule('appointments') && <AppointmentsLink />}
 *
 *   // Gate a new feature:
 *   {hasFeature('new_dashboard_v2') && <NewDashboard />}
 *
 *   // Read dashboard KPIs:
 *   config.dashboard.kpis.map(kpi => ...)
 */
export function useBusinessTypeConfig() {
  const { tenant } = useContext(AuthContext);
  const businessType = tenant?.businessType;

  const config       = getBusinessTypeConfig(businessType);
  const { typeCode, categoryCode } = getBusinessTypeCodes(businessType);

  return {
    config,
    typeCode,
    categoryCode,
    hasModule:  (moduleKey)  => isModuleEnabled(businessType, moduleKey),
    hasFeature: (featureKey) => isFeatureEnabled(businessType, featureKey),
  };
}
