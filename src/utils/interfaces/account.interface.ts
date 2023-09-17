import { Account } from '../../entities/account.entity';
import { AccountActivity } from '../../entities/activities.entity';

export interface AccountPopulated {
  activity: AccountActivity;
}
