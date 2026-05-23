export type RangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

export const ranges: RangeKey[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export function daysForRange(range: string | null): number {
  switch (range) {
    case "1D":
      return 1;
    case "1W":
      return 7;
    case "1M":
      return 31;
    case "3M":
      return 93;
    case "6M":
      return 186;
    case "1Y":
      return 366;
    default:
      return 31;
  }
}

export function formatNseDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

