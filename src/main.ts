import { config } from "./config";
import { glob } from 'glob';
const acorn = require("acorn");
const fs = require('node:fs/promises');

let acornOptions = {
    ecmaVersion: "2020",
}

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
    if(config.ecmaScriptVersion){
        acornOptions.ecmaVersion = config.ecmaScriptVersion;
    }else{
        console.warn("ES version not specified, defaulting to 2020");
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

//wildly simplified typing information (the library doesn't use TS so doesn't provide its own)
//   Node {
//     type: 'FunctionDeclaration',
//     start: 21101,
//     end: 21590,
//     id: Node {
//       type: 'Identifier',
//       start: 21110,
//       end: 21146,
//       name: 'updateObserverOtherVideosOnIntersect'
//     },
type Node = { 
    //CallExpression can be inside od ExpressionStatement 
    type: "FunctionDeclaration" | "CallExpression" | "ExpressionStatement" | string,
    start: number,
    end: number,
    expression: Node | false,

    name?: string,
    id?: Node,
    async?: boolean,
    //the actual body of the function, which will be type "BlockStatement",
    //where it will have another body / bodies 
    body: Node | Node[],
    params?: any[]
}
function listOfFunctions(jsCode: string) : string[] {
    let functions : string[] = [];
    //while I could loop over the token list an get the top level function declarations, I'm not going to get any functions defined in a function
    const tokens: Node[] = acorn.parse(jsCode, acornOptions).body;
    tokens.forEach((node) => {
        if(node.type == "FunctionDeclaration"){
            //node.id is another Node with type Identifier
            let name = node.id.name;
            functions.push(name);
        }
    });
    // console.log(tokens);
    return functions;
}

async function readGlobbed(directory: string, ignores: string[]){
    console.log(directory, ignores)
    const jsfiles = await glob([`${directory}/**/*.js`, `${directory}/**/*.ts`], { ignore: ignores });
    console.log("*********************")
    for(const filePath of jsfiles){
        let fileContent = await fs.readFile(filePath, 'utf8');
        let functions = listOfFunctions(fileContent);
        if(functions.length == 0){
            console.log(filePath);
        }
    }
}