var layout = require('./primitive/layout');
var deref = require('./deref');
var m = require('./methods');
    var Voids = function(list) {
        this._segments = list.segments;
        this._segment = list.segment;
        this._length = list.length;
    };
    Voids.prototype.get = function(index) {
        if (index < 0 || this._length <= index) {
            throw new RangeError();
        }
        return null;
    };
    Voids.prototype.length = function() {
        return this._length;
    };
    Voids.prototype.map = m.map;
    Voids.prototype.forEach = m.forEach;
    Voids.prototype.reduce = m.reduce;
    Voids.deref = deref(Voids, layout);
    module.exports = Voids;
