<script>
  import * as Dialog from '$/components/ui/dialog';
  import ShieldIcon from '~icons/material-symbols/shield-lock-outline-rounded';
</script>

<Dialog.Root>
  <Dialog.Trigger>
    <ShieldIcon />
  </Dialog.Trigger>
  <Dialog.Content class="max-h-full overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-xl">
        <ShieldIcon class="size-8 text-green-700" />
        Data security
      </Dialog.Title>
    </Dialog.Header>

    <p class="text-xl font-semibold">
      The content of the diagrams you create never leaves your browser.
    </p>
    <p>It's only stored in the URL, and your browser's local storage.</p>
    <p>
      BirdsEye, based on Mermaid Live Editor, is a fully open source application.
      Right now it is meant to be ran as a local development tool, and has a node.js backend scanning files from the local file system and exposing them in a public HTTP API to be able to show them in the app.
    </p>
    <p>
      It will be deployed transparently on 
      <!-- <a
        href="https://github.com/mermaid-js/mermaid-live-editor/deployments"
        class="underline"
        target="_blank"> -->
        GitHub Pages, once the loading of project files in browser will be implemented. Then it will be a fully client side application. (As opposed to the local server and client model.)
      <!-- </a>. -->
    </p>
    
    <p>
      Additional services like the external PNG/SVG/Kroki links
      will share your diagram with the respective 3rd party service.
    </p>
  </Dialog.Content>
</Dialog.Root>
