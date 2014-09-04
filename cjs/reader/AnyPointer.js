
    var Any = function(arena, datum, depth) {
        this._arena = arena;
        this._datum = datum;
        this._depth = depth;
    };
    Any.prototype.cast = function(Derefable) {
        /*
         * No increment on `depth` since the caller of `deref` has already
         * incremented.
         */
        return Derefable.deref(this._arena, this._datum, this._depth);
    };
    Any.deref = function(arena, datum, depth) {
        return new Any(arena, datum, depth);
    };
    module.exports = Any;
