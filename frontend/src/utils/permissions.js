export const getEffectivePermissions = (user) => {
  const base = user?.role === 'admin'
    ? { dashboard: true, operations: true, profile: true, reports: true, usersAdmin: true }
    : { dashboard: true, operations: true, profile: true, reports: false, usersAdmin: false };

  return { ...base, ...(user?.permissions || {}) };
};

export const hasFeatureAccess = (user, feature) => Boolean(getEffectivePermissions(user)[feature]);
