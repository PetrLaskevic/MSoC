<script lang="ts">
  import View from '$/components/View.svelte';
  import { initHandler } from '$/util/util';
  import { onMount } from 'svelte';
  import { stateStore } from '$/util/state';
  onMount(initHandler);
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
  <title>{"BirdsEye - " + $stateStore.filePath!.split("/").pop()}</title>
</svelte:head>

<View shouldShowGrid={false} />
