// User DTO
export interface User {
  displayName: string;
  token: string;
  username: string;
  image?: string;
}

// Register DTO
export interface UserFormValues {
  email: string;
  password: string;
  displayName?: string;
  username?: string;
}
