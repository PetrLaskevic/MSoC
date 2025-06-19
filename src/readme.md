# To run:
1. `npm ci` or `npm install`
2. `npx ts-node src/main.ts`

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