export const extractNumbersFromString = (str: string): string[] | null => {
  return str.match(/\d+/g);
};

export function capitalizeFirstLetter(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
