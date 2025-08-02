<script lang="ts">
    import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
    import * as monaco from 'monaco-editor';
    
    import { mode } from 'mode-watcher';
    import { onMount } from 'svelte';
    let { newText } = $props();
    let editorOptions = {
        readOnly: true
    }
    let jsModel;
    let divElement: HTMLDivElement | undefined = $state();
    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    onMount(() => {
        if (!divElement) {
            throw new Error('divEl is undefined');
        }
        try{
            jsModel = monaco.editor.createModel(
                '',
                'javascript',
                monaco.Uri.parse('internal://file.js')
            );
        }catch(e){
            jsModel = monaco.editor.getModel(monaco.Uri.parse('internal://file.js'));
        }

        editor = monaco.editor.create(divElement, editorOptions);

        //setting theme does not work
        // monaco.editor.defineTheme('ace', {
        //     base: 'vs',
        //     inherit: true,
        //     rules: [
        //         { token: '', foreground: '5c6773' },
        //         { token: 'invalid', foreground: 'ff3333' },
        //         { token: 'emphasis', fontStyle: 'italic' },
        //         { token: 'strong', fontStyle: 'bold' },
        //         { token: 'variable', foreground: '5c6773' },
        //         { token: 'variable.predefined', foreground: '5c6773' },
        //         { token: 'constant', foreground: 'f08c36' },
        //         { token: 'comment', foreground: 'abb0b6', fontStyle: 'italic' },
        //         { token: 'number', foreground: 'f08c36' },
        //         { token: 'number.hex', foreground: 'f08c36' },
        //         { token: 'regexp', foreground: '4dbf99' },
        //         { token: 'annotation', foreground: '41a6d9' },
        //         { token: 'type', foreground: '41a6d9' },
        //         { token: 'delimiter', foreground: '5c6773' },
        //         { token: 'delimiter.html', foreground: '5c6773' },
        //         { token: 'delimiter.xml', foreground: '5c6773' },
        //         { token: 'tag', foreground: 'e7c547' },
        //         { token: 'tag.id.jade', foreground: 'e7c547' },
        //         { token: 'tag.class.jade', foreground: 'e7c547' },
        //         { token: 'meta.scss', foreground: 'e7c547' },
        //         { token: 'metatag', foreground: 'e7c547' },
        //         { token: 'metatag.content.html', foreground: '86b300' },
        //         { token: 'metatag.html', foreground: 'e7c547' },
        //         { token: 'metatag.xml', foreground: 'e7c547' },
        //         { token: 'metatag.php', fontStyle: 'bold' },
        //         { token: 'key', foreground: '41a6d9' },
        //         { token: 'string.key.json', foreground: '41a6d9' },
        //         { token: 'string.value.json', foreground: '86b300' },
        //         { token: 'attribute.name', foreground: 'f08c36' },
        //         { token: 'attribute.value', foreground: '0451A5' },
        //         { token: 'attribute.value.number', foreground: 'abb0b6' },
        //         { token: 'attribute.value.unit', foreground: '86b300' },
        //         { token: 'attribute.value.html', foreground: '86b300' },
        //         { token: 'attribute.value.xml', foreground: '86b300' },
        //         { token: 'string', foreground: '86b300' },
        //         { token: 'string.html', foreground: '86b300' },
        //         { token: 'string.sql', foreground: '86b300' },
        //         { token: 'string.yaml', foreground: '86b300' },
        //         { token: 'keyword', foreground: 'f2590c' },
        //         { token: 'keyword.json', foreground: 'f2590c' },
        //         { token: 'keyword.flow', foreground: 'f2590c' },
        //         { token: 'keyword.flow.scss', foreground: 'f2590c' },
        //         { token: 'operator.scss', foreground: '666666' }, //
        //         { token: 'operator.sql', foreground: '778899' }, //
        //         { token: 'operator.swift', foreground: '666666' }, //
        //         { token: 'predefined.sql', foreground: 'FF00FF' }, //
        //     ],
        //     colors: {
        //         'editor.background': '#fafafa',
        //         'editor.foreground': '#5c6773',
        //         'editorIndentGuide.background': '#ecebec',
        //         'editorIndentGuide.activeBackground': '#e0e0e0',
        //     },
        //     });
        
        // monaco.editor.setTheme('vs-dark');


        self.MonacoEnvironment = {
            getWorker(_, label) {
                if (label === 'typescript' || label === 'javascript') {
                    return new tsWorker();
                }
                return new editorWorker();
            },
        };

        const unsubscribeMode = mode.subscribe((mode) => {
            editor && monaco.editor.setTheme(`mermaid${mode === 'dark' ? '-dark' : ''}`);
        });

        const resizeObserver = new ResizeObserver((entries) => {
            editor?.layout({
                height: entries[0].contentRect.height,
                width: entries[0].contentRect.width
            });
        });

        if (divElement.parentElement) {
            resizeObserver.observe(divElement);
        }

        return () => {
            unsubscribeMode();
            resizeObserver.disconnect();
            editor?.dispose();
        };
    });

    $effect(() => {
        editor?.setValue(newText);
    })
</script>

<div bind:this={divElement} class="h-full flex-grow overflow-hidden"></div>