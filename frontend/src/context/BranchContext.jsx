import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../api';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { user, tenant } = useAuth();
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranchState] = useState(null);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.role === 'OWNER';
  const hasBranches = Boolean(tenant?.hasBranches);

  const loadBranches = useCallback(async () => {
    if (!hasBranches) { setBranches([]); setCurrentBranchState(null); return; }
    setLoading(true);
    try {
      const res = await api.getBranches();
      const data = res.data?.data || [];
      setBranches(data);
      if (!isOwner && user?.branchId) {
        const b = data.find(x => x.id === user.branchId);
        if (b) setCurrentBranchState(b);
      } else if (isOwner) {
        const saved = localStorage.getItem(`syl_br_${tenant?.id}`);
        if (saved && saved !== 'ALL') {
          const b = data.find(x => x.id === saved);
          if (b) { setCurrentBranchState(b); return; }
        }
        setCurrentBranchState(null); // All branches view by default for owner
      }
    } catch {}
    finally { setLoading(false); }
  }, [hasBranches, tenant?.id, isOwner, user?.branchId]);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const setCurrentBranch = useCallback((branch) => {
    if (!isOwner) return;
    setCurrentBranchState(branch);
    if (tenant?.id) localStorage.setItem(`syl_br_${tenant.id}`, branch?.id || 'ALL');
  }, [isOwner, tenant?.id]);

  return (
    <BranchContext.Provider value={{
      branches,
      currentBranch,
      setCurrentBranch,
      hasBranches,
      canSwitchBranch: isOwner && hasBranches,
      branchId: currentBranch?.id || null,
      loading,
      reloadBranches: loadBranches,
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) return {
    branches: [], currentBranch: null, setCurrentBranch: () => {},
    hasBranches: false, canSwitchBranch: false, branchId: null, loading: false, reloadBranches: () => {},
  };
  return ctx;
}
