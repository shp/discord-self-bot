import { Message, User } from "discord.js-selfbot-v13";
import { isUserAdmin, isUserBlacklisted, addIdsToFile, removeIdsToFile } from "../index.js";

const dir = import.meta.dirname;

export default class BlacklistCommand {
    static selfOnly = true;
    static adminOnly = false;
    static aliases = [];
    static args = [];
    static description = "[self] Blacklists user from using commands";
    static async callback(message: Message<true>, ...args: string[]): Promise<string> {
        const mentions = message.mentions.users;

        const adminIds = [];
        const ids = [];

        for (const [_, val] of mentions.entries()) {
            if (val.id === message.author.id) continue;
            if (isUserBlacklisted(val.id)) continue;
            if (isUserAdmin(val.id)) {
                adminIds.push(val.id);
            }
            ids.push(val.id);
        }

        for (const arg of args) {
            const id = Number(arg)
            if (id > 1e9) {
                if (arg === message.author.id) continue;
                if (isUserBlacklisted(arg)) continue;
                if (isUserAdmin(arg)) {
                    adminIds.push(arg);
                }
                ids.push(arg);
            }
        }

        if (adminIds.length > 0) {
            removeIdsToFile("admins", ...adminIds)
        }

        if (ids.length == 0) return "Couldn't find anyone to blacklist";

        addIdsToFile("blacklisted", ...ids);
        

        return `Blacklisted ${[...(new Set(ids))].join(", ")}`;
    }
}