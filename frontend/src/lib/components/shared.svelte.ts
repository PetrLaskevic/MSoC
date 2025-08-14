//I do not want to write Svelte 4 Stores, so this
//for shared functions
import { openedFile } from "./FileSidebar/index.svelte";

type FileTreeMap = Map<string, FileTreeMap | string>;

export let fileTree: FileTreeMap;

export function fileNameListToTree(fileNames: string[]): FileTreeMap{
    let temp = new Map();
    let global = temp;
    //Windows \ in file paths, convert to them when accessing 
    //(to keep original \ in diagram titles, instead of converting to / everywhere)
    if(fileNames[0].includes("\\")){
        console.log("SKIBIDIIIIIIIII");
        openedFile.convertToBackslashes = true;
    }
    for(let a of fileNames){
        //For Windows compatibility, replace \ with /
        //side effect, having \ in Linux filenames is technically possible, so that would be a breaking change
        //there could be a check for that = checking if the path includes \ and /
        //but probably, this wont happen, so replaceAll("\\", "/") is OK, or matching both is OK:
        let chunks = a.split(/\/|\\/); //split on \ or /
        for(let [index, item] of chunks.entries()){
            if(!temp.has(item)){
                console.log(index)
                if(index != chunks.length -1){
                    temp.set(item, new Map());
                }else{
                    // to distinguish between an empty folder and a file
                    // 'permission.js': '' is a file at the end of path
                    // "permission.js": {} would be an awkwardly named folder with no children
                    temp.set(item, "");
                }
            }
            temp = temp.get(item);
        }
        temp = global;
    }
    console.dir(global, {depth: null});
    return global;
}

export let codePreview: {
    show: boolean, 
    jumpToLineNumber: number,
    jumpMode: "top" | "near-top",
    isNotPanning: boolean
} = $state({
    show: false,
    jumpToLineNumber: 0,
    jumpMode: "top",
    isNotPanning: true
});