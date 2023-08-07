/**
 * Random float number
 * @param {Float} min
 * @param {Float} max
 * @param {Integer} decimalPlaces
 * @returns Random float number
 */
export const randomFloatInRange = (min, max, decimalPlaces) => {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, decimalPlaces);

  return Math.floor(rand * power) / power;
};

/**
 * Random int number
 * @param {Integer} min
 * @param {Integer} max
 * @returns Random int number
 */
export const randomIntInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const choose = (array) => {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
};

export const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
};
