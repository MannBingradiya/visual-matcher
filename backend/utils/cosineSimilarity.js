export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}
