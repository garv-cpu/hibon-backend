export interface SyncContactsInput {
  contacts: {
    name?: string;
    phoneNumber: string;
  }[];
}