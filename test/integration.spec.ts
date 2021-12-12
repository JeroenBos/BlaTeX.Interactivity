import { toHTMLElementWithBoundingRectangles, toHTMLElementWithBoundingRectanglesWithTag } from './utils/computeLayout';
import { allPointsByIndexToSVGByProximity, Configuration } from '../src/paintAllPointsByIndex';
import { assert, assertEqual, getDataLoc } from '../src/utils';
import { dumpOverlayBodyWithKatexCSS } from './utils/overlay';
import fs from 'fs';
import { readAllText } from '../src';
import { debug_it, getStyle, getTestableSvgPart, isUbuntuCI } from './utils/utils';
import {
    getCursorIndexByProximity,
    getDistance,
    getHtmlElementsWithDataloc,
} from '../src/PointToCursorHandleConverter';
import { ManhattanDistanceComparer } from '../src/jbsnorro/polygons/ManhattanDistanceComparer';
import Point from '../src/polyfills/Point';
import { HorizontalClosestDistanceType, MinDistances, VerticalClosestDistanceType } from '../src/jbsnorro/polygons/MinDistances';
import { initGlobalTypesFromJSDOM } from '.';

function readExpectedSvg(name: string, zoom: boolean): string {
    const contents = readAllText("./test/expected/" + name  + (zoom ? ".zoom" : isUbuntuCI ? ".ci" : "") + ".svg");
    return contents.trim();
}
describe('Color HTML based on source locations', () => {
    beforeEach(initGlobalTypesFromJSDOM);

    it('<div>TEXT</div>', async () => {
        const htmlBody = '<div>TEXT</div>';
        const element = await toHTMLElementWithBoundingRectanglesWithTag(htmlBody, "TEXT");
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="36">
<path d="M0,0 0,18 1920,18 1920,0 0,0" />
</svg>`
        );
    });

    it('<div data-loc="0,1">TEYT</div>', async () => {
        const htmlBody = '<div data-loc="0,1">TEYT</div>';
        const element = await toHTMLElementWithBoundingRectanglesWithTag(htmlBody, "TEYT");
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="36">
<path d="M1920,0 960,0 960,18 1920,18 1920,0" />
<path d="M960,0 0,0 0,18 960,18 960,0" />
</svg>`
        );
    });

    it('<div><div data-loc="0,4">TAXT</div><div data-loc="5,8">TAXT</div></div>', async () => {
        // Arrange
        const htmlBody = '<div><div data-loc="0,4">TAXT</div><div data-loc="5,8">TAXT</div></div>';
        const element = await toHTMLElementWithBoundingRectanglesWithTag(htmlBody, "TAXT");

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
        assertEqual(ManhattanDistanceComparer(distance1, distance2), 1);

        // Act
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        // Assert
        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="72">
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
        const element = await toHTMLElementWithBoundingRectanglesWithTag(htmlBody, "TUXT");

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
            `<svg width="1920" height="36">
<path d="M22,0 0,0 0,18 22,18 22,0" />
<path d="M64,0 40,0 40,0 22,0 22,18 64,18 64,0" />
<path d="M64,18 1920,18 1920,0 64,0 64,18" />
</svg>`
        );
    });

    debug_it('x to the 2 with horizontal offset CODE9', async (zoom: boolean) => {
        const htmlElement = fs.readFileSync('./test/AnnotatedData/x^2 with horizontal offset.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlElement, true, zoom ? { zoom: 500 } : undefined, "x^2");

        const point = new Point(100, 12);
        assertParticularPointLocation(element, point, 0, htmlElement);

        // Act
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        // Assert
        const testableSvgPart = getTestableSvgPart(svg).replace(/\n<rect.*\/>/g, '');

        const expected = readExpectedSvg("offsetx^2", zoom);
        assertEqual(testableSvgPart, expected);
    });

    debug_it('f(x)', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined, "f(x)");
        const svg = allPointsByIndexToSVGByProximity(element as HTMLElement, getStyle);

        dumpOverlayBodyWithKatexCSS(htmlBody, svg); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="381.2" height="44.800004">
<path d="M10,0 3,0 3,23 10,23 10,0" />
<path d="M10,23 17,23 17,0 10,0 10,23" />
<path d="M17,23 24,23 24,0 17,0 17,23" />
<path d="M24,23 47,23 47,0 24,0 24,23
 M47,23 95,23 95,0 47,0 47,23
 M95,23 191,23 191,0 95,0 95,23
 M191,23 382,23 382,0 191,0 191,23" />
<path d="M3,0 0,0 0,23 3,23 3,0" />
</svg>`
                : `<svg width="1920" height="44">
<path d="M10,0 3,0 3,22 10,22 10,0" />
<path d="M17,0 10,0 10,22 17,22 17,0" />
<path d="M24,0 17,0 17,22 24,22 24,0" />
<path d="M240,0 240,0 24,0 24,22 120,22 120,22 240,22 240,22 480,22 480,0 240,0
 M480,22 960,22 960,0 480,0 480,22
 M960,22 1920,22 1920,0 960,0 960,22" />
<path d="M3,0 0,0 0,22 3,22 3,0" />
</svg>`
        );
    });
    debug_it('Annotated integral expression', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/integralExpression.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined, "integral");
        const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createLatticeWithSpacing(5));

        assertParticularPointLocation(
            element,
            new Point(117.5, 35),
            14,
            htmlBody
        );

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        const expected = readExpectedSvg("integral", zoom);
        assertEqual(testableSvgPart, expected);
    });


    debug_it('Annotated complicated expression', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/complicatedExpression.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined, "complicated");
        const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createLatticeWithSpacing(5));

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        const expected = readExpectedSvg("complicated", zoom);
        assertEqual(testableSvgPart, expected);
    });
});
