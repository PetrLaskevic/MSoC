<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

	import { mode } from 'mode-watcher';
	//does not run onMount, only on change
	let themeChangeSubscription = mode.subscribe((mode) => {
		console.log("theme changed");
		if(mode == "dark"){
			monaco.editor.setTheme("vs-dark");
		}else if(mode == "light"){
			monaco.editor.setTheme("vs");
		}
	});

    let { jsCode, goToLine, jumpMode } = $props();

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

	$effect(() => {
		if(reactiveEffectEnabled){
			gotoLine(goToLine, jumpMode);
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

		let theme = "vs-dark";
		if($mode == "light"){
			theme = "vs";
		}else{
			console.log("mode", $mode);
		}

		editor = monaco.editor.create(editorElement, {
			automaticLayout: true,
			theme: theme,
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

	onDestroy(themeChangeSubscription);

	//how many lines tall is this compoent
	function getViewPortLineHeight(){
		return editor.getVisibleRanges()[0].endLineNumber - editor.getVisibleRanges()[0].startLineNumber + 1;
	}

	//The same line highlight as when you press f12 on a function call and it takes you to the function definition which blinks in VSCode
	//Found from function `_openReference` in `goToCommands.js` in Monaco source code 
	//(found with a debugger in Firefox DevTools, breakpoint on keydown event on Monaco parent div and pressing f12 to trigger the keydown and the code path of 'editor.action.revealDefinition' command, and then f10 until I got to _openReference)
	function blinkLine(line: number){
		console.log("Blinking line", line);
		//the range of the whole line (for now)
		let range = new monaco.Range(
			line,
			editor.getModel()!.getLineMinColumn(line),
			line,
			editor.getModel()!.getLineMaxColumn(line)
		);
		//removing description: 'symbol-navigate-action-highlight' from options since it apparently does not exist on monaco.editor.IStandaloneCodeEditor (type of our `editor` variable) while it does on ICodeEditor they use
		//works without it fine
		const modelNow = editor.getModel();
		const decorations = editor.createDecorationsCollection([{ range, options: {className: 'symbolHighlight' } }]);
		setTimeout(() => {
				//I assume this is because there the use can switch tabs and editors?
				if (editor.getModel() === modelNow) {
					console.log("clearing")
					decorations.clear();
				}
		}, 350);
	}

    function gotoLine(line: number, mode: "top" | "near-top"){
		//string from Mermaid won't  do, it will complain:
		line = Number(line);
		console.log("Going to line", line, model);
		//For function calls, where a bit of context is wanted 
		// + where VSCode sticky scroll (telling us the function scope we're in) would overlap with the line
		if(mode == "near-top"){
			editor.revealLineNearTop(line);
			blinkLine(line);
		//For function declarations, where we want the first line in the viewport to be the first line of the function
		}else if(mode == "top"){
			//Sadly, Monaco doesn't have a way to go to a line AT top, only near top,
		
			//Simple reveal line is happy if the line is anywhere visible on the screen
			//https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneCodeEditor.html#revealLine.revealLine-1
			
			//So I tried using revealLineNearTop which draws the line in ~ 1/3 of the screen (not the first line)
			// editor.revealLineNearTop(line);
			// => to make it the top line i tried line + 14, but the magic number changes slightly based on zoom level (visible number of lines)
			// (14 was 1/3 of the visible lines)
			// editor.revealLineNearTop(line + 13,1); //1 means immediate scrollType
			
			//revealLines puts the lines **somewhere** (some of them) on the screen
			// editor.revealLines(line, line + getViewPortLineHeight());
			
			//revealRangeAtTop seems to be close, since irrespective of zoom, it is always off by 5 lines
			//(presumably for readablility purposes, it displays 5 lines before the first line of the region you asked for)
			//so I added + 5 to make the function name always the first line
			console.log("startline", line);
			console.log("endline", line + getViewPortLineHeight());
			const OFFSET = 5; // + 4 is also nice, since it shows you one line above the function which gives you a bit of context if there is JSDoc above or not, but not confusing
			editor.revealRangeAtTop({
				endColumn: 1,
				endLineNumber: line + getViewPortLineHeight() + OFFSET,
				startColumn: 1,
				startLineNumber: line + OFFSET,
			}, 1);
			blinkLine(line);
		}
	}
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex-grow" bind:this={editorElement} ></div>
</div>
