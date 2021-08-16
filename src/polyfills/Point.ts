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
}
