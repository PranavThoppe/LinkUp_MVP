function hash32(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Slot row indexes this voter counts toward for a given day.
 * Spread across 1–2 slots so Morn/Aftn/Eve/Night rows can differ without real per-slot data.
 */
export function slotIndexesForVoterOnDay(sender: string, iso: string, slotCount: number): number[] {
  if (slotCount <= 0) return [];
  const h1 = hash32(`${sender}\0${iso}\0slot`);
  const h2 = hash32(`${sender}\0${iso}\0spread`);
  const primary = Math.abs(h1) % slotCount;
  const spreadMode = Math.abs(h2) % 3;
  if (spreadMode === 0) return [primary];
  if (spreadMode === 1) {
    return Array.from(new Set([primary, (primary + 1) % slotCount]));
  }
  return Array.from(new Set([primary, (primary + slotCount - 1) % slotCount]));
}

export function countVotersInSlot(
  voters: string[],
  iso: string,
  slotIndex: number,
  slotCount: number
): number {
  return voters.filter(v => slotIndexesForVoterOnDay(v, iso, slotCount).includes(slotIndex)).length;
}

export function maxSlotVoteCount(
  votesByDay: Map<string, string[]>,
  dayKeys: readonly string[],
  slotCount: number
): number {
  let max = 0;
  for (const iso of dayKeys) {
    const voters = votesByDay.get(iso) ?? [];
    for (let si = 0; si < slotCount; si++) {
      max = Math.max(max, countVotersInSlot(voters, iso, si, slotCount));
    }
  }
  return max;
}
