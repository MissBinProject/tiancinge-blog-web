export function validateCategoryInput(value: Record<string, unknown>): string | null {
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 120) return '分類名稱格式不正確';
  if (value.type !== 'news' && value.type !== 'blog') return '分類類型不正確';
  const description = value.description == null ? '' : String(value.description).trim();
  const seoTitle = value.seoTitle == null ? '' : String(value.seoTitle).trim();
  const seoDescription = value.seoDescription == null ? '' : String(value.seoDescription).trim();
  if (description.length > 2_000 || seoTitle.length > 160 || seoDescription.length > 300) return '分類介紹或 SEO 欄位格式不正確';
  if ([description, seoTitle, seoDescription].some((text) => /<[^>]*>|(?:javascript|data|vbscript):/i.test(text))) return '分類欄位不可包含 HTML 或 script 內容';
  return null;
}

export function categoryPayload(value: Record<string, unknown>) {
  return {
    name: String(value.name).trim(),
    type: value.type,
    description: String(value.description ?? '').trim(),
    seoTitle: String(value.seoTitle ?? '').trim(),
    seoDescription: String(value.seoDescription ?? '').trim(),
    updatedAt: new Date(),
  };
}
