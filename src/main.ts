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

function getSubStringAcrossLines(loc: acorn.SourceLocation, code: string[]) : string {
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
interface FunctionCallInfo{
    /*Example

    let a = {
        setLogLevel: function (levelName) {
            //content
        }
    }
    
    callName: setLogLevel
    callLocation: 
    parentExpressionLocation: 
    */
    callName: string, //no parameters for now
    //line(s) and column where callName is, to show appropriate source
    callLocation: acorn.SourceLocation,
    //the whole expression the Line is part of (ExpressionStatement)
    parentExpressionLocation: acorn.SourceLocation
    //maybe for clarity in future include the closest related parent "container"
    //i.e ArrayExpression, ObjectExpression etc
    //(objects can be very large, sometimes closest parent is all what is needed for context)
}
function getFunctionCallName(callExpressionNode: acorn.CallExpression, ancestors: acorn.Node[], code: string[]) : FunctionCallInfo {
    //return function call name, the LINE(s) of the CallExpression , and 
    let functionName = getSubStringAcrossLines(callExpressionNode.loc, code);
    //Afaik, there should be only one, they can't be nested
    //ancestors are in descending direction, from the tree root "Program" to our "CallExpression"
    //(so if this was too slow, we can optimize constants a bit by traversing backwards)
    let parentExpression = ancestors.filter((item) => ["ExpressionStatement", "VariableDeclaration"].includes(item.type))[0];
    return {
        callName: functionName,
        callLocation: callExpressionNode.loc,
        parentExpressionLocation: parentExpression.loc
    }
}
function listOfFunctions(jsCode: string) : string[] {
    let jsCodeLines = jsCode.split("\n");
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

    let p = acorn.parse(jsCode, acornOptions)
    walk.ancestor(p, {
        CallExpression(_node, _state, ancestors) {
            let callInfo = getFunctionCallName(_node, ancestors, jsCodeLines);
            functions.push(callInfo.callName);
            // console.log("This call expr ancestors are:", ancestors.map(n => n.type))
        }
    });

    console.log("all nodes\n\n\n");
    // console.dir(p.body, { depth: null })
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
    console.log(listOfFunctions(fileContent));
}

test();