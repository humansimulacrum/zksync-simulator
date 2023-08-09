import mongoose from 'mongoose';

export const connectToDb = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/zksync-sim');
};
