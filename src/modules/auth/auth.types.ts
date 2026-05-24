export interface SafeUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  currentStreak: number;
  longestStreak: number;
}