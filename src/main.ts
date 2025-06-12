const acorn = require("acorn");
const fs = require('node:fs/promises');

async function readProject(directory: string){
    let dirContents = await fs.readdir(directory);
    for (const itemName of dirContents) {
        const path = `${directory}/${itemName}`;
        const item = await fs.stat(path);

        if (item.isDirectory()) {
            console.log(`📁 ${itemName} (directory)`);
            readProject(path);
        }else if (item.isFile()) {
            if (itemName.endsWith('.js') || itemName.endsWith('.ts')) {
                console.log(`📄 ${itemName} (script file)`);
            }
        }
    }
    
    console.log(dirContents);
}
readProject(".") //the src directory