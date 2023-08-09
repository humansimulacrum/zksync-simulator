import { Account, AccountModel } from '../entities/account.entity';

export const updateActivity = async (account: Account, activityModule) => {
  const updatedActivity = await activityModule.getActivity(account.walletAddress);
  return AccountModel.updateOne({ walletAddress: account.walletAddress }, { ...updatedActivity });
};
