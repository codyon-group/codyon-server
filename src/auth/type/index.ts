import { Dayjs } from 'dayjs';
import { Request } from 'express';

export class UserReq extends Request {
  user?: {
    id: string;
    accessToken: string;
  };
}

export class UserInfo {
  id: string;
  password: string;
}

export class AccessTokenInfo {
  token_type: 'Bearer';
  access_token: string;
  access_token_expire_time: Dayjs;
}

export class UserTokenInfo extends AccessTokenInfo {
  refresh_token: string;
  refresh_token_expires_time: Dayjs;
}

export class RefreshTokenInfo {
  id: string;
  iat: number;
  exp: number;
}

export class OauthUserInfo {
  email: string;
  name: string;
  gender: string;
  nickName?: string;
  profile_img?: string;
}

export class SignUpInfo extends OauthUserInfo {
  need_sign_up: boolean;
  session_id: string;
}

export class SignedUserInfo {
  id: string;
  provider: string[];
}

export class KakaoLoginToken {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}
