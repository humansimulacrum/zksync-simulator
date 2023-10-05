export function getDaysAgo(numberOfDays: number) {
  const date = new Date();
  date.setDate(date.getDate() - numberOfDays);

  return date.toISOString();
}
