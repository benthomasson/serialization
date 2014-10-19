capnp-js
========

Javascript runtime for [Capnproto](http://kentonv.github.io/capnproto/index.html).

# Installation
* AMD: `bower install capnp-js`.
  Code generated by [capnp-js-plugin](https://github.com/popham/capnp-js-plugin#capnp-js-plugin) expects to find the `capnp-js` runtime at `capnp-js`, so you'll need to add a path to your AMD configuration, e.g.

```
paths : {
    'capnp-js' : 'directory/subdirectory/capnp-js'
}
```

* Node: `npm install capnp-js`.
  The Nodefy flow mentioned under `capnp-js-plugin`'s [usage section](https://github.com/popham/capnp-js-plugin#usage) generates absolute requires based from `capnp-js`, so `npm`'s installation under *node_modules/* will resolve without any user intervention.

* I personally use Bower for AMD stuff and `npm` for Node stuff.
  While I refuse to point any AMD path into *node_modules/*, if you want to use `npm` to manage your AMD packages, then say so in the issue tracker:
  I'll publish to `capnp-js-amd`.

# Usage
The following interacts with code generated from [peer.capnp](https://github.com/popham/rtc-github-protocol/blob/master/peer.capnp) and [client.capnp](https://github.com/popham/rtc-github-protocol/blob/master/client.capnp).
To play around with it under Node, clone the parent project:

```
git clone https://github.com/popham/rtc-github-protocol.git
cd rtc-github-protocol
npm install
```

## Building
First, lets build a few messages.
Then we can read them.

* Root-up

```
var Allocator = require('capnp-js/builder/Allocator');
var client = require('rtc-github-protocol/client.capnp.d/builder');

var rootUpClient = Allocator.initRoot(client.Client);
var rootUpPeer = rootUpClient.initPeer();
rootUpPeer.initAnswer().setSdp('Hello from Root Up');

```

* Child-down

```
var Allocator = require('capnp-js/builder/Allocator');
var client = require('rtc-github-protocol/client.capnp.d/builder');
var peer = require('rtc-github-protocol/peer.capnp.d/builder');

var allocator = new Allocator();
var childDownArena = allocator.createArena();

var childDownPeer = childDownArena.initOrphan(peer.Peer);
childDownPeer.initAnswer().setSdp('Hello from Child Down');

var childDownClient = childDownArena.initRoot(client.Client);
childDownClient.adoptPeer(childDownPeer);
```

* Copy

```
var Allocator = require('capnp-js/builder/Allocator');
var client = require('rtc-github-protocol/client.capnp.d/builder');

var copyClient1 = Allocator.initRoot(client.Client);
var copyClient2 = Allocator.initRoot(client.Client);

var copyPeer1 = copyClient1.initPeer();
copyPeer1.initAnswer().setSdp('Hello from Copy');

copyClient2.setPeer(copyPeer1);
```

* Move within an arena

```
var Allocator = require('capnp-js/builder/Allocator');
var client = require('rtc-github-protocol/client.capnp.d/builder');
var peer = require('rtc-github-protocol/peer.capnp.d/builder');

var allocator = new Allocator();
var moveArena = allocator.createArena();

var moveClient = moveArena.initRoot(client.Client);

// Both of these peers reference the same memory, but only `movePeer1d` can be
// adopted.  `moveClient.setPeer(movePeer1)` works (less efficiently).
var movePeer1 = moveClient.initPeer();
var movePeer1d = moveClient.disownPeer();
movePeer1.initAnswer().setSdp('Hello from Move (Initial)');

// client.capnp doesn't have a second `Peer` to move, so lets pretend:
// var moveReplacement = moveClient.disownSomeOtherPeer();
var moveReplacement = moveArena.initOrphan(peer.Peer);

moveReplacement.initAnswer().setSdp('Hello from Move (Replacement)');
moveClient.adoptPeer(moveReplacement);

// Pretend with me again:
// moveClient.adoptSomeOtherPeer(movePeer1d)
```

## Reading
