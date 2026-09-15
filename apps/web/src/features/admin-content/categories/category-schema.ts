export function validateCategoryInput(value: Record<string, unknown>): string | null {
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 120) return '分類名稱格式不正確';
  if (value.type !== 'news' && value.type !== 'blog') return '分類類型不正確';
  return null;
}
