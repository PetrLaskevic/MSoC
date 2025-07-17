# To clone:
The project uses git submodules, so `git clone` alone will not work. It needs a `--recurse-submodules` flag.
# To run the call graph Mermaid text generator:
1. Go to the `codeScanner` folder
2. Run: `npm ci`
3. Run: `npx ts-node main.ts`

# To view the generated Mermaid graph
For each file a graph is generated. Paste the graph to [https://mermaid.live](https://mermaid.live)
(There is also [mermaimaidchart.com](mermaimaidchart.com), but the `.live` page is better since it does not require login).

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