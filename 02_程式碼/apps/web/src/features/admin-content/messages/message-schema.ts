export function validateMessagePatch(value: Record<string, unknown>): string | null {
  if (value.status != null && value.status !== 'unread' && value.status !== 'handled') return '留言狀態不正確';
  if (value.note != null && (typeof value.note !== 'string' || value.note.length > 2_000)) return '備註格式不正確';
  for (const key of Object.keys(value)) if (!['status', 'note'].includes(key)) return `不允許修改留言欄位：${key}`;
  return null;
}
