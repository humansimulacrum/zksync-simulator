export function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).toISOString();
}

export function getDaysAgo(numberOfDays) {
  const d = new Date();
  d.setDate(d.getDate() - numberOfDays);

  return d.toISOString();
}
