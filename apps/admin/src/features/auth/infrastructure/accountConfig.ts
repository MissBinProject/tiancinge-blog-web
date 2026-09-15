/** The public login alias maps to the existing Firebase administrator identity. */
export const accountEmailMap: Record<string, string> = {
  tiancinge: 'ouyangtaisen@gmail.com',
};

export function emailForUsername(username: string): string | null {
  return accountEmailMap[username] ?? null;
}
