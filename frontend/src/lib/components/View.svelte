<script lang="ts">
  import type { State, ValidatedState } from '$/types';
  import { recordRenderTime, shouldRefreshView } from '$/util/autoSync';
  import { render as renderDiagram } from '$/util/mermaid';
  import { PanZoomState } from '$/util/panZoom';
  import { inputStateStore, stateStore, updateCodeStore } from '$/util/state';
  import FontAwesome, { mayContainFontAwesome } from '$lib/components/FontAwesome.svelte';
  import uniqueID from 'lodash-es/uniqueId';
  import type { MermaidConfig } from 'mermaid';
  import { mode } from 'mode-watcher';
  import { onMount } from 'svelte';
  import { codePreview } from './shared.svelte';

  //Since Mermaid has no knowledge of us moving the diagram around (clicking and dragging), it will view such click drag as a click
  //which causes selection of the clicked node in the editor, so not ideal
  //So https://stackoverflow.com/a/45098107 from https://stackoverflow.com/questions/18032136/prevent-click-event-after-drag-in-jquery?rq=3
  function flagged () {
    codePreview.isNotPanning = false;
  }

  onMount(() => {

    view!.addEventListener('mousedown', () => {
      view!.addEventListener('mousemove', flagged);
    });

    view!.addEventListener('mouseup', () => {
      view!.removeEventListener('mousemove', flagged);
    });

    //The rest of the puzzle for this click-pan (click-drag) detection prevention is in panZoom.ts
    //Careful testing found that this setup works the best, while not being cleanest code
    // => there is hammer.on('panstart', () => { ... }) in panZoom.ts, but it is slow to react for small movements
    // => And this is instant
    // the key part to set `codePreview.isNotPanning = true` after is in 20 ms timeout in document.addEventListener("mouseup") in panZoom.ts
    // (the 20 ms were empirically chosen to set it after all click event callbacks on a node after click dragging have ran)
    // => this way (albeit messily), the clicks trigger the code preview opening and click drags do not
  });


  let {
    panZoomState = new PanZoomState(),
    shouldShowGrid = true
  }: { panZoomState?: PanZoomState; shouldShowGrid?: boolean } = $props();
  let code = '';
  let config = '';
  let container: HTMLDivElement | undefined = $state();
  let view: HTMLDivElement | undefined = $state();
  let error = $state(false);
  let panZoom = true;
  let manualUpdate = true;
  let waitForFontAwesomeToLoad: FontAwesome['waitForFontAwesomeToLoad'] | undefined = $state();

  // Set up panZoom state observer to update the store when pan/zoom changes
  const setupPanZoomObserver = () => {
    panZoomState.onPanZoomChange = (pan, zoom) => {
      updateCodeStore({ pan, zoom });
      // logEvent('panZoom');
    };
  };

  const handlePanZoom = (state: State, graphDiv: SVGSVGElement) => {
    panZoomState.updateElement(graphDiv, state);
  };

  const handleStateChange = async (state: ValidatedState) => {
    const startTime = Date.now();
    if (state.error !== undefined) {
      error = true;
      return;
    }
    error = false;
    let diagramType: string | undefined;
    try {
      if (container) {
        manualUpdate = true;
        // Do not render if there is no change in Code/Config/PanZoom
        if (
          code === state.code &&
          config === state.mermaid &&
          panZoom === state.panZoom
        ) {
          return;
        }

        if (!shouldRefreshView()) {
          return;
        }

        code = state.code;
        config = state.mermaid;
        panZoom = state.panZoom ?? true;

        if (mayContainFontAwesome(code)) {
          await waitForFontAwesomeToLoad?.();
        }

        const scroll = view?.parentElement?.scrollTop;
        delete container.dataset.processed;
        const viewID = uniqueID('graph-');
        const {
          svg,
          bindFunctions,
          diagramType: detectedDiagramType
        } = await renderDiagram(JSON.parse(state.mermaid) as MermaidConfig, code, viewID);
        diagramType = detectedDiagramType;
        if (svg.length > 0) {
          container.innerHTML = svg;
          let graphDiv = document.querySelector<SVGSVGElement>(`#${viewID}`);
          if (!graphDiv) {
            throw new Error('graph-div not found');
          }
  
          graphDiv.setAttribute('height', '100%');
          graphDiv.style.maxWidth = '100%';
          if (bindFunctions) {
            bindFunctions(graphDiv);
          }
          
          if (state.panZoom) {
            handlePanZoom(state, graphDiv);
          }
        }
        if (view?.parentElement && scroll) {
          view.parentElement.scrollTop = scroll;
        }
        error = false;
      } else if (manualUpdate) {
        manualUpdate = false;
      }
    } catch (error_) {
      console.error('view fail', error_);
      error = true;
    }
    const renderTime = Date.now() - startTime;
    // saveStatistics({ code, diagramType, renderTime });
    recordRenderTime(renderTime, () => {
      $inputStateStore.updateDiagram = true;
    });
  };

  onMount(() => {
    setupPanZoomObserver();
    // Queue state changes to avoid race condition
    let pendingStateChange = Promise.resolve();
    stateStore.subscribe((state) => {
      pendingStateChange = pendingStateChange.then(() => handleStateChange(state).catch(() => {}));
    });

    view?.addEventListener("click", (event) => {
      console.log("yeah", event, event.target, (event.target as SVGAElement)!.className.baseVal);
      if((event.target as SVGAElement)!.className.baseVal == "clickable-edge-hack"){
        if(codePreview.isNotPanning){
          let line = event!.target!.id.split("_")[1];
          console.log(line);
          codePreview.jumpMode = "near-top";
          codePreview.jumpToLineNumber = line;
          codePreview.show = true;
        }
      }else{
        console.log("pan on edge detected not switching")
      }
    });
  });


</script>

<FontAwesome bind:waitForFontAwesomeToLoad />

<div
  id="view"
  bind:this={view}
  class={['h-full w-full', shouldShowGrid && `grid-bg-${$mode}`, error && 'opacity-50']}>
  <div id="container" bind:this={container} class="h-full overflow-auto"></div>
</div>

<style>
  .grid-bg-light {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #e4e4e48c 2px, #0000 2px);
  }

  .grid-bg-dark {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #46464646 2px, #0000 2px);
  }
</style>
