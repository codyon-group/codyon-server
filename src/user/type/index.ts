export class UserDetails {
  nickName: string;
  gender: string;
  height: string;
  weight: string;
  feetSize: string;
  styles: string[];
  snsId?: string;
}

export class CreateUser extends UserDetails {
  email: string;
  password: string;
}

export class CreateOauthUser extends UserDetails {
  email: string;
  provider: string;
  img_url?: string;
}
