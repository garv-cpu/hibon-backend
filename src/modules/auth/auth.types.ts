export interface SafeUser {
  _id: string;
  username: string;
  email: string;
  name?: string;
  avatar: string;
  avatarEmoji?: string;
  bio?: string;
  currentStreak: number;
  longestStreak: number;
}
