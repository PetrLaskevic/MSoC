<script lang="ts">
  import FloatingToolbar from '$/components/FloatingToolbar.svelte';
  import { Toggle } from '$/components/ui/toggle';
  import { defaultState, inputStateStore } from '$/util/state';
  import BackgroundIcon from '~icons/material-symbols/grid-4x4-rounded';

  if ($inputStateStore.grid === undefined) {
    // Handle cases where old states were saved without grid option
    $inputStateStore.grid = defaultState.grid;
  }
</script>

<!-- Called SyncRoughToolbar because here used to be a toggle for `$inputStateStore.rough`, switching between normal and hand-drawn style -->
<FloatingToolbar>
  <Toggle bind:pressed={$inputStateStore.grid} size="sm" title="Background Grid">
    <BackgroundIcon />
  </Toggle>
</FloatingToolbar>
