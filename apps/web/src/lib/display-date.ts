/** Display only the calendar date. Firestore imports may contain an ISO time. */
export function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  return match ? `${match[1]} / ${match[2]} / ${match[3]}` : value;
}
