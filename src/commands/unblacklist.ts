import { Message, User } from "discord.js-selfbot-v13";
import { isUserAdmin, isUserBlacklisted, removeIdsToFile } from "../index.js";

const dir = import.meta.dirname;

export default class UnblacklistCommand {
    static selfOnly = true;
    static adminOnly = false;
    static aliases = [];
    static args = [];
    static description = "[self] Unblacklists user from using commands";
    static async callback(message: Message<true>, ...args: string[]): Promise<string> {
        const mentions = message.mentions.users;

        const adminIds = [];
        const ids = [];

        for (const [_, val] of mentions.entries()) {
            if (val.id === message.author.id) continue;
            if (!isUserBlacklisted(val.id)) continue;
            ids.push(val.id);
        }

        for (const arg of args) {
            const id = Number(arg)
            if (id > 1e9) {
                if (arg === message.author.id) continue;
                if (!isUserBlacklisted(arg)) continue;
                ids.push(arg);
            }
        }

        if (ids.length == 0) return "Couldn't find anyone to unblacklist";

        removeIdsToFile("blacklisted", ...ids);
        

        return `Unblacklisted ${[...(new Set(ids))].join(", ")}`;
    }
}