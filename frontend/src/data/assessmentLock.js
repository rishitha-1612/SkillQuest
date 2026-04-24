const STORAGE_KEY = 'skillquest-assessment-lock';

function createPayload(active, meta = {}) {
  return {
    active,
    ...meta,
    updatedAt: Date.now(),
  };
}

export function getAssessmentLock() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { active: false };
  } catch {
    return { active: false };
  }
}

export function setAssessmentLock(active, meta = {}) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPayload(active, meta)));
}

export function clearAssessmentLock(windowId) {
  const current = getAssessmentLock();
  if (!windowId || current.windowId === windowId) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPayload(false)));
  }
}
