export const randomFloatInRange = (min, max, decimalPlaces) => {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, decimalPlaces);

  return Math.floor(rand * power) / power;
};

export const randomIntInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const choose = <Type>(array: Type[]): Type => {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
};

export const shuffle = <Type>(array: Type[]): Type[] => {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
};
