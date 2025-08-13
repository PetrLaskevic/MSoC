import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import type { MermaidConfig, RenderResult } from 'mermaid';
import mermaid from 'mermaid';

mermaid.registerLayoutLoaders(elkLayouts);
const init = mermaid.registerExternalDiagrams([zenuml]);

export const render = async (
  config: MermaidConfig,
  code: string,
  id: string
): Promise<RenderResult> => {
  await init;

  // Should be able to call this multiple times without any issues.
  mermaid.initialize(config);
  let result = await mermaid.render(id, code);
  let svgStringCopy = result.svg;
  console.log(svgStringCopy);
  //Add clickable and hoverable thicker second set of edges, just as mermaidchart.com does
  //(the original would be clickable too, but it is thin, so hard to target with a mouse)
  //=> These are transparent but clickable and blue when hovered
  const parser = new DOMParser();
  let tree = parser.parseFromString(svgStringCopy, "image/svg+xml");
  let parent = tree.getElementsByClassName("edgePaths")[0];
  let edgeElements = parent.children;
  let originalCount = edgeElements.length;
  for(let element of edgeElements){
    if(!originalCount){
      break;
    }
    const clone = element.cloneNode(true) as Element;
    clone.setAttribute("stroke", "transparent");
    clone.setAttribute("stroke-width", "20"); //10
    clone.setAttribute("pointer-events", "stroke");
    clone.id = "clickable" + clone.id;
    clone.setAttribute("class", "clickable-edge-hack");
    clone.setAttribute("fill", "none");
    parent.appendChild(clone);
    originalCount--;
  }
  let updatedSvgString = new XMLSerializer().serializeToString(tree.documentElement);
  result.svg = updatedSvgString;
  return result
};

//Just a test if syntax is correct, does not do SVGs (as per mermaid.parse docs)
export const parse = async (code: string) => {
  return await mermaid.parse(code);
};

export const standardizeDiagramType = (diagramType: string) => {
  switch (diagramType) {
    case 'class':
    case 'classDiagram': {
      return 'classDiagram';
    }
    case 'graph':
    case 'flowchart':
    case 'flowchart-elk':
    case 'flowchart-v2': {
      return 'flowchart';
    }
    default: {
      return diagramType;
    }
  }
};
