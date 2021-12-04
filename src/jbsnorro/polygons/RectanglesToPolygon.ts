// @ts-nocheck
/* eslint-disable */

// Segment object
class Segment {
    constructor(a, b) {
        this.ptA = new Point(a);
        this.ptB = new Point(b);
    }

    intersection(other) {
        return intersect(
            this.ptA.x,
            this.ptA.y,
            this.ptB.x,
            this.ptB.y,
            other.ptA.x,
            other.ptA.y,
            other.ptB.x,
            other.ptB.y
        );
        // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
        // Determine the intersection point of two line segments
        // Return FALSE if the lines don't intersect
        function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
            // Check if none of the lines are of length 0
            if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
                return undefined;
            }
            let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

            // Lines are parallel
            if (denominator === 0) {
                return undefined;
            }

            let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
            let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
            // is the intersection along the segments
            if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
                return undefined;
            }
            // Return a object with the x and y coordinates of the intersection
            let x = x1 + ua * (x2 - x1);
            let y = y1 + ua * (y2 - y1);

            return new Point(x, y);
        }
    }
}
Segment.prototype.toString = function() {
    return '[' + this.ptA + ',' + this.ptB + ']';
};
Segment.prototype.compare = function(other) {
    return (
        (this.ptA.compare(other.ptA) && this.ptB.compare(other.ptB)) ||
        (this.ptA.compare(other.ptB) && this.ptB.compare(other.ptA))
    );
};
Segment.prototype.strictIntersection = function(other) {
    // gets the intersection with the other segment, where the endpoints of the segments cannot intersect
    if (this.ptA.compare(other.ptA)) return false;
    if (this.ptA.compare(other.ptB)) return false;
    if (this.ptB.compare(other.ptA)) return false;
    if (this.ptB.compare(other.ptB)) return false;

    return this.intersection(other);
};

class Point {
    constructor(a, b) {
        // a=x,b=y
        if (b !== undefined) {
            this.x = a;
            this.y = b;
        }
        // a=Point or {x:?,y:?,id:?}
        else if (a !== undefined && a) {
            this.x = a.x;
            this.y = a.y;
        }
        // empty
        else {
            this.x = this.y = 0;
        }
    }
    equals(other, strict = false) {
        return this.x === other.x && this.y === other.y;
    }
    compare(other, strict = false) {
        return this.x === other.x && this.y === other.y;
    }
}
Point.prototype.toString = function() {
    return '{x:' + this.x + ',y:' + this.y + '}';
};
Point.prototype.toHashkey = function() {
    // We could use toString(), but I am concerned with
    // the performance of Polygon.merge(). As for now
    // I have no idea if its really that much of an
    // improvement, but I figure the shorter the string
    // used as a hash key, the better. This also reduce
    // the number of concatenations from 6 to 2. Ultimately,
    // I could cache the hash key..
    // Ah, there is this:
    //  http://www.softwaresecretweapons.com/jspwiki/javascriptstringconcatenation
    return this.x + '_' + this.y;
};
Point.prototype.clone = function() {
    return new Point(this);
};
Point.prototype.offset = function(dx, dy) {
    this.x += dx;
    this.y += dy;
};
Point.prototype.set = function(a) {
    this.x = a.x;
    this.y = a.y;
};

// Contour object, a collection of points forming a closed figure
// Clockwise = filled, counterclockwise = hollow
class Contour {
    pts: Point[];
    constructor(a) {
        this.pts = []; // no points
        if (a) {
            var iPt;
            var nPts;
            if (a instanceof Contour) {
                var pts = a.pts;
                nPts = pts.length;
                for (iPt = 0; iPt < nPts; iPt++) {
                    this.pts.push(pts[iPt].clone());
                }
                if (a.bbox) {
                    this.bbox = a.bbox.clone();
                }
                this.area = a.area;
                this.hole = a.hole; // may sound funny..
            } else if (a instanceof Array) {
                nPts = a.length;
                for (iPt = 0; iPt < nPts; iPt++) {
                    this.pts.push(a[iPt].clone());
                }
            } else {
                alert("Contour ctor: Unknown arg 'a'");
            }
        }
    }

    toSvgPathString(): string {
        if (this.pts.length === 0) return '';

        const elements: string[] = [];
        for (const p of this.pts.concat([this.pts[0]])) {
            elements.push(p.x.toString() + ',' + p.y.toString());
        }
        return elements.join(' ');
    }
}
Contour.prototype.clone = function() {
    return new Contour(this);
};
Contour.prototype.addPoint = function(p) {
    this.pts.push(new Point(p));
    delete this.bbox;
    delete this.area;
    delete this.hole;
};
Contour.prototype.getBbox = function() {
    if (this.bbox === undefined) {
        this.bbox = new Bbox();
        var pts = this.pts;
        var nPts = pts.length;
        // we need at least 3 points for a non-empty bbox
        if (nPts > 2) {
            var bbox = new Bbox(pts[0], pts[1]);
            for (var iPt = 2; iPt < nPts; iPt++) {
                bbox.unionPoint(pts[iPt]);
            }
            this.bbox.union(bbox);
        }
    }
    return this.bbox.clone();
};
Contour.prototype.offset = function(dx, dy) {
    var pts = this.pts;
    var nPts = pts.length;
    for (var iPt = 0; iPt < nPts; iPt++) {
        pts[iPt].offset(dx, dy);
    }
    if (this.bbox) {
        this.bbox.offset(dx, dy);
    }
};
Contour.prototype.isHollow = function() {
    // A hole will have a negative surface area as per:
    // http://local.wasp.uwa.edu.au/~pbourke/geometry/polyarea/ by Paul Bourke
    // Since I started this project before I started to care about areas of polygons,
    // and that originally I described my contours with clockwise serie of points, filled
    // contour are currently represented with negative area, while hollow contour are
    // represented with positive area. Something to keep in mind.
    if (this.hole === undefined) {
        this.hole = this.getArea() > 0;
    }
    return this.hole;
};
Contour.prototype.getArea = function() {
    // http://local.wasp.uwa.edu.au/~pbourke/geometry/polyarea/ by Paul Bourke
    // Quote: "for this technique to work is that the polygon must not be self intersecting"
    // Fine with us, that will never happen (unless there is a bug)
    // Quote: "the holes areas will be of opposite sign to the bounding polygon area"
    // This is great, just by calculating the area, we determine wether the contour
    // is hollow or filled. Moreover, by adding up the areas of all contours describing
    // a polygon, we find whether or not a polygon is mostly hollow or mostly filled,
    // useful to implement display performance enhancement strategies.
    if (this.area === undefined) {
        var area = 0;
        var pts = this.pts;
        var nPts = pts.length;
        if (nPts > 2) {
            var j = nPts - 1;
            var p1;
            var p2;
            for (var i = 0; i < nPts; j = i++) {
                p1 = pts[i];
                p2 = pts[j];
                area += p1.x * p2.y;
                area -= p1.y * p2.x;
            }
            this.area = area / 2;
        }
    }
    return this.area;
};
Contour.prototype.getSegments = function() {
    const result = [];
    for (let i = 0; i < this.pts.length; i++) {
        const otherP1 = this.pts[i];
        const otherP2 = this.pts[(i + 1) % this.pts.length];
        const segment = new Segment(otherP1, otherP2);
        result.push(segment);
    }
    return result;
};
Contour.prototype.divideOnIntersections = function(otherContour) {
    if (this.getBbox().doesIntersectNonStrictly(otherContour.getBbox())) {
        const thisSegments = this.getSegments();
        const otherSegments = otherContour.getSegments();

        for (let i = thisSegments.length - 1; i >= 0; i--) {
            const thisSegment = thisSegments[i];

            for (let j = otherSegments.length - 1; j >= 0; j--) {
                const otherSegment = otherSegments[j];

                const intersection = thisSegment.intersection(otherSegment);
                if (intersection) {
                    // throw new Error("Not implemented");
                    // there's a bug here
                    // segments can be split and then the halves should continue in this computation
                    // whereas the whole remains. It could be that 2 points are interjected in the wrong order
                    if (!thisSegment.ptA.compare(intersection) && !thisSegment.ptB.compare(intersection)) {
                        this.pts.splice(i + 1, 0, intersection);
                        const newSegment1 = new Segment(thisSegment.ptA, intersection);
                        const newSegment2 = new Segment(intersection, thisSegment.ptB);
                        thisSegments.splice(i, 1, newSegment1, newSegment2);
                        i++;
                        break;
                    }
                    if (!otherSegment.ptA.compare(intersection) && !otherSegment.ptB.compare(intersection)) {
                        otherContour.pts.splice(j + 1, 0, intersection);

                        const newSegment1 = new Segment(otherSegment.ptA, intersection);
                        const newSegment2 = new Segment(intersection, otherSegment.ptB);
                        otherSegments.splice(j, 1, newSegment1, newSegment2);
                        j++;
                        continue;
                    }
                }
            }
        }
    }
};
Contour.prototype.rotate = function(angle, x0, y0) {
    if (!angle) {
        return;
    }
    // http://www.webreference.com/js/tips/000712.html
    var cosang = Math.cos(angle);
    var sinang = Math.sin(angle);
    var rnd = Math.round;
    var pts = this.pts;
    var nPts = pts.length;
    var pt;
    var x;
    var y;
    for (var iPt = 0; iPt < nPts; iPt++) {
        pt = pts[iPt];
        x = pt.x - x0;
        y = pt.y - y0;
        // http://www.topcoder.com/tc?module=Static&d1=tutorials&d2=geometry2
        pt.x = rnd(x * cosang - y * sinang) + x0;
        pt.y = rnd(x * sinang + y * cosang) + y0;
    }
    delete this.bbox; // no longer valid
};
Contour.prototype._simplify = function() {
    for (let i = 0; i < this.pts.length; i++) {
        const p = this.pts[i];
        const next = this.pts[(i + 1) % this.pts.length];
        const after = this.pts[(i + 2) % this.pts.length];

        // prevent div by zero:
        if (p.x === next.x && next.x === after.x) {
            this.pts.splice((i + 1) % this.pts.length, 1);
            i--;
        } else {
            const firstSlope = (next.y - p.y) / (next.x - p.x);
            const secondSlope = (after.y - next.y) / (after.x - next.x);
            if (firstSlope === secondSlope) {
                this.pts.splice((i + 1) % this.pts.length, 1);
                i--;
            }
        }
    }
};

// Polygon object, a collection of Contour objects
class Polygon {
    public contours: Contour[];
    constructor(a) {
        this.contours = []; // no contour
        if (a) {
            if (a instanceof Polygon) {
                var contours = a.contours;
                var nContours = contours.length;
                for (var iContour = 0; iContour < nContours; iContour++) {
                    this.contours.push(new Contour(contours[iContour]));
                }
                if (this.bbox) {
                    this.bbox = a.bbox.clone();
                }
                this.area = a.area;
                if (this.centroid) {
                    this.centroid = a.centroid.clone();
                }
                this.mostlyHollow = a.mostlyHollow;
            } else if (a instanceof Array) {
                this.contours.push(new Contour(a));
            } else {
                alert("Polygon ctor: Unknown arg 'a'");
            }
        }
    }
    static fromRectangle(r) {
        const topLeft = new Point(r.topLeft.x, r.topLeft.y);
        const bottomLeft = new Point(r.bottomLeft.x, r.bottomLeft.y);
        const bottomRight = new Point(r.bottomRight.x, r.bottomRight.y);
        const topRight = new Point(r.topRight.x, r.topRight.y);
        return new Polygon([topLeft, bottomLeft, bottomRight, topRight]);
    }
    toSvgPathString(): string {
        const elements: string = [];
        for (const contour of this.contours) {
            elements.push(contour.toSvgPathString());
        }
        return 'M' + elements.join('\n M');
    }

    simplify() {
        // merge segments that are extensions of each other
        for (let i = this.contours.length - 1; i >= 0; i--) {
            const contour = this.contours[i];
            contour._simplify();
            // TODO: look into how it's possible that a contour simplifies to nothing 🤔
            if (contour.pts.length === 0) {
                this.contours.splice(i, 1);
            }
        }
    }

    merge(other) {
        for (const contour of this.contours) {
            for (const otherContour of other.contours) {
                contour.divideOnIntersections(otherContour);
            }
        }
        // Simply put, this algorithm XOR each segment of
        // a polygon with each segment of another polygon.
        // This means we delete any segment which appear an
        // even number of time. Whatever segments are left in the
        // collection are connected together to form one or more
        // contour.
        // Of course, this works because we know we are working
        // with polygons which are perfectly adjacent and never
        // overlapping.
        // A nice side-effect of the current algorithm is that
        // we do not need to know expressly which contours are full
        // and which are holes: The contours created will automatically
        // have a clockwise/counterclockwise direction such that they
        // fits exactly the non-zero winding number rule used by the
        // <canvas> element, thus suitable to be used as is for
        // clipping and complex polygon filling.
        // TODO: write an article to illustrate exactly how this work.
        // TODO: handle special cases here (ex. empty polygon, etc)

        // A Javascript object can be used as an associative array, but
        // they are not real associative array, as there is no way
        // to query the number of entries in the object. For this
        // reason, we maintain an element counter ourself.
        var segments = {};
        var contours = this.contours;
        var nContours = contours.length;
        var pts;
        var nPts;
        var iPtA;
        var iPtB;
        var idA;
        var idB;
        for (var iContour = 0; iContour < nContours; iContour++) {
            pts = contours[iContour].pts;
            nPts = pts.length;
            iPtA = nPts - 1;
            for (iPtB = 0; iPtB < nPts; iPtA = iPtB++) {
                idA = pts[iPtA].toHashkey();
                idB = pts[iPtB].toHashkey();
                if (!segments[idA]) {
                    segments[idA] = { n: 1, pts: {} };
                } else {
                    segments[idA].n++;
                }
                segments[idA].pts[idB] = new Segment(pts[iPtA], pts[iPtB]);
            }
        }
        // enumerate segments in other's contours, eliminate duplicate
        contours = other.contours;
        nContours = contours.length;
        for (iContour = 0; iContour < nContours; iContour++) {
            pts = contours[iContour].pts;
            nPts = pts.length;
            iPtA = nPts - 1;
            for (iPtB = 0; iPtB < nPts; iPtA = iPtB++) {
                idA = pts[iPtA].toHashkey();
                idB = pts[iPtB].toHashkey();
                // duplicate (we eliminate same segment in reverse direction)
                if (segments[idB] && segments[idB].pts[idA]) {
                    delete segments[idB].pts[idA];
                    if (!--segments[idB].n) {
                        delete segments[idB];
                    }
                }
                // not a duplicate
                else {
                    if (!segments[idA]) {
                        segments[idA] = { n: 1, pts: {} };
                    } else {
                        segments[idA].n++;
                    }
                    segments[idA].pts[idB] = new Segment(pts[iPtA], pts[iPtB]);
                }
            }
        }
        // recreate and store new contours by jumping from one point to the next,
        // using the second point of the segment as hash key for next segment
        this.contours = []; // regenerate new contours
        var contour;
        var segment;
        for (idA in segments) {
            // we need this to get a starting point for a new contour
            contour = new Contour();
            this.contours.push(contour);
            for (idB in segments[idA].pts) {
                break;
            }
            segment = segments[idA].pts[idB];
            while (segment) {
                contour.addPoint(segment.ptA);
                // remove from collection since it has now been used
                delete segments[idA].pts[idB];
                if (!--segments[idA].n) {
                    delete segments[idA];
                }
                idA = segment.ptB.toHashkey();
                if (segments[idA]) {
                    for (idB in segments[idA].pts) {
                        break;
                    } // any end point will do
                    segment = segments[idA].pts[idB];
                } else {
                    segment = null;
                }
            }
        }

        // invalidate cached values
        delete this.bbox;
        delete this.area;
        delete this.centroid;
        delete this.mostlyHollow;
    }
}
Polygon.prototype.clone = function() {
    return new Polygon(this);
};
Polygon.prototype.getBbox = function() {
    if (!this.bbox) {
        this.bbox = new Bbox();
        var contours = this.contours;
        var nContours = contours.length;
        for (var iContour = 0; iContour < nContours; iContour++) {
            this.bbox.union(contours[iContour].getBbox());
        }
    }
    return this.bbox.clone();
};

Polygon.prototype.getArea = function() {
    // We addup the area of all our contours.
    // Contours representing holes will have a negative area.
    if (!this.area) {
        var area = 0;
        var contours = this.contours;
        var nContours = contours.length;
        for (var iContour = 0; iContour < nContours; iContour++) {
            area += contours[iContour].getArea();
        }
        this.area = area;
    }
    return this.area;
};
Polygon.prototype.getCentroid = function() {
    if (!this.centroid) {
        var contours = this.contours;
        var nContours = contours.length;
        var pts;
        var nPts;
        var x = 0;
        var y = 0;
        var f;
        var iPt;
        var jPt;
        var p1;
        var p2;
        for (var iContour = 0; iContour < nContours; iContour++) {
            pts = contours[iContour].pts;
            nPts = pts.length;
            // http://local.wasp.uwa.edu.au/~pbourke/geometry/polyarea/ by Paul Bourke
            jPt = nPts - 1;
            for (iPt = 0; iPt < nPts; jPt = iPt++) {
                p1 = pts[iPt];
                p2 = pts[jPt];
                f = p1.x * p2.y - p2.x * p1.y;
                x += (p1.x + p2.x) * f;
                y += (p1.y + p2.y) * f;
            }
        }
        f = this.getArea() * 6;
        // centroid relative to self bbox
        var origin = this.getBbox().getTopleft();
        this.centroid = new Point({ x: mthrnd(x / f - origin.x), y: mthrnd(y / f - origin.y) });
    }
    return this.centroid.clone();
};
Polygon.prototype.pointIn = function(p) {
    alert('Polygon.prototype.pointIn: No longer supported');
};
Polygon.prototype.offset = function(dx, dy) {
    var contours = this.contours;
    var nContours = contours.length;
    for (var iContour = 0; iContour < nContours; iContour++) {
        contours[iContour].offset(dx, dy);
    }
    if (this.bbox) {
        this.bbox.offset(dx, dy);
    }
    if (this.centroid) {
        this.centroid.offset(dx, dy);
    }
};
Polygon.prototype.moveto = function(x, y) {
    // position is centroid
    var centroid = this.getCentroid();
    var tl = this.getBbox().getTopLeft();
    this.offset(x - tl.x - centroid.x, y - tl.y - centroid.y);
};
Polygon.prototype.rotate = function(angle, x0, y0) {
    if (!angle) {
        return;
    }
    // http://www.webreference.com/js/tips/000712.html
    var contours = this.contours;
    var nContours = contours.length;
    for (var iContour = 0; iContour < nContours; iContour++) {
        contours[iContour].rotate(angle, x0, y0);
    }
    delete this.bbox; // no longer valid
    delete this.centroid; // no longer valid (since it's relative to self bbox
};
Polygon.prototype.doesIntersect = function(bbox) {
    return this.getBbox().doesIntersect(bbox);
};
Polygon.prototype.isMostlyHollow = function() {
    if (this.mostlyHollow === undefined) {
        // we add up all solid and hollow contours and
        // compare the result to determine whether this
        // polygon is mostly solid or hollow
        var areaSolid = 0;
        var areaHollow = 0;
        var contours = this.contours;
        var nContours = contours.length;
        var area;
        for (var iContour = 0; iContour < nContours; iContour++) {
            area = contours[iContour].getArea();
            if (area < 0) {
                areaSolid += area;
            } else {
                areaHollow += area;
            }
        }
        this.mostlyHollow = areaHollow > areaSolid;
    }
    return this.mostlyHollow;
};
Polygon.prototype.getPoints = function() {
    var r = [];
    var contours = this.contours;
    var nContours = contours.length;
    var contour;
    var pts;
    var iPt;
    var nPts;
    for (var iContour = 0; iContour < nContours; iContour++) {
        contour = contours[iContour];
        pts = contour.pts;
        nPts = pts.length;
        for (iPt = 0; iPt < nPts; iPt++) {
            r.push(new Point(pts[iPt]));
        }
    }
    return r;
};
// Bounding box object
function Bbox(a, b, c, d) {
    // a=x1,b=y1,c=x2,d=y2
    if (d !== undefined) {
        this.tl = new Point({ x: a, y: b });
        this.br = new Point({ x: c, y: d });
    }
    // a=Point or {x:?,y:?},b=Point or {x:?,y:?}
    else if (b !== undefined) {
        var mn = Math.min;
        var mx = Math.max;
        this.tl = new Point({ x: mn(a.x, b.x), y: mn(a.y, b.y) });
        this.br = new Point({ x: mx(a.x, b.x), y: mx(a.y, b.y) });
    }
    // a=Bbox or {tl:{x:?,y:?},br:{x:?,y:?}}
    else if (a) {
        this.tl = new Point(a.tl);
        this.br = new Point(a.br);
    }
    // empty
    else {
        this.tl = new Point();
        this.br = new Point();
    }
}
Bbox.prototype.toString = function() {
    return '{tl:' + this.tl + ',br:' + this.br + '}';
};
Bbox.prototype.clone = function() {
    return new Bbox(this);
};
Bbox.prototype.getTopleft = function() {
    return new Point(this.tl);
};
Bbox.prototype.getBottomright = function() {
    return new Point(this.br);
};
Bbox.prototype.unionPoint = function(p) {
    var mn = Math.min;
    var mx = Math.max;
    this.tl.x = mn(this.tl.x, p.x);
    this.tl.y = mn(this.tl.y, p.y);
    this.br.x = mx(this.br.x, p.x);
    this.br.y = mx(this.br.y, p.y);
};
Bbox.prototype.width = function() {
    return this.br.x - this.tl.x;
};
Bbox.prototype.height = function() {
    return this.br.y - this.tl.y;
};
Bbox.prototype.offset = function(dx, dy) {
    this.tl.offset(dx, dy);
    this.br.offset(dx, dy);
};
Bbox.prototype.set = function(a) {
    // array of Points
    var mx = Math.max;
    var mn = Math.min;
    this.tl.x = this.br.x = a[0].x;
    this.tl.y = this.br.y = a[0].y;
    for (var i = 1; i < a.length; i++) {
        var p = a[i];
        this.tl.x = mn(this.tl.x, p.x);
        this.tl.y = mn(this.tl.y, p.y);
        this.br.x = mx(this.br.x, p.x);
        this.br.y = mx(this.br.y, p.y);
    }
};
Bbox.prototype.pointIn = function(p) {
    return p.x > this.tl.x && p.x < this.br.x && p.y > this.tl.y && p.y < this.br.y;
};
Bbox.prototype.doesIntersect = function(bb) {
    var mn = Math.min;
    var mx = Math.max;
    return mn(bb.br.x, this.br.x) - mx(bb.tl.x, this.tl.x) > 0 && mn(bb.br.y, this.br.y) - mx(bb.tl.y, this.tl.y) > 0;
};
Bbox.prototype.doesIntersectNonStrictly = function(bb) {
    var mn = Math.min;
    var mx = Math.max;
    return mn(bb.br.x, this.br.x) - mx(bb.tl.x, this.tl.x) >= 0 && mn(bb.br.y, this.br.y) - mx(bb.tl.y, this.tl.y) >= 0;
};
Bbox.prototype.union = function(other) {
    // this bbox is empty
    if (this.isEmpty()) {
        this.tl = new Point(other.tl);
        this.br = new Point(other.br);
    }
    // union only if other bbox is not empty
    else if (!other.isEmpty()) {
        var mn = Math.min;
        var mx = Math.max;
        this.tl.x = mn(this.tl.x, other.tl.x);
        this.tl.y = mn(this.tl.y, other.tl.y);
        this.br.x = mx(this.br.x, other.br.x);
        this.br.y = mx(this.br.y, other.br.y);
    }
    return this;
};
Bbox.prototype.inflate = function(a) {
    this.tl.x -= a;
    this.tl.y -= a;
    this.br.x += a;
    this.br.y += a;
};
Bbox.prototype.isEmpty = function() {
    return this.width() <= 0 || this.height() <= 0;
};
Bbox.prototype.toCanvasPath = function(ctx) {
    ctx.rect(this.tl.x, this.tl.y, this.width(), this.height());
};

export { Contour, Point, Polygon, Segment };
