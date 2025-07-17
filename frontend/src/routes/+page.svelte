<script lang="ts">
    import mermaid, { type RenderResult } from "mermaid";
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

    function getName(diagram: string): string{
        return diagram.split("---")[1].slice("\n../testProjects/".length);
    }

    let currentText = $state("");
    let selectedFileName = $state("");
    let fileNameDiagram: { [key: string]: string } = $state({});
    for(let diagramText of data.data){
        fileNameDiagram[getName(diagramText)] = diagramText;
    }
    console.log(data);

    let result: HTMLDivElement;
    $effect(() => {
        mermaid.render('mermaid', currentText).then(e => {
            result.innerHTML = e.svg;
        });
    });
</script>
<h1>BirdsEye</h1>

{#each Object.entries(fileNameDiagram) as [fileName, diagram]}
    <button class="item" class:selected={selectedFileName == fileName} onclick={() => {currentText = diagram; selectedFileName = fileName;mermaid.initialize({ startOnLoad: true });}  }>{fileName}</button>
{/each}

<div bind:this={result}></div>
<pre>{currentText}</pre>

<style>
    .item{
        margin: 2px;
        font-size: 1rem;
    }
    .selected{
        outline: 3px solid #6495ed;
        border-radius: 4px;
    }
</style>