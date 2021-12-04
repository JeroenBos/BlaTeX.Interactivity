import { getDiscretePolygonsByValue_LatticeEndExclusive } from './jbsnorro/polygons/DivideIntoPolygons';
import { getCursorIndexByProximity, LOCATION_ATTR_NAME } from './PointToCursorHandleConverter';
import Point from './polyfills/Point';
import Rectangle from './polyfills/ReadOnlyRectangle';
import { Polygon } from './jbsnorro/polygons/RectanglesToPolygon';

export const debugPrefix = '<!--DEBUG-->';
/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the element. */
export function allPointsByIndexToSVG(
    element: HTMLElement,
    configuration: Configuration,
    getValue: (p: Point) => number,
    getStyle: (value: number) => string,
    prepolygonRectangleStyle?: string,
    datalocRectangleStyle?: string,
    pointsStyle: boolean = true,
    point?: Point
): string {
    const boundingRect = Rectangle.fromRect(element.getBoundingClientRect());
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has no measure');

    const seeds = configuration.seeder(boundingRect);
    const prepolygonStyle =
        prepolygonRectangleStyle !== undefined
            ? { style: prepolygonRectangleStyle, rectangles: [] as Rectangle[] }
            : undefined;
    const values: { p: Point; value: number }[] = [];
    const newGetValue = (p: Point) => {
        const value = getValue(p);
        values.push({ p, value });
        return value;
    };
    const polygons = configuration.divideSpaceIntoPolygonsByValue(
        seeds,
        pointsStyle ? newGetValue : getValue,
        prepolygonStyle?.rectangles
    );

    const svgBuilder: string[] = [`<svg width="${boundingRect.width}" height="${boundingRect.height}">`];
    svgBuilder.push(...polygonsToSVGLines(polygons, getStyle));
    svgBuilder.push(...prepolygonRectsToSVGLines(prepolygonStyle));
    svgBuilder.push(...computeDatalocRectangles(element, datalocRectangleStyle));
    svgBuilder.push(...computePointsRectangles(values, getStyle));
    if (point !== undefined)
        svgBuilder.push(`${debugPrefix}<rect x="${point.x}" y="${point.y}" width="0.4" height="0.4" style="black" />`);
    svgBuilder.push(`</svg>`);
    return svgBuilder.join('\n');
}

/** Creates an svg with polygons (colored via getStyle(indexOfPolygon)) enclosing same-valued regions (per getValue) on the specified element. */
export function allPointsByIndexToSVGByProximity(
    element: HTMLElement,
    getStyle: (value: number) => string,
    configuration = new Configuration(),
    prepolygonRectangleStyle?: string,
    datalocRectangleStyle?: string,
    pointsStyle: boolean = false,
    point?: Point
): string {
    const getValue = (p: Point) => {
        const result = getCursorIndexByProximity(element, p) ?? -1;
        return result;
    };
    return allPointsByIndexToSVG(
        element,
        configuration,
        getValue,
        getStyle,
        prepolygonRectangleStyle,
        datalocRectangleStyle,
        pointsStyle,
        point
    );
}


export class Configuration {
    public constructor(
        public readonly seeder: (boundingRect: DOMRect) => Point[] = Configuration.createSeeds,
        public readonly divideSpaceIntoPolygonsByValue = (seeds: Point[], getValue: (p: Point) => number, out_Rectangles?: Rectangle[]): Map<number, Polygon> => getDiscretePolygonsByValue_LatticeEndExclusive(seeds, getValue, true, out_Rectangles),
    ) { }
    public static createWithExtraSeeds(points: Point[]) {
        return new Configuration((boundingRect: DOMRect) =>
            Configuration.createSeeds(boundingRect).concat(points)
        );
    }
    public static createFullySeeded() {
        return new Configuration((boundingRect: DOMRect) => {
            const fill = [];
            for (let x = Math.floor(boundingRect.left); x <= Math.floor(boundingRect.right); x++) {
                for (let y = Math.floor(boundingRect.top); y <= Math.floor(boundingRect.bottom); y++) {
                    fill.push(new Point(x, y));
                }
            }
            return fill;
        });
    }
    static createSeeds(boundingRect: DOMRect): Point[] {
        const corners = [
            new Point(Math.floor(boundingRect.left), Math.floor(boundingRect.top)),
            new Point(Math.floor(boundingRect.left), Math.ceil(boundingRect.bottom)),
            new Point(Math.ceil(boundingRect.right), Math.ceil(boundingRect.bottom)),
            new Point(Math.ceil(boundingRect.right), Math.floor(boundingRect.top)),
        ];

        return corners;
    }
}

function polygonsToSVGLines(polygons: Map<number, Polygon>, getStyle: (value: number) => string): string[] {
    const svgBuilder: string[] = [];
    for (const [value, polygon] of polygons) {
        svgBuilder.push(`<path d="${polygon.toSvgPathString()}" style="${getStyle(value)}" />`);
    }

    return svgBuilder.sort();
}

function prepolygonRectsToSVGLines(prepolygonStyle?: { style: string; rectangles: Rectangle[] }): string[] {
    if (prepolygonStyle === undefined) {
        return [];
    }

    const svgBuilder: string[] = [];
    for (const rectangle of prepolygonStyle.rectangles) {
        svgBuilder.push(
            `${debugPrefix}<rect x="${rectangle.left}" y="${rectangle.top}" width="${rectangle.width}" height="${rectangle.height}" style="${prepolygonStyle.style}" />`
        );
    }
    return svgBuilder;
}




function computeDatalocRectangles(element: HTMLElement, datalocStyle?: string): string[] {
    if (datalocStyle === undefined) {
        return [];
    }
    const datalocElements = element.querySelectorAll('[' + LOCATION_ATTR_NAME + ']');
    const svgBuilder: string[] = [];
    for (const datalocElement of datalocElements) {
        const r = datalocElement.getBoundingClientRect();
        svgBuilder.push(
            `${debugPrefix}<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" style="${datalocStyle}" />`
        );
    }
    return svgBuilder;
}

function computePointsRectangles(values: { p: Point; value: number }[], getStyle: (value: number) => string): string[] {
    const svgBuilder: string[] = [];
    for (const { p, value } of values) {
        const common = `opacity: 50%; stroke: black; stroke-width: 0.2;`;
        const rectStyle = getStyle(value);
        const style = rectStyle.substring(0, rectStyle.length - common.length); // strips common. yes this is a hack
        svgBuilder.push(`${debugPrefix}<rect x="${p.x}" y="${p.y}" width="0.4" height="0.4" style="${style}" />`);
    }
    return svgBuilder;
}
