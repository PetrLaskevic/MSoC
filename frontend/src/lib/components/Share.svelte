<script>
  import { buttonVariants } from '$/components/ui/button';
  import * as Dialog from '$/components/ui/dialog';
  import ShareIcon from '~icons/material-symbols/share';
  import CopyInput from './CopyInput.svelte';
</script>

<Dialog.Root>
  <Dialog.Trigger class={buttonVariants({ size: 'sm' })}>Share</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-xl">
        <ShareIcon class="size-5" /> Shareable links
      </Dialog.Title>
      <Dialog.Description>Share your diagrams with others.</Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 class="flex items-center gap-2">
          <img class="size-5" src="/seagull.png" alt="Logo of BirdsEye Call Visualiser" />
          BirdsEye Call Visualiser
        </h2>
        <CopyInput value={window.location.href} />
        <Dialog.Description>
          Your diagram is not stored at any server. 
          It is only in the text of the link you share.
        </Dialog.Description>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
