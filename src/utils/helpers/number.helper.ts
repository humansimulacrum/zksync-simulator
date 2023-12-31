export const substractPercentage = (amount: number | string, percentage: number) => {
  const amountInNumber = Number(amount);

  return Math.floor(amountInNumber - amountInNumber * percentage);
};
