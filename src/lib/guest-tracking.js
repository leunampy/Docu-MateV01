// Simple localStorage-based tracking for guest and authenticated users.
const STORAGE_KEY = "guestGenerationTracking";
const MONTHLY_LIMIT = 5;

const safeParse = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getStore = () => {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
};

const saveStore = (data) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const getGuestId = () => {
  if (typeof window === "undefined") return "guest-server";
  const existing = window.localStorage.getItem("guestId");
  if (existing) return existing;
  const newId =
    (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
    `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem("guestId", newId);
  return newId;
};

export const checkMonthlyLimit = (userId) => {
  const id = userId || getGuestId();
  const store = getStore();
  const month = currentMonth();
  const userMonth = store[id]?.[month] || { count: 0 };
  const remaining = Math.max(MONTHLY_LIMIT - userMonth.count, 0);

  return {
    success: true,
    limit: MONTHLY_LIMIT,
    used: userMonth.count,
    remaining,
    canGenerate: remaining > 0,
  };
};

export const trackGeneration = (documentType, userId) => {
  const id = userId || getGuestId();
  const store = getStore();
  const month = currentMonth();

  if (!store[id]) store[id] = {};
  if (!store[id][month]) store[id][month] = { count: 0, history: [] };

  store[id][month].count += 1;
  store[id][month].history.push({
    documentType,
    timestamp: new Date().toISOString(),
  });

  saveStore(store);

  return {
    success: true,
    limit: MONTHLY_LIMIT,
    used: store[id][month].count,
    remaining: Math.max(MONTHLY_LIMIT - store[id][month].count, 0),
  };
};

