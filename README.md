capnp-js [![Build Status](https://travis-ci.org/popham/capnp-js-base.svg?branch=master)](https://travis-ci.org/popham/capnp-js-base)
====================================================================================================================================

Javascript runtime for [Capnproto](http://kentonv.github.io/capnproto/index.html).

Installation
* AMD: `bower install capnp-js`.
  Code generated by [capnp-js-plugin](https://github.com/popham/capnp-js-plugin#capnp-js-plugin) looks for the runtime at `capnp-js`, so you'll need to add a path to your AMD configuration, e.g. `'capnp-js' : 'path/from/baseUrl/capnp-js'`
* Node: `npm install capnp-js`.
  The Nodefy flow mentioned under `capnp-js-plugin`'s [usage section](https://github.com/popham/capnp-js-plugin#usage) generates absolute requires based from `capnp-js`, so `npm`'s installation under *node_modules/* will resolve without any user intervention.
* I personally use Bower for AMD stuff and `npm` for Node stuff.
  While I refuse to point any AMD path into *node_modules/*, if you want to use `npm` to manage your AMD packages, then say so in the issue tracker:
  I'll publish to `capnp-js-amd`.

# Use
The following interacts with code generated from [peer.capnp](https://github.com/popham/rtc-github-protocol/blob/master/peer.capnp) and [client.capnp](https://github.com/popham/rtc-github-protocol/blob/master/client.capnp).
To play around with it under Node, clone the parent project:

```
git clone https://github.com/popham/rtc-github-protocol.git
cd rtc-github-protocol
npm install
npm run build
cd node
npm install
```

## Building
First, lets build a few messages.

* Root-up

```javascript
var Allocator = require('capnp-js/builder/Allocator');
var alloc = new Allocator();
var client = require('./client.capnp.d/builders');

var rootUpClient = alloc.initRoot(client.Client);
var rootUpPeer = rootUpClient.initPeer();
rootUpPeer.initAnswer().setSdp('Hello from Root Up');

```

* Child-down

```javascript
var Allocator = require('capnp-js/builder/Allocator');
var alloc = new Allocator();
var client = require('./client.capnp.d/builders');
var peer = require('./peer.capnp.d/builders');

var childDownArena = alloc.createArena();

var childDownPeer = childDownArena.initOrphan(peer.Peer);
childDownPeer.initAnswer().setSdp('Hello from Child Down');

var childDownClient = childDownArena.initRoot(client.Client);
childDownClient.adoptPeer(childDownPeer);
```

* Copy

```javascript
var Allocator = require('capnp-js/builder/Allocator');
var alloc = new Allocator();
var client = require('./client.capnp.d/builders');

var copyClient1 = alloc.initRoot(client.Client);
var copyClient2 = alloc.initRoot(client.Client);

var copyPeer1 = copyClient1.initPeer();
copyPeer1.initAnswer().setSdp('Hello from Copy');

copyClient2.setPeer(copyPeer1);
```

* Move within an arena

```javascript
var Allocator = require('capnp-js/builder/Allocator');
var alloc = new Allocator();
var client = require('./client.capnp.d/builders');
var peer = require('./peer.capnp.d/builders');

var moveArena = alloc.createArena();

var moveClient = moveArena.initRoot(client.Client);

// Both of these peers reference the same memory, but only `movePeer1d` can be
// adopted.  `moveClient.setPeer(movePeer1)` works (less efficiently).
var movePeer1 = moveClient.initPeer();
var movePeer1d = moveClient.disownPeer();
movePeer1.initAnswer().setSdp('Hello from Move (Initial)');

// client.capnp doesn't have a second `Peer` to swap with, so lets pretend:
// var moveReplacement = moveClient.disownSomeOtherPeer();
var moveReplacement = moveArena.initOrphan(peer.Peer);

moveReplacement.initAnswer().setSdp('Hello from Move (Replacement)');
moveClient.adoptPeer(moveReplacement);

// Pretend with me again:
// moveClient.adoptSomeOtherPeer(movePeer1d);
```

## Serialization
Now, lets serialize the data structures in preparation for transmission, then deserialize.
There are currently two serializers: stream and nonframe.
Capnproto specifies [stream framing](http://kentonv.github.io/capnproto/encoding.html#serialization_over_a_stream).
I've added a simple, non-framed analogue.

* Stream Framing - I don't care for my stream framing interface.
  Expect it to change--in fact, feel free to complain in the issue tracker with use cases that can drive a better API.
  In the meantime, the following works.

```javascript
var stream = require('capnp-js/stream');

var rootUpStream = stream.fromStruct(rootUpClient);
var rootUpClientStreamArena = stream.toArena(rootUpStream);

var childDownStream = stream.fromStruct(childDownClient);
var childDownClientStreamArena = stream.toArena(childDownStream);

var copyStream1 = stream.fromStruct(copyClient1);
var copyClient1StreamArena = stream.toArena(copyStream1);
var copyStream2 = stream.fromStruct(copyClient2);
var copyClient2StreamArena = stream.toArena(copyStream2);

var moveStream = stream.fromStruct(moveClient);
var moveClientStreamArena = stream.toArena(moveStream);
```

* Non-Framed - The nonframed interface consolidates a full arena to a single segment.

```javascript
var nonframed = require('capnp-js/nonframed');

var rootUpNonframed = nonframed.fromStruct(rootUpClient);
var rootUpClientNonframedArena = nonframed.toArena(rootUpNonframed);

var childDownNonframed = nonframed.fromStruct(childDownClient);
var childDownClientNonframedArena = nonframed.toArena(childDownNonframed);

var copyNonframed1 = nonframed.fromStruct(copyClient1);
var copyClient1NonframedArena = nonframed.toArena(copyNonframed1);
var copyNonframed2 = nonframed.fromStruct(copyClient2);
var copyClient2NonframedArena = nonframed.toArena(copyNonframed2);

var moveNonframed = nonframed.fromStruct(moveClient);
var moveClientNonframedArena = nonframed.toArena(moveNonframed);
```

## Reading
Finally, lets wrap readers around the cloned arenas.

* Stream Framing

```javascript
var sfRootUpClientClone = rootUpClientStreamArena.getRoot(client.Client);
var sfChildDownClientClone = childDownClientStreamArena.getRoot(client.Client);
var sfCopyClient1Clone = copyClient1StreamArena.getRoot(client.Client);
var sfCopyClient2Clone = copyClient2StreamArena.getRoot(client.Client);
var sfMoveClientClone = moveClientStreamArena.getRoot(client.Client);
```

* Non-Framed

```javascript
var nfRootUpClientClone = rootUpClientNonframedArena.getRoot(client.Client);
var nfChildDownClientClone = childDownClientNonframedArena.getRoot(client.Client);
var nfCopyClient1Clone = copyClient1NonframedArena.getRoot(client.Client);
var nfCopyClient2Clone = copyClient2NonframedArena.getRoot(client.Client);
var nfMoveClientClone = moveClientNonframedArena.getRoot(client.Client);
```
