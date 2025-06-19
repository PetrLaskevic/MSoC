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
        ignores.push(... await loadGitIgnore(config.analysisTargetDir));
    }
    if(config.otherIgnores){
        config.otherIgnores = config.otherIgnores.map(
            item => `${config.analysisTargetDir}/${item}`
        );
        ignores.push(...config.otherIgnores);
    }
    if(config.ecmaScriptVersion){
        acornOptions.ecmaVersion = config.ecmaScriptVersion;
    }else{
        console.warn("ES version not specified, defaulting to 2020");
    }
    readGlobbed(config.analysisTargetDir, ignores);
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
    shortCallName: string //no parameters 
    callName: string, //with parameters
    //line(s) and column where callName is, to show appropriate source
    callLocation: acorn.SourceLocation,
    //the whole expression the Line is part of (ExpressionStatement)
    parentExpressionLocation: acorn.SourceLocation
    //maybe for clarity in future include the closest related parent "container"
    //i.e ArrayExpression, ObjectExpression etc
    //(objects can be very large, sometimes closest parent is all what is needed for context)

    calledInFunctions: string[]
}
function getFunctionCallName(callExpressionNode: acorn.CallExpression, ancestors: acorn.Node[], code: string[], filePath: string) : FunctionCallInfo {
    //return function call name, the LINE(s) of the CallExpression , and 
    let functionName = getSubStringAcrossLines(callExpressionNode.loc, code);
    //Afaik, there should be only one, they can't be nested
    //ancestors are in descending direction, from the tree root "Program" to our "CallExpression"
    //traversing backwards, since for example for loops can be nested (we want to return the closest ancestor)
    let parentExpression;
    let calledFrom : string[] = [];

    let foundFunction = false;
    //It seems like the only way to find out where from a call has been made is to go up the ancestor list and report all function declarations on the way
    for(let x = ancestors.length - 1; x >= 0; x--){
        let item = ancestors[x];                          //i.e. inside if                       //if(foo())
        if(["ExpressionStatement", "VariableDeclaration", "LogicalExpression", "ForOfStatement", "IfStatement", "ReturnStatement"].includes(item.type)){
            parentExpression = item;
        }
        if(item.type == "FunctionDeclaration"){
            calledFrom.push((item as acorn.FunctionDeclaration).id.name);
            foundFunction = true;
        }
    }

    if(!foundFunction){
        calledFrom.push("top level")
    }

    if(parentExpression == undefined){
        throw Error("To ne");
    }
    return {
        shortCallName: functionName.split("(")[0],
        callName: functionName,
        callLocation: callExpressionNode.loc,
        parentExpressionLocation: parentExpression.loc,
        calledInFunctions: calledFrom
    }
}
function listOfFunctions(jsCode: string, filePath: string) : string[] {
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
            let callInfo = getFunctionCallName(_node, ancestors, jsCodeLines, filePath);
            //callInfo.callName for parameters
            functions.push(callInfo.shortCallName + " from " + callInfo.calledInFunctions);
        },
        // FunctionDeclaration(_node, _state, ancestors) {
        //     console.log("got functionDeclaration")
        // }
    });

    // console.log("all nodes\n\n\n");
    // console.dir(p.body, { depth: null })
    // console.dir(acorn.parse(jsCode, acornOptions).body, { depth: null })

    return functions;
}


async function readGlobbed(directory: string, ignores: string[]){
    console.log(directory, ignores)
    //TODO: test how well acorn supports .ts files (if no, tell the user to compile ts files in js first)
    const jsfiles = await glob([`${directory}/**/*.js`, `${directory}/**/*.ts`], { ignore: ignores });
    console.log("*********************")
    for(const filePath of jsfiles){
        let fileContent = await fs.readFile(filePath, 'utf8');
        let functions = listOfFunctions(fileContent, filePath);
        if(functions.length == 0){
            console.log(filePath);
            break;
        }
        console.log(filePath);
        console.log(functions);
    }
}

// src/testProjects/yt-anti-translate/app/src/permission.js
// src/testProjects/yt-anti-translate/app/src/global.js
// src/testProjects/yt-anti-translate/app/src/content_start.js //ok
// src/testProjects/yt-anti-translate/app/src/content_injectglobal.js //ok


// async function test(){
//     let fileContent = await fs.readFile("src/testProjects/yt-anti-translate/app/src/background_audio.js", 'utf8');
//     // listOfFunctions(fileContent);
//     console.log(listOfFunctions(fileContent));
// }

// test();