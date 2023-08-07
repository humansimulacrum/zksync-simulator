// @ts-nocheck
export const getParameterCaseInsensitive = (object: any, key: string) => {
  return object[Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase())];
};
