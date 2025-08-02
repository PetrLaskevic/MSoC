// place files you want to import through the `$lib` alias in this folder.
export let openedFile = $state({
    name: "",
    path: "",
    source: ""
});

export let opened: { [key: string]: boolean[]} = $state({ //| ["allOpen"]
    
});


export let openFolderPath = $state({path: ""});

export function open(filePath: string){
    console.log("opening programmatically", filePath);
    if(!filePath.startsWith("/")){
        filePath = "/" + filePath;
    }
    let folderPart = "";
    let filePart = "";

    let temp = filePath.split("/");
    filePart = temp.pop() as string;
    folderPart = temp.join("/");
    console.log("folderPart", folderPart);
    console.log("file part", filePart);
    openFolderPath.path = folderPart;
    openedFile.path = filePath;
    openedFile.name = filePart;
}