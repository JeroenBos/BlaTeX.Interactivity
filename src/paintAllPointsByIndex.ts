import { getDiscretePolygonsByValue_LatticeEndExclusive } from './ManyPointConverter';
import { getCursorIndexByProximity } from './PointToCursorHandleConverter';
import Point from './polyfills/Point';
import Rectangle from './polyfills/ReadOnlyRectangle';
import { Polygon } from './polyfills/RectanglesToPolygon';

/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVG(
    element: HTMLElement,
    configuration: Configuration,
    getValue: (p: Point) => number,
    getStyle: (value: number) => string,
    rectangleStyle: string | undefined = undefined
): string {
    const boundingRect = Rectangle.fromRect(element.getBoundingClientRect());
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has no measure');

    const seeds = configuration.seeder(boundingRect);
    const extraRects =
        rectangleStyle !== undefined ? { style: rectangleStyle, rectangles: [] as Rectangle[] } : undefined;
    const polygons = configuration.getDiscretePolygonsByValue(seeds, getValue, extraRects?.rectangles);
    return polygonsToSVG(polygons, getStyle, boundingRect, extraRects);
}

export class Configuration {
    public constructor(
        public readonly getDiscretePolygonsByValue: (
            seeds: Point[],
            getValue: (p: Point) => number,
            out_Rectangles?: Rectangle[]
        ) => Map<number, Polygon> = getDiscretePolygonsByValue_LatticeEndExclusive,
        public readonly seeder: (boundingRect: DOMRect) => Point[] = createSeeds
    ) {}
    public static createWithExtraSeeds(points: Point[]) {
        return new Configuration(getDiscretePolygonsByValue_LatticeEndExclusive, (boundingRect: DOMRect) =>
            createSeeds(boundingRect).concat(points)
        );
    }
}
/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVGByProximity(
    element: HTMLElement,
    getStyle: (value: number) => string,
    configuration = new Configuration(),
    rectangleStyle?: string
): string {
    const getValue = function(p: Point) {
        const result = getCursorIndexByProximity(element, { dx: p.x, dy: p.y }) ?? -1;
        // console.log(`${p.x}, ${p.y}: ${result}`);
        return result;
    };
    return allPointsByIndexToSVG(element, configuration, getValue, getStyle, rectangleStyle);
}

function polygonsToSVG(
    polygons: Map<number, Polygon>,
    getStyle: (value: number) => string,
    boundingRect: Rectangle,
    extraRectangles: { style: string; rectangles: Rectangle[] } | undefined = undefined
): string {
    const svgBuilder: string[] = [`<svg width="${boundingRect.width}" height="${boundingRect.height}">`];
    for (const [value, polygon] of polygons) {
        svgBuilder.push(`<path d="${polygon.toSvgPathString()}" style="${getStyle(value)}" />`);
    }
    if (extraRectangles !== undefined) {
        for (const rectangle of extraRectangles.rectangles) {
            svgBuilder.push(
                `<rect x="${rectangle.left}" y="${rectangle.top}" width="${rectangle.width}" height="${rectangle.height}" style="${extraRectangles.style}" />`
            );
        }
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
