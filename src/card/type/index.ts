export class DetailCardInfo {
  id: string;
  user_id: string;
  img_key: string;
  created_time: Date;
  user: {
    UserProfile: {
      nick_name: string;
      img_url?: string;
      height: string;
      weight: string;
      feet_size: string;
      mbti: string;
    };
  };
}

export class ResDetailCardInfo {
  id: string;
  user_id: string;
  card_img: string;
  created_time: Date;
  user_profile: {
    nick_name: string;
    profile_img?: string;
    height: string;
    weight: string;
    feet_size: string;
    mbti: string;
  };
}

export class CardUserInfo {
  nick_name: string;
  height: string;
  weight: string;
  feet_size: string;
  sns_id?: string;
  mbti: string;
}

export class CardInfo {
  user_id: string;
  img_key: string;
}

export class Card {
  id: string;
  card_img: string;
  views_count: number;
  like_count: number;
  created_time: Date;
}

export class Pagination {
  cursor: string;
  is_end: boolean;
}

export class CardDetail {
  id: string;
  card_img: string;
  created_time: Date;
}
