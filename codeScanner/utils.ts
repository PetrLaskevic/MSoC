import { type SourceLocation} from "acorn";
import * as fs from 'node:fs/promises';

export async function loadGitIgnore(directory: string) : Promise<string[]> {
    const gitignorePath = `${directory}/.gitignore`;
    try {
        const gitignoreContent: string = await fs.readFile(gitignorePath, 'utf8');
        return gitignoreContent.split('\n').filter(line => line && !line.startsWith('#'));
    } catch (error) {
        const process = await import("node:process");
        throw Error(`No .gitignore in "${directory}" resolved from "${process.cwd()}" detected, but config.useGitIgnore == true`);
    }
}

export function getSubStringAcrossLines(loc: SourceLocation, code: string[]) : string {
    if(!code){
        throw Error("Argument code must be provided!");
    }
    if(!loc){
        throw Error("acorn.SourceLocation with the code must be provided!");
    }
    //1 indexed lines, 0 indexed columns
    let start = loc.start; //start: Position { line: 3, column: 0 }, //column included
    let end = loc.end; //end: Position { line: 3, column: 18 } //column not included
    if(start.line == end.line){
        return code[start.line-1].slice(start.column, end.column);
    }
    let lines = code.slice(start.line-1, end.line); //1 indexed
    lines[0] = lines[0].slice(start.column, lines[0].length);
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, end.column);
    lines = lines.map(line => line.trim());
    return lines.join("");
}