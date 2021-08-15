import Point from './Point';

export default class DOMRectReadOnly {
    protected _x: number;
    protected _y: number;
    protected _width: number;
    protected _height: number;
    constructor(x: number, y: number, width: number, height: number) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
    }
    public get x() {
        return this._x;
    }
    public get y() {
        return this._y;
    }
    public get width() {
        return this._width;
    }
    public get height() {
        return this._height;
    }
    public get top() {
        return this._y + (this._height < 0 ? this._height : 0);
    }
    public get left() {
        return this._x + (this._width < 0 ? this._width : 0);
    }
    public get right() {
        return this._x + (this._width >= 0 ? this._width : 0);
    }
    public get bottom() {
        return this._y + (this._height >= 0 ? this._height : 0);
    }
    public get bottomRight() {
        return new Point(this.right, this.bottom);
    }
    public get topLeft() {
        return new Point(this.left, this.top);
    }
    public get bottomLeft() {
        return new Point(this.left, this.bottom);
    }
    public get topRight() {
        return new Point(this.right, this.top);
    }
    public static fromRect(other?: DOMRectInit): DOMRectReadOnly {
        throw new Error('not implemented' + other);
    }
    public toJSON(): string {
        return `{ "x": ${this.x}, "y": ${this.y}, "width": ${this.width}, "height": ${this.height} }`;
    }
    public static fromCorners(topLeft: Point, bottomRight: Point): DOMRectReadOnly {
        // TODO: inversion if width or height becomes negative
        return new DOMRectReadOnly(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }
    public static fromSides(left: number, top: number, right: number, bottom: number): DOMRectReadOnly {
        // TODO: inversion if width or height becomes negative
        return new DOMRectReadOnly(left, top, right - left, bottom - top);
    }
    public equals(rect: DOMRectReadOnly): boolean {
        return (
            this._x === rect._x && this._y === rect._y && this._width === rect._width && this._height === rect._height
        );
    }
    public contains(p: Point, endExclusive = true): boolean {
        if (p.x < this.left) return false;
        if (p.y < this.top) return false;
        if (endExclusive) {
            if (p.x >= this.right) return false;
            if (p.y >= this.bottom) return false;
        } else {
            if (p.x > this.right) return false;
            if (p.y > this.bottom) return false;
        }
        return true;
    }
}
