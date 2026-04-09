export type RegisterUserDto = {
  /** Optional; preferred name is set in onboarding. */
  readonly name?: string;
  readonly email: string;
  readonly password: string;
};
