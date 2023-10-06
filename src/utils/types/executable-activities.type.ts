import { ActivityType } from '../enums/activity-type.enum';

export type ExecutableActivity = Exclude<ActivityType, ActivityType.Rank>;
