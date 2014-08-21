define([ "../isNull" ], function(isNull) {
    return function(List, layout) {
        return function(segments, segment, position) {
            if ((segment[position] & 3) === 1) {
                console.log("List deref:" + position);
                return new List(layout.intrasegment(segments, segment, position));
            } else if ((segment[position] & 3) === 2) {
                return new List(layout.intersegment(segments, segment, position));
            } else if (isNull(segment, position)) {
                throw new Error("Dereferenced a null pointer");
            } else {
                throw new Error("Expected a List pointer");
            }
        };
    };
});