import { capitalizeFirstLetter } from '.';
import { englishWords } from '../const/words.const';

export const randomFloatInRange = (min: number, max: number, decimalPlaces: number) => {
  const rand = Math.random() * (max - min) + min;
  const power = Math.pow(10, decimalPlaces);

  return Math.floor(rand * power) / power;
};

export const randomIntInRange = (min: number, max: number) => {
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

export const generateName = () => {
  const dictionaryLength = englishWords.length;
  return englishWords[randomIntInRange(0, dictionaryLength)] + englishWords[randomIntInRange(0, dictionaryLength)];
};

export function generateSentence(numOfWords: number): string {
  if (numOfWords <= 0) {
    return '.';
  }

  const dictionaryLength = englishWords.length;
  const selectedWords: string[] = [];

  for (let i = 0; i < numOfWords; i++) {
    const randomWord = englishWords[Math.floor(Math.random() * dictionaryLength)];

    if (i === 0) {
      selectedWords.push(capitalizeFirstLetter(randomWord));
    } else {
      selectedWords.push(randomWord);
    }
  }

  return selectedWords.join(' ') + '.';
}
