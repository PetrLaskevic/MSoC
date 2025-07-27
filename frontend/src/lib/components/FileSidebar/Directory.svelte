<script lang="ts">
    import { FontAwesomeIcon as Icon } from "@fortawesome/svelte-fontawesome";
    import { faCaretRight, faCaretDown, faFolder, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
    import File from "./File.svelte";
    import Directory from "./Directory.svelte";
    import { opened, openFolderPath } from "./index.svelte";
    import { untrack } from "svelte";
    type FileTreeMap = Map<string, FileTreeMap | string>;
    type DirectoryProps = {
        dirObject: FileTreeMap,
        pathFromStart: string,
    }
    let {dirObject, pathFromStart = ""} : DirectoryProps = $props();
    // pathFromStart += "/" + dirObject.name;
    $inspect(dirObject);
    $inspect(opened);

    let expandFolder = $state(false);
    
    for(let item of dirObject.keys()){
        let openedArr: boolean[] = [];
        //thanks to JS, I don't really need to initialise the array whatsoever
        //(the default undefined there is falsy, and ! makes it true upon clicking and stores it)
        // for(let x = 0; x < dirObject.size; x++){
        //     openedArr.push(false);
        // }
        opened[pathFromStart + "/" + item] = openedArr; //+ "/" + item
    }

    for(let item of dirObject.keys()){
        let path = pathFromStart + "/" + item;
        if(openFolderPath.path.startsWith(path)){
            console.log("detected", openFolderPath.path, path);
            // expandFolder = true;
            let openedArr: boolean[] = [];
             for(let x = 0; x < dirObject.size; x++){
                    openedArr.push(true);
            }
            opened[path] = openedArr;
        }
        // expandFolder = false;
    }


    // $effect(() => {
    //     let openedArr: boolean[] = [];
    //     console.log("pathFromStart");
    //     // openFolderPath.path.startsWith(pathFromStart) => everything starts with ""
    //     if(expandFolder){
    //         console.log("that happens")
    //         untrack(() => {
    //             for(let x = 0; x < dirObject.size; x++){
    //                 openedArr.push(true);
    //             }
    //             opened[pathFromStart] = openedArr;
    //         });
    //     }
    // });
</script>

<style>
	button:hover {
		background-color: #dddddd;
	}
	button :global(svg.caret) {
		width: 0.6rem;
		padding-right: 0;
	}
	button :global(svg.folder) {
		width: 1.2rem;
		height: 1rem;
	}

    .pad{
        padding-left: 1rem;
    }
    button{
        width: 100%;
        text-align: start;
        font-size: 1rem;
        height: 1.7rem;
        background-color: transparent;
        border-style: outset;
        border-color: rgb(227, 227, 227);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

{#each dirObject.entries() as [parent, child], index}
    {#if child == ""}
        <File pathFromStart={pathFromStart} name={parent}/>
    {:else}
        <div>
            <button onclick={() => opened[pathFromStart + "/" + parent][index] = !opened[pathFromStart + "/" + parent][index]}>
                {#if opened[pathFromStart + "/" + parent][index]}
                    <Icon class="caret" icon={faCaretDown}/>
                    <Icon class="folder" icon={faFolderOpen}/>
                {:else}
                    <Icon class="caret" icon={faCaretRight}/>
                    <Icon class="folder" icon={faFolder}/>
                {/if}
                {parent}
            </button>
            {#if opened[pathFromStart + "/" + parent][index]}
                <div class="pad">
                    <Directory pathFromStart={pathFromStart + "/" + parent} dirObject={child}/>    
                </div>
            {/if}
        </div>
     {/if}  
{/each}