export const base64Encode = (string) => {
  return Buffer.from(string).toString('base64');
};

export const base64Decode = (base64String) => {
  return Buffer.from(base64String, 'base64').toString('ascii');
};
