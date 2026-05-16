export type RewardContext =
  | 'free_test'
  | 'seven_day_challenge'
  | 'giveid'
  | 'paid_30day';

export type RewardType = 'sns' | 'review' | 'both';

export type BadgeLevel = 'gold' | 'silver';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface UserReward {
  id: string;
  user_id: string | null;
  result_id: string | null;
  reward_context: RewardContext | null;
  reward_type: RewardType | null;
  unlocked: boolean | null;
  generated_content: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export type UserRewardInsert = {
  id?: string;
  user_id?: string | null;
  result_id?: string | null;
  reward_context?: RewardContext | null;
  reward_type?: RewardType | null;
  unlocked?: boolean | null;
  generated_content?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserRewardUpdate = Partial<UserRewardInsert>;

export interface HallOfFame {
  id: string;
  user_id: string | null;
  nickname: string | null;
  badge_level: BadgeLevel | null;
  completion_rate: number | null;
  context: string | null;
  created_at: string | null;
}

export type HallOfFameInsert = {
  id?: string;
  user_id?: string | null;
  nickname?: string | null;
  badge_level?: BadgeLevel | null;
  completion_rate?: number | null;
  context?: string | null;
  created_at?: string | null;
};

export type HallOfFameUpdate = Partial<HallOfFameInsert>;

export interface ReviewRewardColumns {
  sns_shared: boolean | null;
  review_context: string | null;
}
