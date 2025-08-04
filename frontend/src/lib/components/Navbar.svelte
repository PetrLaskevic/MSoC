<script lang="ts">
  import MainMenu from '$/components/MainMenu.svelte';
  import { Separator } from '$/components/ui/separator';
  import { MCBaseURL } from '$lib/util/util';
  import type { ComponentProps, Snippet } from 'svelte';
  import GithubIcon from '~icons/mdi/github';
  import DropdownNavMenu from './DropdownNavMenu.svelte';
  import { Toggle } from '$/components/ui/toggle';
  import LeftPanelClose from '~icons/material-symbols/left-panel-close';
  import LeftPanelOpen from '~icons/material-symbols/left-panel-open';
  import * as Resizable from '$/components/ui/resizable';
  interface Props {
    mobileToggle?: Snippet;
    children: Snippet;
    editorPane: Resizable.Pane | undefined;
  }

  let { children, mobileToggle, editorPane }: Props = $props();

  const isReferral = document.referrer.includes(MCBaseURL);

  type Links = ComponentProps<typeof DropdownNavMenu>['links'];

  const githubLinks: Links = [
    { title: 'Mermaid JS', href: 'https://github.com/mermaid-js/mermaid' },
    {
      title: 'Mermaid Live Editor',
      href: 'https://github.com/mermaid-js/mermaid-live-editor'
    },
    {
      title: 'Mermaid CLI',
      href: 'https://github.com/mermaid-js/mermaid-cli'
    }
  ];
  let closeLeftSidebar = $state(false);
  $effect(() => {
    if(closeLeftSidebar){
      editorPane?.collapse();
    }else{
      editorPane?.expand();
    }
  });
</script>


<nav class="z-50 flex p-4">
  <div class="flex flex-1 items-center gap-4">
    <MainMenu />
    <div
      id="switcher"
      class="flex items-center justify-center gap-4 font-medium"
      class:flex-row-reverse={isReferral}>
      <a href="/" class="whitespace-nowrap text-accent">
        BirdsEye
        {#if !isReferral && !mobileToggle}
          - Your Code At A Glance
        {/if}
      </a>
      <Separator orientation="vertical" />
      <Toggle bind:pressed={closeLeftSidebar} size="sm">
        {#if !closeLeftSidebar}
          <LeftPanelClose />
        {:else}
          <LeftPanelOpen />
        {/if}
      </Toggle>
      
      <!-- from here I removed the mermaidchart "playground toggle" redirect -->
    </div>
  </div>
  <div
    id="menu"
    class="hidden flex-nowrap items-center justify-between gap-3 overflow-hidden md:flex">
    <DropdownNavMenu icon={GithubIcon} links={githubLinks} />
    <Separator orientation="vertical" />
    {@render children()}
  </div>
  {@render mobileToggle?.()}
</nav>
