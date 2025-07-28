<script lang="ts">
    import { FontAwesomeIcon as Icon } from "@fortawesome/svelte-fontawesome";
    import { faCaretRight, faCaretDown, faFolder, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
    import File from "./File.svelte";
    import Directory from "./Directory.svelte";
    import { opened, openFolderPath } from "./index.svelte";

    type FileTreeMap = Map<string, FileTreeMap | string>;
    type DirectoryProps = {
        dirObject: FileTreeMap,
        pathFromStart: string,
    }
    let {dirObject, pathFromStart = ""} : DirectoryProps = $props();
    $inspect(dirObject);
    $inspect(opened);
    
    for(let item of dirObject.keys()){
        let openedArr: boolean[] = [];
        //thanks to JS, I don't really need to initialise the array whatsoever
        //(the default undefined there is falsy, and ! makes it true upon clicking and stores it)
        // for(let x = 0; x < dirObject.size; x++){
        //     openedArr.push(false);
        // }
        opened[pathFromStart + "/" + item] = openedArr;
    }

    for(let item of dirObject.keys()){
        let path = pathFromStart + "/" + item;
        if(openFolderPath.path.startsWith(path)){
            console.log("detected", openFolderPath.path, path);
            let openedArr: boolean[] = [];
             for(let x = 0; x < dirObject.size; x++){
                    openedArr.push(true);
            }
            opened[path] = openedArr;
        }
    }
</script>

<style>
	button:hover {
		background-color: var(--fileSidebar-hover); /*#dddddd;*/
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        /* for TailWind which sets padding 0px which does not look good
        especially for the top most folder - there is no space between the caretDown and the left border
        */
        padding: revert !important;
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