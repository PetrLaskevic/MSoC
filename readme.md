# To clone:
The project uses git submodules, so `git clone` alone will not work. It needs a `--recurse-submodules` flag.

# To run the call graph Mermaid text generator:
1. Go to the `codeScanner` folder
2. Run: `npm ci`
3. Run: `npx ts-node main.ts`

# To run the SvelteKit frontend:
1. `npm ci`
2. `npm run build`
3. `npm run preview`

# To view the generated Mermaid graph
For each file a graph is generated. Paste the graph to [https://mermaid.live](https://mermaid.live)
(There is also [mermaimaidchart.com](mermaimaidchart.com), but the `.live` page is better since it does not require login).

# SvelteKit specific Readme:
Moved from `README.md` file it generated, development info

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.


# Node version 20 or newer is required
For the `glob` package.
```
npm WARN EBADENGINE Unsupported engine {
npm WARN EBADENGINE   package: 'lru-cache@11.1.0',
npm WARN EBADENGINE   required: { node: '20 || >=22' },
npm WARN EBADENGINE   current: { node: 'v18.19.1', npm: '9.2.0' }
npm WARN EBADENGINE }
```
=> My system `node` version was v18.19.1, so I had to use [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) to download a newer one (and not break system packages):

```
petr@petr-IdeaPad-3-15ALC6:~$ nvm install --lts
Installing latest LTS version.
Downloading and installing node v22.16.0...
Downloading https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-x64.tar.xz...
####################################################################################################################################################################################### 100.0%
Computing checksum with sha256sum
Checksums matched!
Now using node v22.16.0 (npm v10.9.2)
Creating default alias: default -> lts/* (-> v22.16.0)
```

```
petr@petr-IdeaPad-3-15ALC6:~$ nvm use --lts
Now using node v22.16.0 (npm v10.9.2)
petr@petr-IdeaPad-3-15ALC6:~$ node --version
v22.16.0
```