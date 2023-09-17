export function getDaysAgo(numberOfDays) {
  const date = new Date();
  date.setDate(date.getDate() - numberOfDays);

  return date.toISOString();
}
