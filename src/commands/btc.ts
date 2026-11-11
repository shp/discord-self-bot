import { Message } from "discord.js-selfbot-v13";
import { config } from "../index.js";


export default class BtcCommand {
    static selfOnly = false;
    static adminOnly = false;
    static aliases = [];
    static args = [];
    static description = "Gets btc address";
    static async callback(message: Message, ...args: string[]): Promise<string> {
        return config.ADDRESSES.BTC;
    }
}