function getNestedField(obj, path) {
  if (!obj || !path) return undefined;

  const parts = path.split(".");
  let current = obj;

  for (const key of parts) {
    if (Array.isArray(current)) {
      const restPath = parts.slice(parts.indexOf(key)).join(".");
      return current
        .map((item) => getNestedField(item, restPath))
        .filter((v) => v !== undefined && v !== null);
    }

    // guard against null before key in object
    if (current === null || typeof current !== "object" || !(key in current)) {
      return undefined;
    }

    current = current[key];
  }

  // Handle permissions arrays nicely
  if (Array.isArray(current) && current.length && typeof current[0] === "object" && "entity" in current[0]) {
    return current
      .map((perm) => {
        const entity = perm.entity || "-";
        const allowed = Array.isArray(perm.allowed) ? perm.allowed.join(", ") : "";
        const denied = Array.isArray(perm.denied) ? perm.denied.join(", ") : "";
        return `${entity} → allowed: ${allowed} | denied: ${denied}`;
      })
      .join("\n");
  }

  // Handle arrays
  if (Array.isArray(current)) {
    return current
      .map((item) => (typeof item === "object" ? JSON.stringify(item) : item))
      .join(", ");
  }

  // Handle plain objects
  if (current && typeof current === "object" && !(current instanceof Date)) {
    return JSON.stringify(current);
  }

  // Handle Dates
  if (current instanceof Date) {
    return current.toISOString();
  }

  return current;
}

module.exports = getNestedField;