import { useState, useEffect, useCallback } from 'react';
import { getModuleFeatureMap } from '../api';
import { useBranch } from '../context/BranchContext';

/**
 * Returns a feature map for a given module, merged for the current branch.
 *
 * Usage:
 *   const { features, has, loading } = useModuleFeatures('SYL-MOD-POS');
 *   if (has('pos.barcode_scanner')) { ... }
 */
export function useModuleFeatures(moduleKey) {
  const { branchId } = useBranch();
  const [features, setFeatures] = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    if (!moduleKey) return;
    try {
      setLoading(true);
      const params = branchId ? { branchId } : {};
      const res = await getModuleFeatureMap(moduleKey, params);
      setFeatures(res.data.data || {});
    } catch (err) {
      setError(err);
      // On error, default to ALL features enabled so the UI doesn't break
      setFeatures({});
    } finally {
      setLoading(false);
    }
  }, [moduleKey, branchId]);

  useEffect(() => { load(); }, [load]);

  /**
   * Check if a feature is enabled.
   * When still loading or on error, returns true (fail-open so UI never breaks).
   */
  const has = useCallback(
    (featureKey) => {
      if (loading || error) return true;
      // If feature key not in map at all, default to enabled
      if (!(featureKey in features)) return true;
      return features[featureKey] === true;
    },
    [features, loading, error]
  );

  return { features, has, loading, error, reload: load };
}
