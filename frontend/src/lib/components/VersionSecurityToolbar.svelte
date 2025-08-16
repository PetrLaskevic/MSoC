<script lang="ts">
  import FloatingToolbar from '$/components/FloatingToolbar.svelte';
  import Privacy from '$/components/Privacy.svelte';
  import { Button } from '$/components/ui/button';
  import { version } from 'mermaid/package.json';
</script>

<FloatingToolbar>
  <span title="Mermaid.js version" class="text-sm font-semibold opacity-60">v{version}</span>
  <Button variant="ghost" size="icon" title="Privacy & Security">
    <Privacy />
  </Button>
</FloatingToolbar>
