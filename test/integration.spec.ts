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
<path d="M22,18 64,18 64,0 40,0 40,0 22,0 22,18
 M1920,18 1920,0 1000,0 1000,0 540,0 540,0 310,0 310,0 86,0 86,18 1920,18" />
<path d="M86,0 64,0 64,18 86,18 86,0" />
</svg>`
        );
    });

    debug_it('x to the 2 with horizontal offset CODE9', async (zoom: boolean) => {
        // The unfortunate truth is that computing the boundingClientRect returns slightly different results in the headless vs headful chromedriver.
        // I have the following options to work around that:
        // - Switch to Firefox and hope it's not the same there
        // - Accept the slightly wrong values: they don't matter for testing anyway, only when I want to do a manual inspection can they be slightly off.
        // - Run the LayoutEngine headfully
        //
        // Actually you know what, I'm willing to go to the LayoutEngine to workaround it from there

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
<path d="M106,23 118,23 118,22 117,22 117,21 116,21 116,20 115,20 115,19 114,19 114,18 110,18 110,0 106,0 106,0 105,0 105,23 106,23 106,23" />
<path d="M114,0 111,0 111,0 110,0 110,18 114,18 114,0" />
<path d="M114,19 115,19 115,20 116,20 116,21 117,21 117,22 118,22 118,0 115,0 115,0 114,0 114,19" />
</svg>`
                : `<svg width="17.421875" height="21">
<path d="M105,1 100,1 100,22 105,22 105,1" />
<path d="M105,22 106,22 106,22 110,22 110,1 106,1 106,1 105,1 105,22
 M117,8 118,8 118,1 117,1 117,8
 M116,22 116,21 115,21 115,20 114,20 114,19 113,19 113,20 112,20 112,21 111,21 111,22 116,22
 M118,18 117,18 117,22 118,22 118,18" />
<path d="M111,21 112,21 112,20 113,20 113,19 114,19 114,1 111,1 111,1 110,1 110,22 111,22 111,21" />
<path d="M117,18 118,18 118,8 117,8 117,1 114,1 114,20 115,20 115,21 116,21 116,22 117,22 117,18" />
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
