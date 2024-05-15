import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@ValidatorConstraint({ name: 'IS_VALID_LIMIT' })
export class validatePaginationLimit implements ValidatorConstraintInterface {
  validate(limit?: string): boolean {
    if (limit != null && (Number(limit) <= 0 || Number(limit) > 100)) return false;
    return true;
  }
}
