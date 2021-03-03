# Kwatafana-node

Build on-top of [Peerjs](https://peerjs.com), using 
[NWjs](https://nwjs.io/) for the desktop user interface.

## Usage

### Installation
Download [NWjs](https://nwjs.io/downloads/) to `~/nwjs/` (or change 
the nw path in the start script of `./package.json`. Then run:

``` bash
$ npm install
```

### Build  UI in development mode

``` bash
$ npm run dev
# parcel build app/index.ts --out-file ./dist/kwatafana.min.js --no-minify
```

### Build UI in release mode

``` bash
$ npm run rel
# parcel build app/index.ts --out-file ./dist/kwatafana.min.js
```

### Export as a library

``` bash
$ npm run export
# parcel build exports.ts --out-file ./dist/kwatafana.min.js
```

### Start UI

``` bash
$ npm start
# ~/nwjs/nw dist/
```


### Test

``` bash
$ npm test
```

