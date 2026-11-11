import { Message } from "discord.js-selfbot-v13";
import { config } from "../index.js";


export default class EthCommand {
    static selfOnly = false;
    static adminOnly = false;
    static aliases = ["bnb"];
    static args = [];
    static description = "Gets eth/bnb address";
    static async callback(message: Message, ...args: string[]): Promise<string> {
        return config.ADDRESSES.ETH;
    }
}