export type MonthGridCell = { day: number; inMonth: boolean };

export function toISODateLocal(y: number, m0: number, day: number) {
  const year = y;
  const month = String(m0 + 1).padStart(2, '0');
  const date = String(day).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function parseISODateLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function monthName(month: number) {
  return new Date(2000, month, 1).toLocaleString(undefined, { month: 'long' });
}

export function buildMonthGridMonFirst(month: number, year: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startIndexMonFirst = (firstOfMonth.getDay() + 6) % 7; // Monday=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: MonthGridCell[] = [];

  for (let i = 0; i < startIndexMonFirst; i++) {
    const day = daysInPrevMonth - (startIndexMonFirst - 1 - i);
    cells.push({ day, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true });
  }

  // Pad to full weeks (multiples of 7) and keep at least 5 rows for stable layout.
  while (cells.length < 35 || cells.length % 7 !== 0) {
    const trailingDay = cells.length - (startIndexMonFirst + daysInMonth) + 1;
    cells.push({ day: trailingDay, inMonth: false });
  }

  return cells;
}

export function buildMonthGridSunFirst(month: number, year: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startIndexSunFirst = firstOfMonth.getDay(); // Sunday=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: MonthGridCell[] = [];

  for (let i = 0; i < startIndexSunFirst; i++) {
    const day = daysInPrevMonth - (startIndexSunFirst - 1 - i);
    cells.push({ day, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true });
  }

  // Pad to full weeks (multiples of 7) and keep at least 5 rows for stable layout.
  while (cells.length < 35 || cells.length % 7 !== 0) {
    const trailingDay = cells.length - (startIndexSunFirst + daysInMonth) + 1;
    cells.push({ day: trailingDay, inMonth: false });
  }

  return cells;
}
