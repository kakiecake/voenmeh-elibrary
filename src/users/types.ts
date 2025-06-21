export const USER_ROLES = {
  Reader: 1,
  Admin: 2,
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export type User = {
  id: number;
  role: UserRole;
  email: string;
  createdAt: Date;
};

export type DbUser = User & {
  passwordHash: string;
};
