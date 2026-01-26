function randomId() {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // no-op
  }

  const now = Date.parse(new Date().toISOString());
  return `${now.toString(16)}${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  const key = "fitcoach_device_id";
  let id = "";

  try {
    const cookieValue = document.cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${key}=`));
    if (cookieValue) {
      const raw = cookieValue.slice(key.length + 1);
      const decoded = decodeURIComponent(raw);
      if (decoded) id = decoded;
    }
  } catch {
    id = "";
  }

  try {
    if (!id) id = window.localStorage.getItem(key) ?? "";
  } catch {
    id = id || "";
  }

  if (!id) {
    id = randomId();
    try {
      window.localStorage.setItem(key, id);
    } catch {
      // no-op
    }
  } else {
    try {
      window.localStorage.setItem(key, id);
    } catch {
      // no-op
    }
  }

  try {
    const maxAge = 60 * 60 * 24 * 365 * 3;
    document.cookie = `${key}=${encodeURIComponent(id)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    // no-op
  }

  return id;
}
