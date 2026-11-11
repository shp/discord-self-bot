import { Message } from "discord.js-selfbot-v13";
import { readdirSync } from "node:fs";
import { CommandFile } from "../index.js";
import ansis from "ansis";

const dir = import.meta.dirname;

export default class HelpCommand {
    static selfOnly = false;
    static adminOnly = false;
    static aliases = [];
    static args = [];
    static description = "Generates this command";
    static async callback(message: Message, ...args: string[]): Promise<string> {
        let str = `\`\`\`ansi\n${ansis.blueBright("Commands")}`;
        for (const file of readdirSync(dir, { withFileTypes: true})) {
            const fullPath = file.parentPath + "/" + file.name;
            const command = (await import(fullPath)).default as CommandFile;
            
            const aliases = command.aliases ?? [];
            const lastDotIndex = file.name.lastIndexOf(".");
            let fileName = file.name;
            if (lastDotIndex > 0) {
                fileName =  file.name.substring(0, lastDotIndex);
            }
            const commandName = [fileName, ...aliases].join(ansis.cyan("/"));
            let argText = "";
            for (const arg of command.args ?? []) {
                argText += ` ${ansis.red("[")}${arg.name !== null ? arg.name + ": " : ""}${arg.type !== null ? ansis.red(arg.type) : ""}${ansis.red("]")}`;
            }
            str += `\n\t${ansis.cyan("-")} ${commandName}${argText}${command.description ? " " + ansis.cyanBright(command.description) : ""}`;
        }
        str += "\n```"
        return str;
    }
}