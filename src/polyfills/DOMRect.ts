global.DOMRectReadOnly = class DOMRectReadOnly {
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
    public get x() { return this._x; }
    public get y() { return this._y; }
    public get width() { return this._width; }
    public get height() { return this._height; }
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
    public static fromRect(other?: DOMRectInit): DOMRectReadOnly {
        throw new Error("not implemented");
    }
    public toJSON(): string {
        return `{ "x": ${this.x}, "y": ${this.y}, "width": ${this.width}, "height": ${this.height} }`;
    }
}

// tslint:disable-next-line: max-classes-per-file
global.DOMRect = class DOMRect extends global.DOMRectReadOnly {
    get x() {
        // @ts-ignore
        return this._x;
    }
    set x(value: number) {
        // @ts-ignore
        this._x = value;
    }
    get y() {
        // @ts-ignore
        return this._y;
    }
    set y(value: number) {
        // @ts-ignore
        this._y = value;
    }
    get width() {
        // @ts-ignore
        return this._width;
    }
    set width(value: number) {
        // @ts-ignore
        this._width = value;
    }
    get height() {
        // @ts-ignore
        return this._height;
    }
    set height(value: number) {
        // @ts-ignore
        this._height = value;
    }

}
