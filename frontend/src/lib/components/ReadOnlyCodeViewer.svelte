<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let { jsCode } = $props();

    /* reactiveEffectEnabled
    false for first run, when onMount takes care of initialising and then calls loadCode
    onMount sets it to true and then effect runs loadCode on changes to ensure reactivity
    => basically so the $effect runs on any change except the first run when the component mounts
    => this avoids the previous setTimeout hack, which ran the first loadCode from $effect after the onMount finished running
    */
    let reactiveEffectEnabled = $state(false);
    $effect(() => {
        // jsCode; //needed here for the effect to run if reactiveEffectEnabled is not set as reactive
        //if reactiveEffectEnabled is declared as reactive, `jsCode;` in front needed
        if(reactiveEffectEnabled){
            loadCode(jsCode, 'javascript');
        }
    });

	let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;

	function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);

		editor.setModel(model);
	}

	onMount(async () => {
		self.MonacoEnvironment = {
			getWorker: function (_: any, label: string) {
				if (label === 'json') {
					return new jsonWorker();
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return new cssWorker();
				}
				if (label === 'html' || label === 'handlebars' || label === 'razor') {
					return new htmlWorker();
				}
				if (label === 'typescript' || label === 'javascript') {
					return new tsWorker();
				}
				return new editorWorker();
			}
		};

		monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

		editor = monaco.editor.create(editorElement, {
			automaticLayout: true,
			theme: 'vs-dark',
            readOnly: true,
            minimap: {
                enabled: false
            },
		});

		loadCode(jsCode, 'javascript');
        reactiveEffectEnabled = true;
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});

    export function gotoLine(line: number){
        //string from Mermaid won't  do, it will complain:
        line = Number(line);
        //Sadly, Monaco doesn't have a way to go to a line AT top, only near top,
        //which is always off by 14 lines (it seems).
        //Simple reveal line is happy if the line is anywhere visible on the screen
        //https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneCodeEditor.html#revealLine.revealLine-1
        //So using revealLineNearTop with the magic number of 14
        editor.revealLineNearTop(line + 14,1); //1 means immediate scrollType
    }
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex-grow" bind:this={editorElement} ></div>
</div>
