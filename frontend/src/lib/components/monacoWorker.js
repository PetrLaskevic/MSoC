import monacoEditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
self.MonacoEnvironment = {
    getWorker(_, label) {
        return new monacoEditorWorker();
    }
};