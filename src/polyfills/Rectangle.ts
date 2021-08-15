import Rectangle from './ReadOnlyRectangle';

// tslint:disable-next-line: max-classes-per-file
export default class DOMRect extends Rectangle {
    get x() {
        return this._x;
    }
    set x(value: number) {
        this._x = value;
    }
    get y() {
        return this._y;
    }
    set y(value: number) {
        this._y = value;
    }
    get width() {
        return this._width;
    }
    set width(value: number) {
        this._width = value;
    }
    get height() {
        return this._height;
    }
    set height(value: number) {
        this._height = value;
    }
}
