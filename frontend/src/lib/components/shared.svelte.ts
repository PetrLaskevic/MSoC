//I do not want to write Svelte 4 Stores, so this
//for shared functions

type FileTreeMap = Map<string, FileTreeMap | string>;

export let fileTree: FileTreeMap;

export function fileNameListToTree(fileNames: string[]): FileTreeMap{
    let temp = new Map();
    let global = temp;
    
    for(let a of fileNames){
        let chunks = a.split("/")
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

export let codePreview = $state({
    show: false,
    jumpToLineNumber: 0
});