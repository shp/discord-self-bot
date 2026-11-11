import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Client, Message } from "discord.js-selfbot-v13";

process.env.FORCE_COLOR = "3"; // force ansis to work

const dir = import.meta.dirname + "/";

export interface Config {
    CLIENT_TOKEN: string;
    PREFIX: string;
    ADDRESSES: {
        BTC: string;
        ETH: string;
        LTC: string;
        SOL: string;
    };
}

export interface arg {
    name?: string,
    type?: string
}

export interface Command {
    selfOnly: boolean;
    adminOnly: boolean;
    description?: string;
    args?: arg[]
    callback: (message: Message, ...args: string[]) => Promise<string>;
}

export interface CommandFile extends Command {
    aliases?: string[]
}

let admins = new Set();
let blacklisted = new Set();

export function isUserAdmin(id: string) {
    return admins.has(id);
}

export function isUserBlacklisted(id: string) {
    return blacklisted.has(id);
}

export function addIdsToFile(file: "admins" | "blacklisted", ...ids: string[]) {
    if (file == "blacklisted") {
        for (const id of ids) {
            blacklisted.add(id);
        }
        writeFileSync(dir + "../blacklisted.json", JSON.stringify([...blacklisted]))
    } else {
        for (const id of ids) {
            admins.add(id);
        }
        writeFileSync(dir + "../admins.json", JSON.stringify([...admins]))
    } 
}

export function removeIdsToFile(file: "admins" | "blacklisted", ...ids: string[]) {
    if (file == "blacklisted") {
        for (const id of ids) {
            blacklisted.delete(id);
        }
        writeFileSync(dir + "../blacklisted.json", JSON.stringify([...blacklisted]))
    } else {
        for (const id of ids) {
            admins.delete(id);
        }
        writeFileSync(dir + "../admins.json", JSON.stringify([...admins]))
    } 
}

export let config: Config;

const DEFAULT_CONFIG = {
    PREFIX: "!",
    ADDRESSES: {
        "BTC": "",
        "ETH": "",
        "LTC": "",
        "SOL": ""
    }
}

;(async () => {
    const configPath = dir + "../config.json";
    const adminsPath = dir + "../admins.json";
    const blacklistedPath = dir + "../blacklisted.json";

    
    const paths = {[configPath]: JSON.stringify(DEFAULT_CONFIG), [adminsPath]: "[]", [blacklistedPath]: "[]"};
    for (const [path, defaultValue] of Object.entries(paths)) {
        if (!existsSync(path)) writeFileSync(path, defaultValue);
    }

    config = await JSON.parse(readFileSync(configPath).toString())as Config;
    admins = new Set(await JSON.parse(readFileSync(adminsPath).toString()) as string[]);
    blacklisted = new Set(await JSON.parse(readFileSync(blacklistedPath).toString()) as string[]);

    if (!config.CLIENT_TOKEN) throw new Error("Client token was not found");

    function fillDefault(tbl: Record<string, any>, defaultValue: Record<string, any>): boolean {
        let diff = false;
        for (const [key, val] of Object.entries(defaultValue)) {
            if (!tbl[key] && tbl[key] !== false) {
                tbl[key] = val;
                diff = true;
            }  else if (typeof tbl[key] === "object") {
                if (fillDefault(tbl[key], defaultValue[key])) {
                    diff = true;
                }
            }
        }
        return diff;
    }

    try {
        if (fillDefault(config, DEFAULT_CONFIG)) {
            writeFileSync(configPath, JSON.stringify(config, null, 4));
        }
    } catch(err) {
        console.error(err);
    }

    const client = new Client() as Client<true>;
    let id = "0";

    const commands: Record<string, Command> = {};

    for (const file of readdirSync(dir + "commands", { withFileTypes: true})) {
        const fullPath = file.parentPath + "/" + file.name;
        const command = (await import(fullPath)).default as CommandFile;

        const aliases = command.aliases ?? [];
        const lastDotIndex = file.name.lastIndexOf(".");
        let fileName = file.name;
        if (lastDotIndex > 0) {
            fileName =  file.name.substring(0, lastDotIndex);
        }
        for (const name of [...aliases, fileName]) {
            commands[name] = {
                selfOnly: command.selfOnly,
                adminOnly: command.adminOnly,
                callback: command.callback
            }
        }
    }

    client.on("ready", async readyClient => {
        id = client.user.id;
        console.log(`Logged in as ${readyClient.user.tag}`);
    })

    client.on("messageCreate", async message => {
        if (message.system) return;
        const authorId = message.author.id;
        if (isUserBlacklisted(authorId)) return;

        const mentions = message.mentions;
        const isSelfMessage = authorId === id;
        const isReplyToMe = mentions.repliedUser !== null && mentions.repliedUser.id === id;
        const isMentioningMe = mentions.parsedUsers.has(id);
        const isDM = message.channel.type === "DM" || message.channel.type === "GROUP_DM";

        if (!isSelfMessage && !isReplyToMe && !isMentioningMe && !isDM) return;
        let content = message.content.toLowerCase();
        if (isMentioningMe) {
            content = content.replaceAll(`<@${id}>`, "");
        }
        content = content.trim();

        if (!content.startsWith(config.PREFIX)) return;
        content = content.substring(config.PREFIX.length, content.length);

        const args = content.split(" ");
        const command = commands[args[0]];
        if (!command || (command.selfOnly && !isSelfMessage) || (command.adminOnly && !isSelfMessage && !isUserAdmin(authorId))) return;

        const val = await command.callback(message, ...(args.splice(1, args.length)));

        if (isSelfMessage) {
            message.edit(val);
        } else {
            message.reply(val);
        }
    })

    await client.login(config.CLIENT_TOKEN);
})();