export const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
