<script lang="ts">
  import Actions from '$/components/Actions.svelte';
  import Card from '$/components/Card/Card.svelte';
  import DiagramDocButton from '$/components/DiagramDocumentationButton.svelte';
  import Editor from '$/components/Editor.svelte';
  import Navbar from '$/components/Navbar.svelte';
  import PanZoomToolbar from '$/components/PanZoomToolbar.svelte';
  import Share from '$/components/Share.svelte';
  import SyncRoughToolbar from '$/components/SyncRoughToolbar.svelte';
  import * as Resizable from '$/components/ui/resizable';
  import { Switch } from '$/components/ui/switch';
  import { Toggle } from '$/components/ui/toggle';
  import VersionSecurityToolbar from '$/components/VersionSecurityToolbar.svelte';
  import View from '$/components/View.svelte';
  import type { EditorMode, Tab } from '$/types';
  import { PanZoomState } from '$/util/panZoom';
  import { stateStore, updateCode, updateCodeStore, inputStateStore } from '$/util/state';
  import { initHandler } from '$/util/util';
  import { onMount } from 'svelte';
  import CodeIcon from '~icons/custom/code';
  import GearIcon from '~icons/material-symbols/settings-outline-rounded';
  import FolderIcon from "~icons/material-symbols/files"; //or /folder
  import SourceCodeIcon from "~icons/fa6-solid/code";

  import type { PageProps } from './$types';
  import { fileNameListToTree, codePreview } from "$/components/shared.svelte";
  import Directory from '$/components/FileSidebar/Directory.svelte';
	import { open, openedFile } from '$/components/FileSidebar/index.svelte';
  import ReadOnlyCodeViewer from '$/components/ReadOnlyCodeViewer.svelte';

  let { data }: PageProps = $props();
  console.log("codeScanner vystup", data);
  let files = fileNameListToTree(data.fileNames);

  if($stateStore.filePath){
    open($stateStore.filePath);
  }else{
    open(data.fileNames[0]);
    $inputStateStore.filePath = data.fileNames[0];
  }
  


  // Switches file (diagram source, loads source code, resets scroll on editor)
  $effect(() => {
    //TODO: FIX: FileSidebar expects a path starting with "/" while data.diagrams from codeScanner are always without it
    //For now, slicing works, but it's better to be consistent
    let pathOfDiagram = openedFile.path.slice(1);
    if(openedFile.convertToBackslashes){
      pathOfDiagram = pathOfDiagram.replaceAll("/", "\\");
    }
    console.log($state.snapshot(openedFile.path));
    console.log("ten diagram", $state.snapshot(pathOfDiagram), data.diagrams[pathOfDiagram]);
   
    updateCode(data.diagrams[pathOfDiagram], {resetPanZoom: true});

    //interestingly this, and the node.js FS backend of the API was OK with forward slashes on Windows 
    fetch("/file?path=" + pathOfDiagram).then((res) => { //"/file/" + btoa(openedFile.path)
      res.json().then(text => { //text()
        console.log(text);
        codePreview.jumpToLineNumber = 1;
        codePreview.jumpMode = "top";
        openedFile.source = text;
      })
    });
    $inputStateStore.filePath = pathOfDiagram;
  });

  const panZoomState = new PanZoomState();

  const tabSelectHandler = (tab: Tab) => {
    const editorMode: EditorMode = tab.id === 'code' ? 'code' : 'config';
    updateCodeStore({ editorMode });
  };

  const editorTabs: Tab[] = [
    {
      icon: CodeIcon,
      id: 'code',
      title: 'Diagram'
    },
    {
      icon: GearIcon,
      id: 'config',
      title: 'Config'
    }
  ];

  let width = $state(0);
  let isMobile = $derived(width < 640);
  let isViewMode = $state(true);

  onMount(async () => {
    await initHandler();
    window.addEventListener('appinstalled', () => {
      // logEvent('pwaInstalled', { isMobile });
    });
  });


  let editorPane: Resizable.Pane | undefined;
  $effect(() => {
    if (isMobile) {
      editorPane?.resize(50);
    }
  });

  //has to a global function (window.) because of Mermaid:
  //https://mermaid.js.org/syntax/flowchart.html#interaction
  window.callback = function(functionName: string, line: number){
    //although I passed a number to Mermaid, it made it a string
    line = Number(line);
    console.log("nice", functionName, line);
    // console.log($state.snapshot(codePreview))
    if(codePreview.isNotPanning){
      codePreview.jumpMode = "top";
      codePreview.jumpToLineNumber = line;
      codePreview.showSidebar = true;
    }else{
      console.log("pan detected not switching")
    }
  }
</script>

<svelte:head>
   <title>{"BirdsEye - " + openedFile.name}</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden">
  {#snippet mobileToggle()}
    <div class="flex items-center gap-2">
      Edit <Switch
        id="editorMode"
        class="data-[state=checked]:bg-accent"
        bind:checked={isViewMode}
        onclick={() => {
          // logEvent('mobileViewToggle');
        }} /> View
    </div>
  {/snippet}

  <!-- 
  right now passing editorPane to Navbar as a "hack"
  => a more beatiful solution would be to figure out how to render some children to the left and some to the right
    <Navbar.left> 
      ...
    </Navbar.left>

    <Navbar.right>
      ...
    </Navbar.right>

    alternatively make "spacer component" between children
    so things to the left squished to the left and to the right squished to the right
  -->
  <Navbar editorPane={editorPane} mobileToggle={isMobile ? mobileToggle : undefined}>
    <Toggle bind:pressed={codePreview.showSidebar} size="sm">
      <SourceCodeIcon />
    </Toggle>
    <Share />
    <!-- From here I ripped the "Save" button which was just a redirect to mermaidchart.com -->
  </Navbar>

  <div class="flex flex-1 flex-col overflow-hidden" bind:clientWidth={width}>
    <div
      class={[
        'size-full',
        isMobile && ['w-[200%] duration-300', isViewMode && '-translate-x-1/2']
      ]}>
      <Resizable.PaneGroup
        direction="horizontal"
        autoSaveId="liveEditor"
        class="gap-4 p-2 pt-0 sm:gap-0 sm:pt-0">

        <Resizable.Pane bind:this={editorPane} defaultSize={20} minSize={15} collapsible={true}>
          <div class="flex h-full flex-col gap-4 sm:gap-6">
            <Card
            title ="Browse"
            isOpen
            isClosable={true}
            icon={{component: FolderIcon, restProps: {width: "24px", height: "24px"}}}
            >
              <Directory dirObject={files} pathFromStart={""}/>
            </Card>

            <Card
              onselect={tabSelectHandler}
              tabs={editorTabs}
              activeTabID={$stateStore.editorMode}
              isClosable={true}
              showActionsWhenClosed={false}
              titleInsteadOfTabsWhenClosed={"Edit Diagram"}
              iconInsteadOfTabsWhenClosed={{component: CodeIcon}}
              >
              
              {#snippet actions()}
                <DiagramDocButton />
              {/snippet}

              <!-- The Card component draws these elements on all tabs -->
              <!-- I suppose the Editor has some store which makes it reload state 
                => it is one editor which loads a file each time
                    => if I scroll down in a diagram, switch to Config and then switch to Code the scroll state is lost 
              -->
              <Editor {isMobile} />
              <!-- <p>SKibidi</p> -->
            </Card>

            <div class="group flex flex-wrap justify-between gap-4 sm:gap-6">
              <Actions />
            </div>
          </div>
        </Resizable.Pane>
        <Resizable.Handle class="mr-1 hidden opacity-0 sm:block" />
        <Resizable.Pane minSize={15} class="relative flex h-full flex-1 flex-col overflow-hidden">
          <View {panZoomState} shouldShowGrid={$stateStore.grid} />
          <div class="absolute right-0 top-0"><PanZoomToolbar {panZoomState} /></div>
          <div class="absolute bottom-0 right-0"><VersionSecurityToolbar /></div>
          <div class="absolute bottom-0 left-0 sm:left-5"><SyncRoughToolbar /></div>
        </Resizable.Pane>
        <!-- right sidebar -->
        {#if codePreview.showSidebar}
          <Resizable.Handle class="ml-1 hidden opacity-0 sm:block" />
          <Resizable.Pane
            minSize={15}
            defaultSize={30}
            class="hidden h-full flex-grow flex-col sm:flex">
            <!-- <History /> -->
             <ReadOnlyCodeViewer dataChangeTimeStamp={codePreview.dataChangeTimeStamp} goToLine={codePreview.jumpToLineNumber} jumpMode={codePreview.jumpMode} jsCode={openedFile.source} />
          </Resizable.Pane>
        {/if}
      </Resizable.PaneGroup>
    </div>
  </div>
</div>
