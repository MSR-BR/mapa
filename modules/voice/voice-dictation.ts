export function appendDictation(current: string, transcript: string, maxLength?: number) {
  const spoken = transcript.trim().replace(/\s+/g, " ");
  if (!spoken) return { value: current, truncated: false };
  let value = current;
  for (const word of spoken.split(" ")) {
    const next = `${value}${value && !/\s$/.test(value) ? " " : ""}${word}`;
    if (maxLength && maxLength > 0 && next.length > maxLength) return { value, truncated: true };
    value = next;
  }
  return { value, truncated: false };
}
