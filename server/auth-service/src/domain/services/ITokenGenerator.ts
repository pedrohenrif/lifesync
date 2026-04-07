export interface ITokenGenerator {
  generate(userId: string, role: string): string;
}
