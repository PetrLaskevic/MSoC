import { glob } from 'glob';
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import * as fs from 'node:fs/promises';
import { loadGitIgnore, getSubStringAcrossLines } from './utils.js';

let acornOptions: acorn.Options = {
    ecmaVersion: 2020,
    locations: true,
    sourceType: "module"
}
//The configuration for the project you're analyzing
export interface Config {
    //the directory of the project we want to analyze
    analysisTargetDir: string,
    //exclude .gitignore entries from analysis?
    useGitIgnore?: boolean,
    //What the authors wanted to have in git, but what we want to exclude from analysis
    //evaluated with analysisTargetDir as base directory
    otherIgnores?: string[],
    //default if not specified 2020
    ecmaScriptVersion?: acorn.Options["ecmaVersion"] //"latest" or number 2020 etc
}

/*
Internal graph format which is then used for export to Mermaid format:
    Stores outgoing calls from each function 
    (basically, what functions does it depend on to finish its task)

each of the string[] values is a node (key) as well, leaves are represented as `key: []`
*/
type CodeGraph = Map<string, string[]>;

let functionDeclarationLineMap : {[FilePath: string]: {[FunctionName: string]: number}}  = {};


/**
 * Converts the internal graph format @param {CodeGraph} oneFileObject to the Mermaid.js graph format
 * For interactivity it adds click event callbacks to nodes of the Mermaid graph (as per Mermaid official API)
 *
 * (For callback functionality, function `callback` must be defined in the global scope where the graph is rendered
 *  like so: `window.callback = function(nodeName) { ... };`
 * )
 * @param {string} filePath is for title of the Mermaid diagram
 * @returns {string} The Mermaid diagram
*/
function generateMermaidGraphText(filePath: string, oneFileObject: CodeGraph) : string{
    let result = "";
    result += `---\n${filePath}\n---\n`;
    result += "flowchart LR\n"; //LR is left right, a lot more compact than TD = top down
    for(let [nodeFrom, nodesTo] of oneFileObject.entries()){
        //A hack for mermaid.js, which can't process a node with a space in its name
        //Not even with quotes
        if(nodeFrom == "top level"){
            nodeFrom = "A[top level]"; //nodeIdentifier[any string] is supported
        }
        //I want to have () in addEventListener node text, to communicate the type of event
        //For that, "" are needed => which only works inside: someIdentifier["text()"]
        if(nodeFrom.includes("addEventListener")){
            //So just remove brackets from the identifier
            nodeFrom = `${nodeFrom.replaceAll(/\(|\)/g, "")}["\`${nodeFrom}\`"]`;
        }
        if(nodesTo.length == 0){
            result += `${nodeFrom}\n`;
        }else{
            for(let nodeTo of nodesTo){
                result += `${nodeFrom} --> ${nodeTo}\n`;
            }
        }
    }
    //loop it the second time, to add the click handler to every node
    //  => I did not inline this because I wanted better readability of the graph text while debugging
    //(the mermaid syntax does not allow it wildcards to specify the same one to all)
    //hopefully it stands that every node has its own entry
    //having duplicate click listener statements for every edge (as with nodeTo) would be bad
    for(let nodeFrom of oneFileObject.keys()){
        // console.log("nodefr", nodeFrom);
        if(nodeFrom == "top level"){
            nodeFrom = "A";
        }
        //for addEventListener, strip () in node identifiers
        nodeFrom = nodeFrom.replaceAll(/\(|\)/g, "");
        //"callback" = the name of the global function in View.svelte
        //since we can't detect any functions in global.js properly at all, so functionDeclarationLineMap[filePath] is undefined
        //use optional chaining between computed property (the []) accesses, with its weird ?. syntax
        result += `click ${nodeFrom} call callback("${nodeFrom}", ${functionDeclarationLineMap[filePath]?.[nodeFrom] || nodeFrom.split(":")[1]})\n`;
    }
    return result;
}

type FileNames = string[];
type FileNameDiagramMap = {[key: string]: string};
export async function main(config?: Config): Promise<[FileNames, FileNameDiagramMap]>{
    functionDeclarationLineMap = {};
    //either supply config as a parameter or as a TS file with `export config: Config = { ... }` inside 
    if(!config){
        const process = await import("node:process");
        console.log(`No config parameter supplied, reading ${process.cwd()}/config.ts`);
        try{
            //I wanted to keep config as a .ts (and not .json) file for typechecking and comments (which JSON.Parse wouldn't be happy about)
            /*for this dynamic import:
             - both ts and js work for standalone - just running main.ts with `npx tsx main.ts`
             - only js works for Sveltekit app importing main.ts and running dev server (no bundler) == npm run dev
             - neither works with the SvelteKit app importing main.ts and running with a bundler (npm run build && npm run preview)
                 the ts does not work, saying: 
                    TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /home/petr/Documents/msoc/codebase overview/frontend/config.ts
                        at Object.getFileProtocolModuleFormat [as file:] (node:internal/modules/esm/get_format:219:9)
                        at defaultGetFormat (node:internal/modules/esm/get_format:245:36)
                        at defaultLoad (node:internal/modules/esm/load:120:22)
                        at async ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:580:32)
                        at async ModuleJob._link (node:internal/modules/esm/module_job:116:19) {
                    code: 'ERR_UNKNOWN_FILE_EXTENSION'
                 => so this was making its way in the final result, not transpiled to js I suppose since else it would be shouting ERR_MODULE_NOT_FOUND and not that .ts ending is weird
                 => but node version I'm using does not support running TypeScript
                => and vite preview (which runs when npm run preview is called for the SvelteKit project) 
                    only runs the .js files = just lets node do it
                    and does not support inserting `tsx` in the business
                    => I guess I could dynamically import basically this:
                            import { register } from 'ts-node';
                            register();
                        before the config.ts import

                        but I'm already using tsx for parts of the project (code-scanner)
                        so this feels meh => maybe it could work tho, idk
            */
            config = (await import(`${process.cwd()}/config.ts`)).config; 
        } catch (error) {
            console.log(error);
            throw Error(`No config.ts in ${process.cwd()} detected at runtime. \nIf you're using a bundler (webpack/rollup/vite etc.), do not use the "config.ts" file. Instead give config as a parameter to "main"`);
        }
    }

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
    let allFilesCallGraph = await callGraphPerFileForAllFiles(config.analysisTargetDir, ignores)
    let allDiagrams: FileNameDiagramMap = {};
    let allFilePaths: string[] = [];
    for(let [filePath, callGraphInside] of allFilesCallGraph){
        allDiagrams[filePath] = generateMermaidGraphText(filePath, callGraphInside);
        allFilePaths.push(filePath);
    }
    return [allFilePaths, allDiagrams];
}

//If this is not imported, call main 
//same idea as __name__ == '__main__' in Python
if (process.argv[1] === import.meta.filename) {
    main({
    analysisTargetDir: "../testProjects/yt-anti-translate",
    useGitIgnore: true,
    otherIgnores: [
        "node_modules",
        ".git",
        ".github",
        "eslint.config.js",
        "playwright.config.js",
        "tests/**",
        "app/src/background_audio.js",
        "app/src/background_description.js",
        "app/src/background.js",
        "app/src/content_channelbranding.js",
        "app/src/content_injectglobal.js",
        "app/src/content_start.js",
        "app/src/global.js",
        "app/src/permission.js"
    ]}).then((e) => console.log(e));
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

    calledFrom: string
}

function getFunctionCallName(callExpressionNode: acorn.CallExpression, ancestors: acorn.Node[], code: string[], filePath: string) : FunctionCallInfo {
    //return function call name, the LINE(s) of the CallExpression , and 
    let functionName = getSubStringAcrossLines(callExpressionNode.loc, code);
    //Afaik, there should be only one, they can't be nested
    //ancestors are in descending direction, from the tree root "Program" to our "CallExpression"
    //traversing backwards, since for example for loops can be nested (we want to return the closest ancestor)
    let parentExpression;
    let calledFrom = "";

    let foundFunction = false;
    //It seems like the only way to find out where from a call has been made is to go up the ancestor list and report all function declarations on the way
    for(let x = ancestors.length - 1; x >= 0; x--){
        let item = ancestors[x];                          //i.e. inside if                       //if(foo())
        if(["ExpressionStatement", "VariableDeclaration", "LogicalExpression", "ForOfStatement", "IfStatement", "ReturnStatement", "ArrowFunctionExpression", "FunctionExpression"].includes(item.type)){
            //TODO: fix this - same as FunctionDeclaration check, this needs to find the nearest containing structure
            //using break; is not an option since FunctionDeclaration checks are in the same loop
            //but a booolean flag will work
            parentExpression = item;
        }
        if(item.type == "FunctionDeclaration"){
            calledFrom = (item as acorn.FunctionDeclaration).id.name;
            foundFunction = true;
            /*
            we only need to find the closest function
            reason, example with nested function decl in a function decl:
                fn a(){
                    fn b(){
                        c();
                    }
                    b();
                }
            the resulting graph:
            c from b 
            b from a

            => so the b() call must be there, else it's dead code and not relevant
                => when b() is there, the graph will work

            => also meaning, c was called in b, but there was no c() in a directly 
            */
            break;
        }
        //called from arrow function () => {} which might not have a name
        //or it inded might: let foo = () => {}
        //TODO: support extracting a name from such assignment
        else if(
            item.type == "ArrowFunctionExpression" || //() => {}
            item.type == "FunctionExpression" //function(){}
        ){
            //For functions defined as properties of objects: let a = {setLogLevel: function (levelName) {}}
            if(ancestors[x-1]?.type == "Property"){
                calledFrom = ((ancestors[x-1] as acorn.Property)!.key as acorn.Identifier)!.name //setLogLevel
                foundFunction = true;
                //Add it to function declarations
                if(!functionDeclarationLineMap[filePath]){
                    functionDeclarationLineMap[filePath] = {};
                }
                //Search the rest of ancestors for the name of the object this is assigned to
                let assignedTo = "";
                for(x - 1; x >= 0; x--){
                    //TODO: Do similar with VariableDeclarator
                    if(ancestors[x].type == "AssignmentExpression"){
                        ((ancestors[x] as acorn.AssignmentExpression).left as acorn.Identifier).name 
                        let leftSide = (ancestors[x] as acorn.AssignmentExpression).left;
                        if(leftSide.type == "Identifier"){
                            assignedTo = leftSide.name;
                            break;
                        }else if(leftSide.type == "MemberExpression"){
                            //this should also be done recursively... (as it can be nested unlimitedly)
                            //or just take my favorite shortcut
                            assignedTo = getSubStringAcrossLines(leftSide.loc, code);
                            break;
                        }
                    }
                }
                if(assignedTo){
                    calledFrom = assignedTo + "." + calledFrom;
                }
                functionDeclarationLineMap[filePath][calledFrom] = item.loc.start.line;
                break;
            }
            calledFrom = `anonymous_function:${item.loc.start.line}`;
            foundFunction = true;
            break;
        }
    }

    if(!foundFunction){
        calledFrom = "top level";
    }

    // if(parentExpression == undefined){
    //     throw Error("To ne");
    // }
    return {
        shortCallName: functionName.split("(")[0],
        callName: functionName,
        callLocation: callExpressionNode.loc,
        parentExpressionLocation: parentExpression?.loc,
        calledFrom: calledFrom
    }
}

/**
 * From @param {string} jsCode, generates an Abstract-Syntax-Tree (AST),
 * which it then traverses to find all function calls and function declarations
 * to return a call-graph
 
 * @param {string} filePath for storing function declaration locations per file and for debugging (gives context where we are currently)
 * @returns {CodeGraph} Outgoing calls from each function (basically, what functions does it depend on to finish its task)
*/
function listOfFunctions(jsCode: string, filePath: string) : CodeGraph {
    let jsCodeLines = jsCode.split("\n");
    //calledFrom: calledWhat
    //I believe that every meaninguful function that should appear in this function, must make some function call
    //except a hypothetical function which would just assign to global or just have a long switch inside
        //=> for those functions, I will listen for a function declaration
    const functions: CodeGraph = new Map();
    // console.log("jsCode", jsCode, filePath);
    let p = acorn.parse(jsCode, acornOptions)
    walk.ancestor(p, {
        CallExpression(_node, _state, ancestors) {
            let callInfo = getFunctionCallName(_node, ancestors, jsCodeLines, filePath);
            let callback: string;
            //addEventListener support
                //split "("[0] does not work for document.getElementById("save-api-key-button").addEventListener("click", apiKeyUpdate);
            // callInfo.shortCallName.includes("addEventListener")
            if(_node.callee.type == "MemberExpression" &&  _node.callee.property.type == "Identifier" && _node.callee.property.name == "addEventListener"){
                let realShortCallNameLoc:acorn.SourceLocation = {
                    start: {line: 0, column: 0},
                    end:   {line: 0, column: 0}
                };
                //The name location until the start of the callacj argument
                realShortCallNameLoc.start = callInfo.callLocation.start;
                realShortCallNameLoc.end = _node.arguments[1].loc.start;
                //'document.getElementById("save-api-key-button").addEventListener("click",' 
                let realShortCallName = getSubStringAcrossLines(realShortCallNameLoc, jsCodeLines).trim();
                realShortCallName = realShortCallName.replace(/,$/, ")"); //=> remove the last ,' and replace with )
                realShortCallName = realShortCallName.replaceAll('"',"'"); //for Mermaid, which can't have " inside of "" and "" or `""` are needed to escape ()
                let eventType = _node.arguments[0].type == "Literal" && _node.arguments[0].value;
                if(
                    _node.arguments[1].type == "ArrowFunctionExpression" ||
                    _node.arguments[1].type == "FunctionExpression"
                ){
                    callback = `anonymous_function:${_node.arguments[1].loc.start.line}`;
                }else if(_node.arguments[1].type == "Identifier"){
                    callback = _node.arguments[1].name;
                }
                //not good: callInfo.shortCallName == document.getElementById for "document.getElementById("save-api-key-button").addEventListener("click", apiKeyUpdate)"
                functions.set(realShortCallName + ":" + _node.loc.start.line, [callback]);
                return;
            }
            
            //callInfo.callName for parameters
            if(!functions.has(callInfo.calledFrom)){
                functions.set(callInfo.calledFrom, []);
            }
            functions.get(callInfo.calledFrom).push(callInfo.shortCallName);
            // functions.push(callInfo.shortCallName + " from " + callInfo.calledInFunctions);
        },
        //type of function declaration from acorn.d.ts
        // export interface FunctionDeclaration extends Function {
        //   type: "FunctionDeclaration"
        //   id: Identifier
        //   body: BlockStatement
        // }
        FunctionDeclaration(_node, _state, ancestors) {
            //for any "insular" function which is not called from anywhere
            let name = _node.id.name;
            if(!functions.has(name)){
                functions.set(name, []);
            }
            
            if(!functionDeclarationLineMap[filePath]){
                functionDeclarationLineMap[filePath] = {};
            }
            functionDeclarationLineMap[filePath][name] = _node.loc.start.line;
            console.log(name, _node.loc.start.line);
            // console.log("got functionDeclaration", name);
        },
        // MutationObserver and IntersectionObserver support
        NewExpression(node){
            if(
                node.callee.type == "Identifier" &&
                (node.callee.name == "MutationObserver" ||
                node.callee.name == "IntersectionObserver")
            ){
                let line = node.loc.start.line;
                //new MutationObserver(untranslate)
                if(node.arguments[0].type == "Identifier"){
                    let callback = node.arguments[0].name;
                    functions.set(`${node.callee.name}:${line}`, [callback]);
                }
                //new MutationObserver(() => {}), it has no name, but must have a unique identifier - i.e. its line location
                else if(node.arguments[0].type == "ArrowFunctionExpression"){
                    let callbackLine = node.arguments[0].loc.start.line;
                    functions.set(`${node.callee.name}:${line}`, [`anonymous_function:${callbackLine}`]);
                }else{
                    throw Error("Cannot process argument of MutationObserver, it is not a function", {cause: node});
                }
            }
        }
    });

    functions.forEach((value, key, map) => {
        
        map.set(key, value.filter(
            fn => map.has(fn) || //filters out all JS standard functions (leaves only user defined functions)
            fn.includes(":")) //allows what we've found notable (anonymous functions) back in
        );
    });

    return functions;
}

/**
* Reads any js files inside @param {string} directory to unlimited depth,
* using @param {string[]} ignores to limit its search, in `.gitignore` format 
* (which means bash-like * and ** globs)
* 
* and generates a call graph for each file.
*  
* @returns { Promise<Map<string, CodeGraph>> } Map<filePath, callGraph>
*/
async function callGraphPerFileForAllFiles(directory: string, ignores: string[]): Promise<Map<string, CodeGraph>>{
    console.log(directory, ignores)
    //TODO: test how well acorn supports .ts files (if no, tell the user to compile ts files in js first)
    //=> it doesn't, so removing `${directory}/**/*.ts` from `glob()` arguments
    //TODO: maybe it could with a plugin, try https://github.com/sveltejs/acorn-typescript
    const jsfiles = await glob([`${directory}/**/*.js`], { ignore: ignores });
    console.log("*********************")
    let allFunctions: Map<string, CodeGraph> = new Map();
    for(const filePath of jsfiles){
        let fileContent = await fs.readFile(filePath, 'utf8');
        let functions = listOfFunctions(fileContent, filePath);
        if(functions.size == 0){
            console.log("no functions in", filePath);
            break;
        }
        allFunctions.set(filePath, functions);
    }
    return allFunctions;
}