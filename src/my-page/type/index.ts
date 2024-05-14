export class UserProfile {
  nick_name: string;
  img_url?: string;
  description?: string;
  gender: string;
  height: string;
  weight: string;
  feet_size: string;
  sns_id?: string;
  favorite_style?: string[];
  mbti?: string;
}

export class UserRelationCnt {
  follower: number;
  following: number;
}

export interface MyPage
  extends Omit<UserProfile, 'description' | 'favorite_style' | 'gender' | 'sns_id'>,
    UserRelationCnt {
  item_cnt: number;
}

export class ChangeUserProfile extends UserProfile {
  igm_url?: string;
}
