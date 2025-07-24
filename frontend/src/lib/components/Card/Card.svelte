<script lang="ts">
  import type { Tab } from '$/types';
  import type { Component, Snippet } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { slide } from 'svelte/transition';
  import CollapseAllIcon from '~icons/material-symbols/collapse-all-rounded';
  import Tabs from './Tabs.svelte';

  interface Props {
    isClosable?: boolean;
    isOpen?: boolean;
    isStackable?: boolean;
    tabs?: Tab[];
    activeTabID?: string;
    title?: string;
    icon?: {
      component: Component;
      class?: string;
    };
    onselect?: (tab: Tab) => void;
    actions?: Snippet;
    children: Snippet;
    titleInsteadOfTabsWhenClosed?: string;
    iconInsteadOfTabsWhenClosed?: {
      component: Component;
      class?: string;
    };
    showActionsWhenClosed?: boolean;
  }

  let {
    isClosable = true,
    isOpen = false,
    isStackable = false,
    tabs = [],
    activeTabID = '',
    title,
    icon,
    onselect,
    actions,
    children,
    showActionsWhenClosed = true,
    titleInsteadOfTabsWhenClosed,
    iconInsteadOfTabsWhenClosed
  }: Props = $props();

  const toggleCardOpen = () => {
    if (isClosable) {
      isOpen = !isOpen;
    }
  };

  let isTabsShown = $derived(isOpen && tabs.length > 0);
</script>

{#snippet renderTitle(
  title: string | undefined,
  icon?: {
      component: Component;
      class?: string;
  })}
  {#if (icon || title) || (!isOpen && titleInsteadOfTabsWhenClosed)}
      <span role="menubar" tabindex="0" class="flex w-fit items-center gap-3">
        {#if icon}
          <icon.component class={icon.class} />
        {/if}
        {titleInsteadOfTabsWhenClosed || title}
      </span>
    {/if}
{/snippet}

<div
  class={[
    'card flex h-fit flex-col overflow-hidden rounded-2xl border-2 border-muted',
    isOpen && 'isOpen flex-grow',
    isStackable ? 'flex-1 group-has-[.isOpen]:w-full group-has-[.isOpen]:flex-none' : 'w-full'
  ]}>
  <!-- The title bar of the card which closes the card
    (if tabs are drawn, they're drawn in it)
    There is a close icon in it
   -->
  <div
    role="toolbar"
    tabindex="0"
    class={[
      'flex h-11 flex-none cursor-pointer items-center justify-between whitespace-nowrap bg-muted p-2',
      isTabsShown && 'pb-1'
    ]}
    onclick={toggleCardOpen}
    onkeypress={toggleCardOpen}>

    {#if icon || title}
      {@render renderTitle(title, icon)}
    {:else if !isOpen && (iconInsteadOfTabsWhenClosed || titleInsteadOfTabsWhenClosed)}
      {@render renderTitle(titleInsteadOfTabsWhenClosed, iconInsteadOfTabsWhenClosed)}
    {/if}

    <!-- The "Code" and "Config" tabs for example -->
    {#if isOpen && tabs && tabs.length > 0}
      <Tabs {onselect} {tabs} {activeTabID} />
    {/if}

    <!-- 
    The bonus content to be rendered in the toolbar
    i.e. the "Docs" button
    -->
    {#if showActionsWhenClosed}
      {@render actions?.()}
    {/if}

    {#if isOpen && isClosable}
      <CollapseAllIcon />
    {/if}
  </div>
  {#if isOpen}
    <div class="flex-grow overflow-x-auto" transition:slide={{ easing: quintOut }}>
      {@render children()}
    </div>
  {/if}
</div>
