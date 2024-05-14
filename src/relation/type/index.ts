export class UserList {
  id: number;
  toUser?: {
    UserProfile: {
      user_id: string;
      img_url: string;
      nick_name: string;
      height: string;
      weight: string;
      feet_size: string;
      mbti: string;
    };
  };
  fromUser?: {
    UserProfile: {
      user_id: string;
      img_url: string;
      nick_name: string;
      height: string;
      weight: string;
      feet_size: string;
      mbti: string;
    };
  };
}

export class Pagination {
  cursor: string;
  is_end: boolean;
}

export class Conditions {
  type: 'FOLLOW' | 'BLOCK';
  from?: string;
  to?: string;
}

export class ResUserList {
  id: string;
  user_profile: {
    user_id: string;
    img_url: string;
    nick_name: string;
    height: string;
    weight: string;
    feet_size: string;
    mbti: string;
  };
}
