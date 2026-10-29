export function insertDictation(current: string, transcript: string, position: number, maxLength?: number) {
  const words = transcript.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const at = Math.max(0, Math.min(position, current.length));
  const before = current.slice(0, at);
  const after = current.slice(at);
  if (words.length === 0) return { value: current, caret: at, truncated: false };

  let inserted = "";
  for (const word of words) {
    const left = `${before}${inserted}`;
    const separator = left && !/\s$|[(\[]$/.test(left) && !/^[,.;!?]/.test(word) ? " " : "";
    const candidate = `${inserted}${separator}${word}`;
    const rightSeparator = after && !/^\s|^[,.;!?)\]]/.test(after) ? " " : "";
    if (maxLength && maxLength > 0 && before.length + candidate.length + rightSeparator.length + after.length > maxLength) {
      if (!inserted) return { value: current, caret: at, truncated: true };
      const value = `${before}${inserted}${rightSeparator}${after}`;
      return { value, caret: before.length + inserted.length, truncated: true };
    }
    inserted = candidate;
  }
  const rightSeparator = after && !/^\s|^[,.;!?)\]]/.test(after) ? " " : "";
  return {
    value: `${before}${inserted}${rightSeparator}${after}`,
    caret: before.length + inserted.length,
    truncated: false,
  };
}
