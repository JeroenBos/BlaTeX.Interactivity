export default class Point {
    protected _x: number;
    protected _y: number;
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    public get x() {
        return this._x;
    }
    public get y() {
        return this._y;
    }
    public equals(other: Point) {
        return this._x === other._x && this._y === other._y;
    }
    public static equal(a: Point, b: Point) {
        return a.equals(b);
    }
    public clone() {
        return new Point(this.x, this.y);
    }
    public toHashkey() {
        return this.x + '_' + this.y;
    }

    public floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y));
    }
    public round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }
    public ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y));
    }

    public toString() {
        return `(${this._x}, ${this._y})`;
    }
}
