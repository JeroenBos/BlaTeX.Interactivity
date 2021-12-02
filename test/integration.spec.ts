import { toHTMLElementWithBoundingRectangles } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity, Configuration } from '../src/paintAllPointsByIndex';
import { assert, assertEqual, getDataLoc } from '../src/utils';
import { dumpOverlayBodyWithKatexCSS } from './utils/overlay';
import fs from 'fs';
import { debug_it, getStyle, getTestableSvgPart } from './utils/utils';
import {
    getCursorIndexByProximity,
    getDistance,
    getHtmlElementsWithDataloc,
    HorizontalClosestDistanceType,
    MinDistances,
    VerticalClosestDistanceType,
} from '../src/PointToCursorHandleConverter';
import { ManhattenComparerToBoundary } from '../src/ManhattanToBoundaryComparer';
import Point from '../src/polyfills/Point';

describe('Color HTML based on source locations', () => {
    it('<div>TEXT</div>', async () => {
        const htmlBody = '<div>TEXT</div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M0,0 0,18 1920,18 1920,0 0,0" />
</svg>`
        );
    });

    it('<div data-loc="0,1">TEYT</div>', async () => {
        const htmlBody = '<div data-loc="0,1">TEYT</div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M1920,0 960,0 960,18 1920,18 1920,0" />
<path d="M960,0 0,0 0,18 960,18 960,0" />
</svg>`
        );
    });

    it('<div><div data-loc="0,4">TAXT</div><div data-loc="5,8">TAXT</div></div>', async () => {
        // Arrange
        const htmlBody = '<div><div data-loc="0,4">TAXT</div><div data-loc="5,8">TAXT</div></div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);

        const distance1 = assertParticularPointLocation(
            element,
            new Point(-1, 25),
            5,
            htmlBody,
            '0,4',
            HorizontalClosestDistanceType.LeftOut,
            VerticalClosestDistanceType.BottomOut
        );
        const distance2 = assertParticularPointLocation(
            element,
            new Point(-1, 25),
            5,
            htmlBody,
            '5,8',
            HorizontalClosestDistanceType.LeftOut,
            VerticalClosestDistanceType.TopIn
        );
        assertEqual(ManhattenComparerToBoundary(distance1, distance2), 1);

        // Act
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        // Assert
        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="36">
<path d="M1920,0 960,0 960,19 1920,19 1920,0" />
<path d="M960,19 0,19 0,36 960,36 960,19" />
<path d="M960,19 960,0 0,0 0,19 960,19" />
<path d="M960,19 960,36 1920,36 1920,19 960,19" />
</svg>`
        );
    });

    function assertParticularPointLocation(
        element: HTMLElement,
        point: Point,
        expectedIndex: number,
        html: string,
        dataloc?: string,
        expectedHorzontalDistanceType?: HorizontalClosestDistanceType,
        expectedVerticalDistanceType?: VerticalClosestDistanceType
    ) {
        if (html !== undefined) {
            // dumps a debug depiction to the screen
            const svg = allPointsByIndexToSVGByProximity(
                element,
                getStyle,
                undefined,
                undefined, // 'stroke:red; stroke-width: 0.1px; fill: transparent',
                'fill:green; stroke-width: 0.1px; opacity: 30%',
                false,
                point
            );

            dumpOverlayBodyWithKatexCSS(html, svg);
        }

        let distance: MinDistances | undefined = undefined;
        if (dataloc !== undefined) {
            const datalocElement = getDataLoc(dataloc, getHtmlElementsWithDataloc(element));
            distance = MinDistances.fromManhattan(getDistance(datalocElement, point));
            if (expectedHorzontalDistanceType !== undefined) {
                assertEqual(distance.horizontalType, expectedHorzontalDistanceType);
            }
            if (expectedVerticalDistanceType !== undefined) {
                assertEqual(distance.verticalType, expectedVerticalDistanceType);
            }
        } else assert(expectedHorzontalDistanceType === undefined && expectedVerticalDistanceType === undefined);

        const index = getCursorIndexByProximity(element, point);
        assertEqual(index, expectedIndex);

        return distance;
    }

    it('<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>', async () => {
        const htmlBody = '<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);

        const point = new Point(80, 15);
        assertParticularPointLocation(
            element,
            point,
            2,
            htmlBody,
            '1,2',
            HorizontalClosestDistanceType.RightIn,
            VerticalClosestDistanceType.BottomIn
        );

        const svg = allPointsByIndexToSVGByProximity(
            element,
            getStyle,
            Configuration.createWithExtraSeeds([point]),
            undefined,
            'stroke: red;',
            false,
            point
        );
        dumpOverlayBodyWithKatexCSS(htmlBody, svg); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M22,0 0,0 0,18 22,18 22,0" />
<path d="M64,0 40,0 40,0 22,0 22,18 64,18 64,0" />
<path d="M64,18 1920,18 1920,0 64,0 64,18" />
</svg>`
        );
    });

    debug_it('x to the 2 with horizontal offset CODE9', async (zoom: boolean) => {
        const htmlElement = fs.readFileSync('./test/AnnotatedData/x^2 with horizontal offset.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlElement, true, zoom ? { zoom: 500 } : undefined);

        const point = new Point(100, 12);
        assertParticularPointLocation(element, point, 0, htmlElement);

        // Act
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        // Assert
        const testableSvgPart = getTestableSvgPart(svg).replace(/\n<rect.*\/>/g, '');
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="17.425001" height="21.333334">
<path d="M105,0 100,0 100,23 105,23 105,0" />
<path d="M109,23 109,17 109,23 118,23 118,20 116,20 116,19 115,19 115,18 114,18 114,17 113,17 113,16 112,16 112,15 111,15 111,14 110,14 110,1 109,1 109,0 105,0 105,23 109,23" />
<path d="M114,0 111,0 111,0 109,0 109,1 110,1 110,14 111,14 111,15 112,15 112,16 113,16 113,17 114,17 114,0" />
<path d="M115,0 115,0 114,0 114,18 115,18 115,19 116,19 116,20 118,20 118,0 115,0" />
</svg>`
                : `<svg width="17.421875" height="21">
<path d="M105,1 100,1 100,22 105,22 105,1" />
<path d="M105,22 106,22 106,22 118,22 118,20 116,20 116,19 115,19 115,18 114,18 114,17 113,17 113,16 112,16 112,15 111,15 111,14 110,14 110,1 105,1 105,22" />
<path d="M114,1 111,1 111,1 110,1 110,14 111,14 111,15 112,15 112,16 113,16 113,17 114,17 114,1" />
<path d="M114,18 115,18 115,19 116,19 116,20 118,20 118,1 115,1 115,1 114,1 114,18" />
</svg>`
        );
    });

    debug_it('f(x)', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(element as HTMLElement, getStyle);

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, './test/f_of_x_index_after.html'); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="25.708334" height="17.733334">
<path d="M10,0 3,0 3,19 10,19 10,0" />
<path d="M17,0 10,0 10,19 13,19 13,19 17,19 17,0" />
<path d="M24,19 24,0 19,0 19,0 17,0 17,19 19,19 19,19 24,19" />
<path d="M26,0 24,0 24,19 26,19 26,0" />
<path d="M3,0 0,0 0,19 3,19 3,0" />
</svg>`
                : `<svg width="25.703125" height="17">
<path d="M10,0 3,0 3,17 10,17 10,0" />
<path d="M13,0 13,0 10,0 10,17 13,17 13,17 17,17 17,0 13,0" />
<path d="M24,0 19,0 19,0 17,0 17,17 19,17 19,17 24,17 24,0" />
<path d="M26,0 24,0 24,17 26,17 26,0" />
<path d="M3,0 0,0 0,17 3,17 3,0" />
</svg>`
        );
    });
});
