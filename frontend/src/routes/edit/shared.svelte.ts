//I do not want to write Svelte 4 Stores, so this
//for shared functions

export function fileNameListToTree(fileNames){
    let temp = new Map();
    let global = temp;
    
    for(let a of fileNames){
        let chunks = a.split("/")
        for(let [index, item] of chunks.entries()){
        if(!temp.has(item)){
            console.log(index)
            if(index != chunks.length -1){
                temp.set(item, new Map());
                // temp[item] = {};
            }else{
                // to distinguish between an empty folder and a file
                // 'permission.js': '' is a file at the end of path
                // "permission.js": {} would be an awkwardly named folder with no children
                // temp[item] = "";
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

let strings = ["a/b/c/d", "a/c/c/d", "a/b/f", "a/b/c/z"];
fileNameListToTree(strings);