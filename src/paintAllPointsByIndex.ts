import { getDiscretePolygonsByValue_LatticeEndExclusive } from './ManyPointConverter';
import { getCursorIndexByProximity, LOCATION_ATTR_NAME } from './PointToCursorHandleConverter';
import Point from './polyfills/Point';
import Rectangle from './polyfills/ReadOnlyRectangle';
import { Polygon } from './polyfills/RectanglesToPolygon';

/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVG(
    element: HTMLElement,
    configuration: Configuration,
    getValue: (p: Point) => number,
    getStyle: (value: number) => string,
    prepolygonRectangleStyle?: string,
    datalocRectangleStyle?: string
): string {
    const boundingRect = Rectangle.fromRect(element.getBoundingClientRect());
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has no measure');

    const seeds = configuration.seeder(boundingRect);
    const prepolygonStyle =
        prepolygonRectangleStyle !== undefined
            ? { style: prepolygonRectangleStyle, rectangles: [] as Rectangle[] }
            : undefined;
    const polygons = configuration.getDiscretePolygonsByValue(seeds, getValue, prepolygonStyle?.rectangles);

    const svgBuilder: string[] = [`<svg width="${boundingRect.width}" height="${boundingRect.height}">`];
    svgBuilder.push(...polygonsToSVGLines(polygons, getStyle));
    svgBuilder.push(...prepolygonRectsToSVGLines(prepolygonStyle));
    svgBuilder.push(...computeDatalocRectangles(element, datalocRectangleStyle));
    svgBuilder.push(`</svg>`);
    return svgBuilder.join('\n');
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
    prepolygonRectangleStyle?: string,
    datalocRectangleStyle?: string
): string {
    const getValue = function(p: Point) {
        const result = getCursorIndexByProximity(element, { dx: p.x, dy: p.y }) ?? -1;
        // console.log(`${p.x}, ${p.y}: ${result}`);
        return result;
    };
    return allPointsByIndexToSVG(
        element,
        configuration,
        getValue,
        getStyle,
        prepolygonRectangleStyle,
        datalocRectangleStyle
    );
}

function polygonsToSVGLines(polygons: Map<number, Polygon>, getStyle: (value: number) => string): string[] {
    const svgBuilder: string[] = [];
    for (const [value, polygon] of polygons) {
        svgBuilder.push(`<path d="${polygon.toSvgPathString()}" style="${getStyle(value)}" />`);
    }

    return svgBuilder;
}
function prepolygonRectsToSVGLines(prepolygonStyle?: { style: string; rectangles: Rectangle[] }): string[] {
    if (prepolygonStyle === undefined) {
        return [];
    }

    const svgBuilder: string[] = [];
    for (const rectangle of prepolygonStyle.rectangles) {
        svgBuilder.push(
            `<rect x="${rectangle.left}" y="${rectangle.top}" width="${rectangle.width}" height="${rectangle.height}" style="${prepolygonStyle.style}" />`
        );
    }
    return svgBuilder;
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

function computeDatalocRectangles(element: HTMLElement, datalocStyle?: string): string[] {
    if (datalocStyle === undefined) {
        return [];
    }
    const offset = element.getBoundingClientRect();

    const datalocElements = element.querySelectorAll('[' + LOCATION_ATTR_NAME + ']');
    const svgBuilder: string[] = [];
    for (const datalocElement of datalocElements) {
        const r = datalocElement.getBoundingClientRect();
        svgBuilder.push(
            `<rect x="${r.left - offset.x}" y="${r.top - offset.y}" width="${r.width}" height="${
                r.height
            }" style="${datalocStyle}" />`
        );
    }
    return svgBuilder;
}
