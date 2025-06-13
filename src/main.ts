import { config } from "./config";
import { glob } from 'glob';
const acorn = require("acorn");
const fs = require('node:fs/promises');

async function main(){
    let ignores: string[] = [];
    if(config.useGitIgnore == true){
        ignores.push(... await loadGitIgnore("src/testProjects/yt-anti-translate"));
    }
    if(config.otherIgnores){
        config.otherIgnores = config.otherIgnores.map(
            item => `src/testProjects/yt-anti-translate/${item}`
        );
        console.log(config.otherIgnores);
        ignores.push(...config.otherIgnores);
    }
    readGlobbed("src/testProjects/yt-anti-translate", ignores);
}

main();

async function loadGitIgnore(directory: string) : Promise<string[]> {
    const gitignorePath = `${directory}/.gitignore`;
    try {
        const gitignoreContent: string = await fs.readFile(gitignorePath, 'utf8');
        return gitignoreContent.split('\n').filter(line => line && !line.startsWith('#'));
    } catch (error) {
        throw Error(`No .gitignore in ${directory} detected, but config.useGitIgnore == true`);
    }

}

async function readGlobbed(directory: string, ignores: string[]){
    console.log(directory, ignores)
    const jsfiles = await glob([`${directory}/**/*.js`, `${directory}/**/*.ts`], { ignore: ignores });
    console.log("*********************")
    console.log(jsfiles)
}