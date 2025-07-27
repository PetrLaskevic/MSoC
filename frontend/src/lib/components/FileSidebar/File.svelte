<script>
    import { FontAwesomeIcon as Icon } from "@fortawesome/svelte-fontawesome";
    import { faFileCode } from "@fortawesome/free-solid-svg-icons"
    import { openedFile } from "./index.svelte";
    let { name, pathFromStart } = $props();
    pathFromStart += "/" + name;

    function selectThisFile(){
        openedFile.name = name;
        openedFile.path = pathFromStart;
        console.log($state.snapshot(openedFile));
    }
</script>

<style>
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
	button:not(.selected):hover {
		background-color: lightgray;
	}
    .selected{
        background: #000000bf;
        color: white;
    }
</style>

<div>
    <button onclick={selectThisFile} class:selected={pathFromStart == openedFile.path}> <Icon icon={faFileCode}/> {name}</button>
</div>