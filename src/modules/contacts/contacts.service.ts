import { User } from "../../database/models/User.model.js";

import { hashPhone } from "../../utils/hashPhone.js";

interface ContactItem {
  name?: string;

  phoneNumber: string;
}

export class ContactsService {
  static async syncContacts(
    contacts: ContactItem[],
    currentUserId: string
  ) {

    if (!contacts) {
      return {
        appUsers: [],
        inviteUsers: []
      };
    }

    const hashes =
      contacts.map((c) =>
        hashPhone(c.phoneNumber)
      );

    const users =
      await User.find({
        phoneHash: {
          $in: hashes
        },

        _id: {
          $ne: currentUserId
        }
      }).select(
        "_id username name currentStreak phoneHash"
      );

    const appUsers =
      users.map((user) => ({
        type: "hibon_user",
        user
      }));

    const existingHashes =
      users.map(
        (u: any) => u.phoneHash
      );

    const inviteUsers =
      contacts.filter(
        (contact) =>
          !existingHashes.includes(
            hashPhone(
              contact.phoneNumber
            )
          )
      );

    return {
      appUsers,
      inviteUsers
    };
  }
}