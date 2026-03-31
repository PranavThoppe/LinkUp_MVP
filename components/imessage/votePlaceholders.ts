/**
 * When there are no real votes yet, spreads synthetic availability across day columns
 * so the slot grid shows some green cells (same idea as seeded CalendarCard sample data).
 */
export function buildPlaceholderVotes(
  days: string[],
  senders: Record<string, { initial: string; color: string }>
): { sender: string; dates: string[] }[] {
  const senderIds = Object.keys(senders);
  if (days.length === 0 || senderIds.length === 0) return [];

  const perSender = new Map<string, Set<string>>();
  for (const id of senderIds) perSender.set(id, new Set());

  days.forEach((iso, i) => {
    const k = (i * 7 + 11) % 10;
    if (k === 0 || k === 1) return;
    const count = k % 3 === 0 ? 2 : 1 + (k % 2);
    for (let c = 0; c < count; c++) {
      const sid = senderIds[(i + c) % senderIds.length];
      perSender.get(sid)!.add(iso);
    }
  });

  return senderIds
    .map(s => ({ sender: s, dates: Array.from(perSender.get(s)!) }))
    .filter(v => v.dates.length > 0);
}
