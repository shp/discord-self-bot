import { Message } from "discord.js-selfbot-v13";
import { config } from "../index.js";


export default class LtcCommand {
    static selfOnly = false;
    static adminOnly = false;
    static aliases = [];
    static args = [];
    static description = "Gets ltc address";
    static async callback(message: Message, ...args: string[]): Promise<string> {
        return config.ADDRESSES.LTC;
    }
}