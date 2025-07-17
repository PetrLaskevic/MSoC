<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

    function getName(diagram: string): string{
        return diagram.split("---")[1].slice("\n../testProjects/".length);
    }

    let currentText = $state("");
    let fileNameDiagram: { [key: string]: string } = $state({});
    for(let diagramText of data.data){
        fileNameDiagram[getName(diagramText)] = diagramText;
    }
    console.log(data);
</script>
<h1>BirdsEye</h1>

{#each Object.entries(fileNameDiagram) as [fileName, diagram]}
    <button onclick={() => currentText = diagram }>{fileName}</button>
{/each}

<pre>{currentText}</pre>