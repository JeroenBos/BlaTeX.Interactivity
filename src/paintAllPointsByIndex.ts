import { getDiscretePolygonsByValue_LatticeEndExclusive } from './ManyPointConverter';
import { getCursorIndexByProximity } from './PointToCursorHandleConverter';
import Point from './polyfills/Point';
import Rectangle from './polyfills/ReadOnlyRectangle';
import { Polygon } from './polyfills/RectanglesToPolygon';

/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVG(
    element: HTMLElement,
    getValue: (p: Point) => number,
    getStyle: (value: number) => string
): string {
    const boundingRect = Rectangle.fromRect(element.getBoundingClientRect());
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has no measure');

    const seeds = createSeeds(boundingRect);
    const polygons = getDiscretePolygonsByValue_LatticeEndExclusive(seeds, getValue);
    return polygonsToSVG(polygons, getStyle, boundingRect);
}

/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVGByProximity(element: HTMLElement, getStyle: (value: number) => string): string {
    const getValue = function(p: Point) {
        const result = getCursorIndexByProximity(element, { dx: p.x, dy: p.y }) ?? -1;
        console.log(`${p.x}, ${p.y}: ${result}`);
        return result;
    };
    return allPointsByIndexToSVG(element, getValue, getStyle);
}

function polygonsToSVG(
    polygons: Map<number, Polygon>,
    getStyle: (value: number) => string,
    boundingRect: Rectangle
): string {
    const svgBuilder: string[] = [`<svg width="${boundingRect.width}" height="${boundingRect.height}">`];
    for (const [value, polygon] of polygons) {
        svgBuilder.push(`<path d="${polygon.toSvgPathString()}" style="${getStyle(value)}" />`);
    }
    svgBuilder.push('</svg>');

    return svgBuilder.join('\n');
}

function createSeeds(boundingRect: DOMRect): Point[] {
    return [
        new Point(0, 0),
        new Point(boundingRect.left, boundingRect.top),
        new Point(boundingRect.left, boundingRect.bottom),
        new Point(boundingRect.right, boundingRect.bottom),
        new Point(boundingRect.right, boundingRect.top),
    ];
}
