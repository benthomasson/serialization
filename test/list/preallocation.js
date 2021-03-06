var assert = require('assert');
var builder = require('../../node/builder/layout/list');
var reader = require('../../node/reader/layout/list');

var ct = {
    meta : 1,
    layout : 4,
    dataBytes : 4,
    pointersBytes : 0
};

var rt = {
    meta : 1,
    layout : 7,
    dataBytes : 8,
    pointersBytes : 8,
};

describe ('Preallocated list pointers', function () {
    describe ('Non-inline-composite', function () {
        describe ('Intrasegment', function () {
            var segment = new Buffer(80);
            segment.fill(0);
            var p = { segment:segment, position:0 };
            var blob = { segment:segment, position:32 };
            var offset = 3;
            var length = 5;
            builder.preallocated(p, blob, ct, length);

            it ('should get populated according to specification', function () {
                assert.equal(segment[p.position], 1 | (offset<<2));
                assert.equal(segment[p.position+1], offset>>>6);
                assert.equal(segment[p.position+2], offset>>>14);
                assert.equal(segment[p.position+3], offset>>>22);
                assert.equal(segment[p.position+4], ct.layout | (length<<3));
                assert.equal(segment[p.position+5], length>>>5);
                assert.equal(segment[p.position+6], length>>>13);
                assert.equal(segment[p.position+7], length>>>21);
            });

            it ('should point at a tagless blob', function () {
                assert.equal(segment[blob.position], 0);
                assert.equal(segment[blob.position+1], 0);
                assert.equal(segment[blob.position+2], 0);
                assert.equal(segment[blob.position+3], 0);
                assert.equal(segment[blob.position+4], 0);
                assert.equal(segment[blob.position+5], 0);
                assert.equal(segment[blob.position+6], 0);
                assert.equal(segment[blob.position+7], 0);
            });

            it ('should parametrize the layout of a blob', function () {
                var layout = reader.intrasegment(p);
                assert.equal(ct.meta, layout.meta);
                assert.equal(ct.dataBytes, layout.dataBytes);
                assert.equal(ct.pointersBytes, layout.pointersBytes);
                assert.equal(length, layout.length);
                assert.equal(blob.position, layout.begin);
                assert.equal(blob.segment, layout.segment);
            });
        });

        describe ('Intersegment', function () {
            var segment0=new Buffer(80); segment0._id=0; segment0._position=80;
            var segment1=new Buffer(80); segment1._id=1; segment1._position=80;
            segment0.fill(0);
            segment1.fill(0);
            var p = { segment:segment0, position:8 };
            var land = { segment:segment1, position:24 };
            var offset = 3;
            var blob = { segment:segment1, position:32 };
            var length = 5;
            builder.preallocated(p, blob, ct, length);

            it ('should get populated according to specification', function () {
                assert.equal(segment0[p.position], 2 | (0<<2) | (offset<<3));
                assert.equal(segment0[p.position+1], offset>>>5);
                assert.equal(segment0[p.position+2], offset>>>13);
                assert.equal(segment0[p.position+3], offset>>>21);
                assert.equal(segment0[p.position+4], 1);
                assert.equal(segment0[p.position+5], 0);
                assert.equal(segment0[p.position+6], 0);
                assert.equal(segment0[p.position+7], 0);
            });

            it ('should point to a landing pad that is immediately followed by its blob', function () {
                assert.equal(segment1[land.position], 1 | (0<<2));
                assert.equal(segment1[land.position+1], 0);
                assert.equal(segment1[land.position+2], 0);
                assert.equal(segment1[land.position+3], 0);
                assert.equal(segment1[land.position+4], ct.layout | (length<<3));
                assert.equal(segment1[land.position+5], 0);
                assert.equal(segment1[land.position+6], 0);
                assert.equal(segment1[land.position+7], 0);
            });

            it ('should resolve to a tagless blob', function () {
                assert.equal(segment1[blob.position], 0);
                assert.equal(segment1[blob.position+1], 0);
                assert.equal(segment1[blob.position+2], 0);
                assert.equal(segment1[blob.position+3], 0);
                assert.equal(segment1[blob.position+4], 0);
                assert.equal(segment1[blob.position+5], 0);
                assert.equal(segment1[blob.position+6], 0);
                assert.equal(segment1[blob.position+7], 0);
            });

            it ('should parametrize the layout of a blob', function () {
                var layout = reader.intersegment(land, blob);
                assert.equal(ct.meta, layout.meta);
                assert.equal(ct.dataBytes, layout.dataBytes);
                assert.equal(ct.pointersBytes, layout.pointersBytes);
                assert.equal(length, layout.length);
                assert.equal(blob.position, layout.begin);
                assert.equal(blob.segment, layout.segment);
            });
        });
    });

    describe ('Inline-composite', function () {
        describe('Intrasegment', function () {
            var segment = new Buffer(80);
            segment.fill(0);
            var p = { segment:segment, position:0 };
            var blob = { segment:segment, position:32 };
            var offset = 3;
            var length = 8;
            builder.preallocated(p, blob, rt, length);

            var wordAlignedBytes = length * (rt.dataBytes + rt.pointersBytes);

            it ('should get populated according to specification', function () {
                assert.equal(segment[p.position], 1 | (offset<<2));
                assert.equal(segment[p.position+1], offset>>>6);
                assert.equal(segment[p.position+2], offset>>>14);
                assert.equal(segment[p.position+3], offset>>>22);
                assert.equal(segment[p.position+4], rt.layout | wordAlignedBytes);
                assert.equal(segment[p.position+5], wordAlignedBytes>>>8);
                assert.equal(segment[p.position+6], wordAlignedBytes>>>16);
                assert.equal(segment[p.position+7], wordAlignedBytes>>>24);
            });

            it ('should resolve to a tagged blob', function () {
                assert.equal(segment[blob.position], length<<2);
                assert.equal(segment[blob.position+1], length>>>6);
                assert.equal(segment[blob.position+2], length>>>14);
                assert.equal(segment[blob.position+3], length>>>22);
                assert.equal(segment[blob.position+4], rt.dataBytes>>>3);
                assert.equal(segment[blob.position+5], rt.dataBytes>>>11);
                assert.equal(segment[blob.position+6], rt.pointersBytes>>>3);
                assert.equal(segment[blob.position+7], rt.pointersBytes>>>11);
            });

            it ('should parametrize the layout of a blob', function () {
                var layout = reader.intrasegment(p);
                assert.equal(rt.meta, layout.meta);
                assert.equal(rt.dataBytes, layout.dataBytes);
                assert.equal(rt.pointersBytes, layout.pointersBytes);
                assert.equal(length, layout.length);
                assert.equal(blob.position+8, layout.begin); // Skip the tag
                assert.equal(blob.segment, layout.segment);
            });
        });

        describe('Intersegment', function () {
            var segment0=new Buffer(80); segment0._id=0; segment0._position=80;
            var segment1=new Buffer(80); segment1._id=1; segment1._position=80;
            segment0.fill(0);
            segment1.fill(0);
            var p = { segment:segment0, position:8 };
            var land = { segment:segment1, position:24 };
            var offset = 3;
            var blob = { segment:segment1, position:32 };
            var length = 5;
            builder.preallocated(p, blob, rt, length);

            var wordAlignedBytes = length * (rt.dataBytes + rt.pointersBytes);

            it ('should get populated according to specification', function () {
                assert.equal(segment0[p.position], 2 | (0<<2) | (offset<<3));
                assert.equal(segment0[p.position+1], offset>>>5);
                assert.equal(segment0[p.position+2], offset>>>13);
                assert.equal(segment0[p.position+3], offset>>>21);
                assert.equal(segment0[p.position+4], 1);
                assert.equal(segment0[p.position+5], 0);
                assert.equal(segment0[p.position+6], 0);
                assert.equal(segment0[p.position+7], 0);
            });

            it ('should point to a landing pad that is immediately followed by its blob', function () {
                assert.equal(segment1[land.position], 1 | (0<<2));
                assert.equal(segment1[land.position+1], 0);
                assert.equal(segment1[land.position+2], 0);
                assert.equal(segment1[land.position+3], 0);
                assert.equal(segment1[land.position+4], rt.layout | wordAlignedBytes);
                assert.equal(segment1[land.position+5], wordAlignedBytes>>>8);
                assert.equal(segment1[land.position+6], wordAlignedBytes>>>16);
                assert.equal(segment1[land.position+7], wordAlignedBytes>>>24);
            });

            it ('should resolve to a tagged blob offset 0 from its landing pad', function () {
                assert.equal(segment1[blob.position], length<<2);
                assert.equal(segment1[blob.position+1], 0);
                assert.equal(segment1[blob.position+2], 0);
                assert.equal(segment1[blob.position+3], 0);
                assert.equal(segment1[blob.position+4], rt.dataBytes>>>3);
                assert.equal(segment1[blob.position+5], rt.dataBytes>>>11);
                assert.equal(segment1[blob.position+6], rt.pointersBytes>>>3);
                assert.equal(segment1[blob.position+7], rt.pointersBytes>>>11);
            });

            it ('should parametrize the layout of a blob', function () {
                var layout = reader.intersegment(land, blob);
                assert.equal(rt.meta, layout.meta);
                assert.equal(rt.dataBytes, layout.dataBytes);
                assert.equal(rt.pointersBytes, layout.pointersBytes);
                assert.equal(length, layout.length);
                assert.equal(blob.position+8, layout.begin); // Skip the tag.
                assert.equal(blob.segment, layout.segment);
            });
        });
    });
});
