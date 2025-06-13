import { config } from "./config";
import { glob } from 'glob';
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import * as fs from 'node:fs/promises';

let acornOptions: acorn.Options = {
    ecmaVersion: 2020,
    locations: true,
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
        ignores.push(...config.otherIgnores);
    }
    if(config.ecmaScriptVersion){
        acornOptions.ecmaVersion = config.ecmaScriptVersion;
    }else{
        console.warn("ES version not specified, defaulting to 2020");
    }
    // readGlobbed("src/testProjects/yt-anti-translate", ignores);
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

function getFunctionCallName(callExpressionNode: acorn.CallExpression) : string {
    let parentNode = callExpressionNode.callee;
    let wholeName: string[] = [];
    //leaf of the CallExpression => (sometimes MemberExpression when a.b.c() ) => Identifier chain
    let leafIdentifierName = ""; 
    while(parentNode.type != "Identifier"){
        if(parentNode.type == "MemberExpression"){
            //for static a.b.c() type of situations
            //doesn't support a[b].c() yet
            if(parentNode.property.type == "Identifier"){
                wholeName.push(parentNode.property.name);
            }
            //to continue loop, .object holds the parent, 
            // so in "a.b.c" it eventually leads us to "a", where parentNode.name will get it
            parentNode = parentNode.object;
        }
    }
    // the whole name for `callbackify()` when chain is CallExpression.callee => Identifier.name => callbackify
    // the first part (chrome) when the structure is:
    //  chrome.storage.sync.get
    //  CallExpression.callee => MemberExpression .object => MemberExpression .object => MemberExpression .object => Identifier
    //                             .property: "get"           .property: "sync"           .property: "storage"          .name: "chrome"
    //  => that's the reason for the while loop above
    leafIdentifierName = parentNode.name;
    wholeName.push(leafIdentifierName);
    wholeName.reverse();
    return wholeName.join(".");
}
function listOfFunctions(jsCode: string) : string[] {
    let functions : string[] = [];
    //while I could loop over the token list an get the top level function declarations, I'm not going to get any functions defined in a function
    // const tokens: Node[] = acorn.parse(jsCode, acornOptions).body;
    // console.log(tokens)
    // tokens.forEach((node) => {
    //     if(node.type == "FunctionDeclaration"){
    //         //node.id is another Node with type Identifier
    //         let name = node.id.name;
    //         functions.push(name);
    //     }
    // });
    // console.log(tokens);

    walk.simple(acorn.parse(jsCode, acornOptions), {
        ArrowFunctionExpression(node) {
            // console.log(`Found an arrow function:`);
            // console.dir(node, { depth: null });
        },
        FunctionExpression(node){
            // console.log(`Found a function:`)
            // console.dir(node, { depth: null });
        },
        ExpressionStatement(node){
            // console.log(`Found an expression statement:`);
            // console.dir(node, { depth: null });
        },
        CallExpression(node){
            console.log(getFunctionCallName(node));
            //detecting chrome.storage.sync.get
            
        }
    });

    // console.log("all nodes\n\n\n");
    // console.dir(acorn.parse(jsCode, acornOptions).body, { depth: null })

    return functions;
}

// async function readGlobbed(directory: string, ignores: string[]){
//     console.log(directory, ignores)
//     //TODO: test how well acorn supports .ts files (if no, tell the user to compile ts files in js first)
//     const jsfiles = await glob([`${directory}/**/*.js`, `${directory}/**/*.ts`], { ignore: ignores });
//     console.log("*********************")
//     for(const filePath of jsfiles){
//         let fileContent = await fs.readFile(filePath, 'utf8');
//         let functions = listOfFunctions(fileContent);
//         if(functions.length == 0){
//             console.log(filePath);
//         }
//     }
// }

// src/testProjects/yt-anti-translate/app/src/permission.js
// src/testProjects/yt-anti-translate/app/src/global.js
// src/testProjects/yt-anti-translate/app/src/content_start.js
// src/testProjects/yt-anti-translate/app/src/content_injectglobal.js
async function test(){
    let fileContent = await fs.readFile("src/testProjects/yt-anti-translate/app/src/content_start.js", 'utf8');
    listOfFunctions(fileContent);
}

test();