import ReadOnlyRectangle from './ReadOnlyRectangle';
import Rectangle from './ReadOnlyRectangle';
import Point from './Point';

//@ts-ignore
global.DOMRectReadOnly = ReadOnlyRectangle;
//@ts-ignore
global.DOMRect = Rectangle;

const exported = { Point: Point, Rectangle, ReadOnlyRectangle };
export default exported;
