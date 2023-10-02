import { Account } from '../../entity/account.entity';
import { AccountActivity } from '../../entity/activities.entity';

export interface AccountPopulated {
  activity: AccountActivity;
}
