export type SourceLocation = { start: number; end: number };

export class SourceLocationComposition implements SourceLocation {
    public constructor(
        public readonly start: number,
        public readonly end: number,
        public readonly segments: number,) {
        if (segments <= 0) throw new Error("segments <= 0");
    }

    *getSegmentRectangles(rect: DOMRect) {
        for (let i = 0; i < this.segments; i++) {
            yield this.getSourceLocation(rect, i);
        }
    }
    /** Splits the rectangle horizontally in the number of segments. */
    *getSegmentRectanglesAndSourceLocations(rect: DOMRect) {
        if (this.segments === 1) {
            yield { segmentRect: rect, loc: { start: this.start, end: this.end } };
        }
        else {
            for (let i = 0; i < this.segments; i++) {
                yield { segmentRect: this.getSourceLocation(rect, i), loc: { start: this.start + i, end: this.start + i + 1 } };
            }
        }
    }
    /** Gets the horizontally split off rectangle at the specified segment index. */
    getSourceLocation(rect: DOMRect, segmentIndex: number): DOMRect {
        if (this.segments === 1)
            return rect;

        const deltaWidth = rect.width / this.segments;
        return new DOMRect(rect.x + segmentIndex * deltaWidth, rect.y, deltaWidth, rect.height);
    }
}
