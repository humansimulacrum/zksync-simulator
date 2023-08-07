export const extractNumbersFromString = (str: string): string[] => {
  return str.match(/\d+/g) as string[];
};
