export const extractNumbersFromString = (str: string): string[] | null => {
  return str.match(/\d+/g);
};
