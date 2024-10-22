export function parseJSON(value: string | undefined) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return undefined;
  }
}
