// represents a shape of a rectangle with a rectangle cut out of each corner.

import Point from './Point';
import Rectangle from './ReadOnlyRectangle';

// tslint:disable-next-line: max-classes-per-file
export default class PlusShape {
    constructor(
        public readonly boundingBoxLeft: number,
        public readonly boundingBoxTop: number,
        public readonly boundingWidth: number,
        public readonly boundingHeight: number,
        public readonly cutWidth: number,
        public readonly cutHeight: number
    ) {}

    get boundingBoxRight() {
        return this.boundingBoxLeft + this.boundingWidth;
    }
    get boundingBoxBottom() {
        return this.boundingBoxTop + this.boundingHeight;
    }

    private get topLeftCut() {
        return new Rectangle(this.boundingBoxLeft, this.boundingBoxTop, this.cutWidth, this.cutHeight);
    }
    private get topRightCut() {
        return new Rectangle(this.boundingBoxLeft - this.cutWidth, this.boundingBoxTop, this.cutWidth, this.cutHeight);
    }
    private get bottomLeftCut() {
        return new Rectangle(
            this.boundingBoxLeft,
            this.boundingBoxBottom - this.cutHeight,
            this.cutWidth,
            this.cutHeight
        );
    }
    private get bottomRightCut() {
        return new Rectangle(
            this.boundingBoxLeft - this.cutWidth,
            this.boundingBoxBottom - this.cutHeight,
            this.cutWidth,
            this.cutHeight
        );
    }
    get boundingBoxRect() {
        return new Rectangle(this.boundingBoxLeft, this.boundingBoxTop, this.boundingWidth, this.boundingHeight);
    }

    public contains(p: Point, endExclusive: boolean = false) {
        return (
            this.boundingBoxRect.contains(p, endExclusive) &&
            !this.topLeftCut.contains(p, endExclusive) &&
            !this.topRightCut.contains(p, endExclusive) &&
            !this.bottomLeftCut.contains(p, endExclusive) &&
            !this.bottomRightCut.contains(p, endExclusive)
        );
    }
}
