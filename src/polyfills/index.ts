import ReadOnlyRectangle from './ReadOnlyRectangle';
import Rectangle from './ReadOnlyRectangle';
import Point from './Point';

//@ts-ignore
global.DOMRectReadOnly = ReadOnlyRectangle;
//@ts-ignore
global.DOMRect = Rectangle;

export default { Point: Point, Rectangle, ReadOnlyRectangle };
