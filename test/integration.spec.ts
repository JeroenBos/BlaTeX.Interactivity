import { toHTMLElementWithBoundingRectangles, toHTMLElementWithBoundingRectanglesWithTag } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity, Configuration } from '../src/paintAllPointsByIndex';
import { assert, assertEqual, getDataLoc } from '../src/utils';
import { dumpOverlayBodyWithKatexCSS } from './utils/overlay';
import fs from 'fs';
import { debug_it, getStyle, getTestableSvgPart } from './utils/utils';
import {
    getCursorIndexByProximity,
    getDistance,
    getHtmlElementsWithDataloc,
} from '../src/PointToCursorHandleConverter';
import { ManhattanDistanceComparer } from '../src/jbsnorro/polygons/ManhattanDistanceComparer';
import Point from '../src/polyfills/Point';
import { HorizontalClosestDistanceType, MinDistances, VerticalClosestDistanceType } from '../src/jbsnorro/polygons/MinDistances';
import { initGlobalTypesFromJSDOM } from '.';

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
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="381.2" height="46.4625">
<path d="M0,24 105,24 105,0 0,0 0,24" />
<path d="M110,1 109,1 109,0 105,0 105,24 119,24 119,24 143,24 143,24 382,24 382,20 116,20 116,19 115,19 115,18 114,18 114,17 113,17 113,16 112,16 112,15 111,15 111,14 110,14 110,1" />
<path d="M110,14 111,14 111,15 112,15 112,16 113,16 113,17 114,17 114,0 109,0 109,1 110,1 110,14" />
<path d="M382,20 382,0 191,0 191,0 143,0 143,0 114,0 114,18 115,18 115,19 116,19 116,20 382,20" />
</svg>`
                : `<svg width="1920" height="46.4375">
<path d="M0,24 105,24 105,0 0,0 0,24" />
<path d="M111,15 111,14 110,14 110,1 109,1 109,0 105,0 105,24 120,24 120,24 240,24 240,24 1920,24 1920,20 116,20 116,19 115,19 115,18 114,18 114,17 113,17 113,16 112,16 112,15 111,15" />
<path d="M114,0 109,0 109,1 110,1 110,14 111,14 111,15 112,15 112,16 113,16 113,17 114,17 114,0" />
<path d="M1920,0 960,0 960,0 480,0 480,0 240,0 240,0 114,0 114,18 115,18 115,19 116,19 116,20 1920,20 1920,0" />
</svg>`
        );
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
            15,
            htmlBody
        );

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        // I just annotated the html, that's all. below is nonsense

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom ? `<svg width="381.2" height="98.125008">
<path d="M102,55 102,53 101,53 101,51 100,51 100,50 99,50 99,48 98,48 98,47 97,47 97,46 96,46 96,45 95,45 95,61 108,61 108,60 107,60 107,59 106,59 106,58 105,58 105,57 104,57 104,56 103,56 103,55 102,55" />
<path d="M108,21 107,21 107,22 106,22 106,23 105,23 105,24 104,24 104,25 103,25 103,27 102,27 102,29 101,29 101,30 100,30 100,31 100,31 99,31 99,33 98,33 98,34 97,34 97,35 96,35 96,36 95,36 95,37 94,37 94,38 93,38 93,43 94,43 94,44 95,44 95,45 96,45 96,46 97,46 97,47 98,47 98,48 99,48 99,50 100,50 100,51 101,51 101,53 102,53 102,55 103,55 103,56 104,56 104,57 105,57 105,58 106,58 106,59 107,59 107,60 108,60 108,21" />
<path d="M118,16 112,16 112,17 111,17 111,18 110,18 110,19 109,19 109,20 108,20 108,61 118,61 118,16
 M110,21 110,21 110,21" />
<path d="M118,61 380,61 380,16 120,16 120,16 118,16 118,61" />
<path d="M81,18 80,18 80,17 79,17 79,16 0,16 0,56 79,56 79,55 80,55 80,54 81,54 81,18" />
<path d="M86,25 85,25 85,23 84,23 84,21 83,21 83,20 82,20 82,19 81,19 81,53 82,53 82,52 84,52 84,51 85,51 85,50 86,50 86,49 87,49 87,48 88,48 88,47 89,47 89,46 90,46 90,45 91,45 91,44 92,44 92,43 93,43 93,37 92,37 92,35 91,35 91,33 90,33 90,31 89,31 89,29 88,29 88,28 87,28 87,27 86,27 86,25
 M85,36 85,36" />
<path d="M88,48 87,48 87,49 86,49 86,50 85,50 85,51 84,51 84,52 82,52 82,53 81,53 81,54 80,54 80,55 79,55 79,56 0,56 0,61 88,61 88,48" />
<path d="M90,61 95,61 95,44 94,44 94,43 92,43 92,44 91,44 91,45 90,45 90,46 90,46 89,46 89,47 88,47 88,61 90,61 90,61" />
<path d="M95,37 95,36 96,36 96,16 85,16 85,16 82,16 82,16 79,16 79,17 80,17 80,18 81,18 81,19 82,19 82,20 83,20 83,21 84,21 84,23 85,23 85,25 86,25 86,27 87,27 87,28 88,28 88,29 89,29 89,31 90,31 90,33 91,33 91,35 92,35 92,37 93,37 93,38 94,38 94,37 95,37" />
<path d="M97,16 96,16 96,35 97,35 97,34 98,34 98,33 99,33 99,31 100,31 100,30 101,30 101,29 102,29 102,27 103,27 103,25 104,25 104,24 105,24 105,23 106,23 106,22 107,22 107,21 108,21 108,20 109,20 109,19 110,19 110,18 111,18 111,17 112,17 112,16 100,16 100,16 97,16 97,16" />
</svg>` :
                `<svg width="1920" height="98.125">
<path d="M103,54 102,54 102,52 101,52 101,51 100,51 100,50 99,50 99,48 98,48 98,47 97,47 97,46 96,46 96,45 95,45 95,61 108,61 108,60 107,60 107,59 106,59 106,58 105,58 105,57 104,57 104,56 103,56 103,54" />
<path d="M108,21 107,21 107,22 106,22 106,23 105,23 105,24 104,24 104,25 103,25 103,27 102,27 102,29 101,29 101,30 100,30 100,31 100,32 99,32 99,33 98,33 98,34 97,34 97,35 96,35 96,36 95,36 95,37 94,37 94,38 93,38 93,43 94,43 94,44 95,44 95,45 96,45 96,46 97,46 97,47 98,47 98,48 99,48 99,50 100,50 100,51 101,51 101,52 102,52 102,54 103,54 103,56 104,56 104,57 105,57 105,58 106,58 106,59 107,59 107,60 108,60 108,21" />
<path d="M118,16 112,16 112,17 111,17 111,18 110,18 110,19 109,19 109,20 108,20 108,61 118,61 118,16
 M110,21 110,21 110,21" />
<path d="M1920,61 1920,16 120,16 120,16 118,16 118,61 1920,61" />
<path d="M81,18 80,18 80,17 79,17 79,16 0,16 0,56 79,56 79,55 80,55 80,54 81,54 81,18" />
<path d="M87,27 86,27 86,25 85,25 85,23 84,23 84,21 83,21 83,20 82,20 82,19 81,19 81,53 82,53 82,52 84,52 84,51 86,51 86,50 87,50 87,49 88,49 88,48 89,48 89,47 90,47 90,46 91,46 91,45 92,45 92,44 93,44 93,37 92,37 92,35 91,35 91,33 90,33 90,31 89,31 89,30 88,30 88,29 87,29 87,27
 M85,36 85,36 85,36" />
<path d="M88,49 87,49 87,50 86,50 86,51 84,51 84,52 82,52 82,53 81,53 81,54 80,54 80,55 79,55 79,56 0,56 0,61 88,61 88,49" />
<path d="M95,37 95,36 96,36 96,16 85,16 85,16 82,16 82,16 79,16 79,17 80,17 80,18 81,18 81,19 82,19 82,20 83,20 83,21 84,21 84,23 85,23 85,25 86,25 86,27 87,27 87,29 88,29 88,30 89,30 89,31 90,31 90,33 91,33 91,35 92,35 92,37 93,37 93,38 94,38 94,37 95,37" />
<path d="M95,44 94,44 94,43 93,43 93,44 92,44 92,45 91,45 91,46 90,46 90,47 89,47 89,48 88,48 88,61 90,61 90,61 95,61 95,44" />
<path d="M97,16 96,16 96,35 97,35 97,34 98,34 98,33 99,33 99,32 100,32 100,30 101,30 101,29 102,29 102,27 103,27 103,25 104,25 104,24 105,24 105,23 106,23 106,22 107,22 107,21 108,21 108,20 109,20 109,19 110,19 110,18 111,18 111,17 112,17 112,16 100,16 100,16 97,16 97,16" />
</svg>`
        );
    });


    debug_it('Annotated complicated expression', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/complicatedExpression.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined, "complicated");
        const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createLatticeWithSpacing(5));

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        // I just annotated the html, that's all. below is nonsense

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom ? `<svg width="381.2" height="92.32917">
<path d="M109,9 108,9 108,10 107,10 107,27 105,27 105,10 100,10 100,12 101,12 101,24 102,24 102,25 103,25 103,26 104,26 104,27 100,27 100,30 100,45 109,45 109,9" />
<path d="M112,6 111,6 111,7 110,7 110,8 109,8 109,45 110,45 110,45 112,45 112,6" />
<path d="M116,0 112,0 112,45 116,45 116,0" />
<path d="M116,45 117,45 117,45 120,45 120,45 130,45 130,32 129,32 129,31 128,31 128,30 127,30 127,29 126,29 126,28 125,28 125,27 124,27 124,26 123,26 123,25 122,25 122,24 121,24 121,11 120,11 120,10 119,10 119,9 118,9 118,0 116,0 116,45" />
<path d="M12,0 5,0 5,0 4,0 4,45 12,45 12,0" />
<path d="M124,0 120,0 120,0 118,0 118,9 119,9 119,10 120,10 120,11 121,11 121,24 122,24 122,25 123,25 123,26 124,26 124,0" />
<path d="M127,0 124,0 124,27 125,27 125,28 126,28 126,29 127,29 127,0" />
<path d="M133,0 127,0 127,30 128,30 128,31 129,31 129,32 130,32 130,45 133,45 133,0" />
<path d="M138,0 135,0 135,0 133,0 133,45 135,45 135,45 138,45 138,0" />
<path d="M141,0 138,0 138,45 141,45 141,0" />
<path d="M144,0 141,0 141,45 144,45 144,0" />
<path d="M144,45 146,45 146,32 147,32 147,31 148,31 148,0 145,0 145,0 144,0 144,45" />
<path d="M150,30 150,45 160,45 160,0 155,0 155,9 154,9 154,23 153,23 153,25 152,25 152,27 151,27 151,28 150,28 150,29 149,29 149,30 148,30 148,31 147,31 147,32 146,32 146,45 147,45 147,45 150,45 150,30 152,30 152,30 150,30" />
<path d="M152,25 153,25 153,23 154,23 154,9 155,9 155,0 150,0 150,0 148,0 148,30 149,30 149,29 150,29 150,28 151,28 151,27 152,27 152,25" />
<path d="M170,0 160,0 160,45 170,45 170,0" />
<path d="M170,45 380,45 380,0 170,0 170,45" />
<path d="M20,0 12,0 12,45 20,45 20,0" />
<path d="M28,0 20,0 20,45 28,45 28,0" />
<path d="M34,0 28,0 28,45 30,45 30,45 34,45 34,0" />
<path d="M4,0 0,0 0,45 4,45 4,0" />
<path d="M42,0 35,0 35,0 34,0 34,45 42,45 42,0" />
<path d="M45,0 42,0 42,45 46,45 46,44 47,44 47,43 48,43 48,42 49,42 49,40 50,40 50,38 51,38 51,0 45,0 45,0" />
<path d="M54,37 54,36 55,36 55,35 56,35 56,0 52,0 52,0 51,0 51,37 54,37" />
<path d="M62,30 61,30 61,31 60,31 60,32 59,32 59,33 57,33 57,34 56,34 56,35 55,35 55,36 54,36 54,37 51,37 51,38 50,38 50,40 52,40 52,40 49,40 49,42 48,42 48,43 47,43 47,44 46,44 46,45 62,45 62,30" />
<path d="M67,24 68,24 68,23 69,23 69,22 70,22 70,20 69,20 69,19 68,19 68,18 67,18 67,16 66,16 66,14 65,14 65,12 64,12 64,11 63,11 63,10 62,10 62,8 61,8 61,6 60,6 60,4 59,4 59,2 58,2 58,1 57,1 57,0 56,0 56,34 57,34 57,33 59,33 59,32 60,32 60,31 61,31 61,30 62,30 62,29 63,29 63,28 64,28 64,27 65,27 65,26 66,26 66,25 67,25 67,24" />
<path d="M69,23 68,23 68,24 67,24 67,25 67,25 66,25 66,26 65,26 65,30 65,27 64,27 64,28 63,28 63,29 62,29 62,30 62,45 65,45 65,45 71,45 71,23 70,23 70,22 69,22 69,23" />
<path d="M71,45 72,45 72,30 72,45 75,45 75,40 75,45 89,45 89,44 87,44 87,43 86,43 86,42 85,42 85,41 84,41 84,40 83,40 83,39 82,39 82,38 81,38 81,36 80,36 80,34 79,34 79,33 78,33 78,31 77,31 77,29 76,29 76,28 75,28 75,27 74,27 74,26 73,26 73,25 72,25 72,24 71,24 71,45" />
<path d="M72,0 60,0 60,0 57,0 57,1 58,1 58,2 59,2 59,4 60,4 60,6 61,6 61,8 62,8 62,10 63,10 63,11 64,11 64,12 65,12 65,14 66,14 66,16 67,16 67,18 68,18 68,19 69,19 69,20 71,20 71,19 72,19 72,0" />
<path d="M77,12 78,12 78,10 79,10 79,9 80,9 80,8 81,8 81,6 82,6 82,5 83,5 83,4 84,4 84,3 85,3 85,2 86,2 86,1 87,1 87,0 75,0 75,0 72,0 72,18 73,18 73,17 74,17 74,16 75,16 75,15 76,15 76,14 77,14 77,12" />
<path d="M80,36 81,36 81,38 82,38 82,39 83,39 83,40 84,40 84,4 83,4 83,5 82,5 82,6 81,6 81,8 80,8 80,9 79,9 79,10 78,10 78,12 77,12 77,14 76,14 76,15 75,15 75,16 74,16 74,17 73,17 73,18 72,18 72,19 71,19 71,20 70,20 70,23 71,23 71,24 72,24 72,25 73,25 73,26 74,26 74,27 75,27 75,28 76,28 76,29 77,29 77,31 78,31 78,33 79,33 79,34 80,34 80,36
 M75,20 75,20
 M80,10 80,10" />
<path d="M93,0 87,0 87,1 86,1 86,2 85,2 85,3 84,3 84,41 85,41 85,42 86,42 86,43 87,43 87,44 89,44 89,45 93,45 93,0
 M85,5 85,5 85,5" />
<path d="M93,45 95,45 95,33 96,33 96,25 98,25 98,27 103,27 103,25 102,25 102,24 101,24 101,12 100,12 100,11 99,11 99,10 103,10 103,0 95,0 95,0 93,0 93,45
 M96,10 95,10 95,8 97,8 97,9 98,9 98,15 96,15 96,10" />
<path d="M98,9 97,9 97,8 95,8 95,10 96,10 96,15 98,15 98,9
 M107,10 108,10 108,9 109,9 109,8 110,8 110,7 111,7 111,6 112,6 112,0 105,0 105,0 103,0 103,10 105,10 105,27 107,27 107,10
 M99,11 100,11 100,10 99,10 99,11
 M98,25 96,25 96,33 95,33 95,35 95,45 100,45 100,27 98,27 98,25
 M103,27 104,27 104,26 103,26 103,27" />
</svg>` :
                `<svg width="1920" height="92.3125">
<path d="M109,10 108,10 108,11 106,11 106,12 107,12 107,27 105,27 105,10 100,10 100,12 101,12 101,24 102,24 102,25 103,25 103,26 104,26 104,27 100,27 100,30 100,45 109,45 109,10" />
<path d="M112,7 111,7 111,8 110,8 110,9 109,9 109,45 110,45 110,45 112,45 112,7" />
<path d="M116,0 112,0 112,45 116,45 116,0" />
<path d="M116,45 117,45 117,45 120,45 120,45 130,45 130,32 129,32 129,31 128,31 128,30 127,30 127,29 126,29 126,28 125,28 125,27 124,27 124,26 123,26 123,25 122,25 122,24 121,24 121,11 120,11 120,10 119,10 119,9 118,9 118,0 116,0 116,45" />
<path d="M12,0 5,0 5,0 4,0 4,45 12,45 12,0" />
<path d="M124,0 120,0 120,0 118,0 118,9 119,9 119,10 120,10 120,11 121,11 121,24 122,24 122,25 123,25 123,26 124,26 124,0" />
<path d="M127,0 124,0 124,27 125,27 125,28 126,28 126,29 127,29 127,0" />
<path d="M133,0 127,0 127,30 128,30 128,31 129,31 129,32 130,32 130,45 133,45 133,0" />
<path d="M138,0 135,0 135,0 133,0 133,45 135,45 135,45 138,45 138,0" />
<path d="M141,0 138,0 138,45 141,45 141,0" />
<path d="M144,0 141,0 141,45 144,45 144,0" />
<path d="M144,45 145,45 145,45 147,45 147,31 148,31 148,0 145,0 145,0 144,0 144,45" />
<path d="M152,25 153,25 153,23 154,23 154,9 155,9 155,0 150,0 150,0 148,0 148,30 149,30 149,29 150,29 150,28 151,28 151,27 152,27 152,25" />
<path d="M160,0 155,0 155,9 154,9 154,23 153,23 153,25 152,25 152,27 151,27 151,28 150,28 150,29 149,29 149,30 148,30 148,31 147,31 147,45 150,45 150,30 150,45 160,45 160,0" />
<path d="M170,0 160,0 160,45 170,45 170,0" />
<path d="M170,0 170,45 1920,45 1920,0 170,0" />
<path d="M20,0 12,0 12,45 20,45 20,0" />
<path d="M28,0 20,0 20,45 28,45 28,0" />
<path d="M34,0 28,0 28,45 30,45 30,45 34,45 34,0" />
<path d="M4,0 0,0 0,45 4,45 4,0" />
<path d="M42,0 35,0 35,0 34,0 34,45 42,45 42,0" />
<path d="M45,0 42,0 42,45 46,45 46,44 47,44 47,43 48,43 48,41 49,41 49,39 50,39 50,37 51,37 51,0 45,0 45,0" />
<path d="M54,37 54,36 55,36 55,35 56,35 56,0 52,0 52,0 51,0 51,37 54,37" />
<path d="M62,31 61,31 61,32 59,32 59,33 57,33 57,34 56,34 56,35 55,35 55,36 54,36 54,37 50,37 50,39 49,39 49,41 48,41 48,43 47,43 47,44 46,44 46,45 62,45 62,31
 M50,40 50,40 50,40" />
<path d="M66,17 67,17 67,18 68,18 68,19 69,19 69,20 71,20 71,19 72,19 72,0 60,0 60,0 57,0 57,1 58,1 58,2 59,2 59,4 60,4 60,6 61,6 61,8 62,8 62,10 63,10 63,11 64,11 64,13 65,13 65,15 66,15 66,17" />
<path d="M69,24 69,23 70,23 70,20 69,20 69,19 68,19 68,18 67,18 67,17 66,17 66,15 65,15 65,13 64,13 64,11 63,11 63,10 62,10 62,8 61,8 61,6 60,6 60,4 59,4 59,2 58,2 58,1 57,1 57,0 56,0 56,34 57,34 57,33 59,33 59,32 61,32 61,31 62,31 62,30 63,30 63,29 64,29 64,28 65,28 65,27 66,27 66,26 67,26 67,25 68,25 68,24 69,24" />
<path d="M71,23 69,23 69,24 68,24 68,25 67,25 67,26 66,26 66,27 65,27 65,28 64,28 64,29 63,29 63,30 62,30 62,45 65,45 65,30 65,45 71,45 71,23" />
<path d="M71,45 72,45 72,30 72,45 75,45 75,40 75,45 89,45 89,43 87,43 87,42 86,42 86,41 85,41 85,40 84,40 84,39 83,39 83,38 82,38 82,37 81,37 81,36 80,36 80,34 79,34 79,33 78,33 78,32 77,32 77,30 76,30 76,28 75,28 75,27 74,27 74,26 73,26 73,25 72,25 72,24 71,24 71,45" />
<path d="M75,15 75,16 74,16 74,17 73,17 73,18 72,18 72,19 71,19 71,20 70,20 70,23 71,23 71,24 72,24 72,25 73,25 73,26 74,26 74,27 75,27 75,28 76,28 76,30 77,30 77,32 78,32 78,33 79,33 79,34 80,34 80,36 81,36 81,37 82,37 82,38 83,38 83,39 84,39 84,4 83,4 83,5 82,5 82,6 81,6 81,8 80,8 80,10 80,10 79,10 79,11 78,11 78,12 77,12 77,14 76,14 76,15 75,15
 M75,20 75,20" />
<path d="M78,12 78,11 79,11 79,10 80,10 80,8 81,8 81,6 82,6 82,5 83,5 83,4 84,4 84,3 85,3 85,2 86,2 86,1 87,1 87,0 75,0 75,0 72,0 72,18 73,18 73,17 74,17 74,16 75,16 75,15 76,15 76,14 77,14 77,12 78,12" />
<path d="M93,0 87,0 87,1 86,1 86,2 85,2 85,3 84,3 84,40 85,40 85,41 86,41 86,42 87,42 87,43 89,43 89,45 93,45 93,0
 M85,5 85,5" />
<path d="M93,45 95,45 95,32 96,32 96,25 98,25 98,27 103,27 103,25 102,25 102,24 101,24 101,12 100,12 100,11 99,11 99,10 103,10 103,0 95,0 95,0 93,0 93,45
 M96,10 95,10 95,8 97,8 97,9 98,9 98,15 96,15 96,10" />
<path d="M95,8 95,10 96,10 96,15 98,15 98,9 97,9 97,8 95,8
 M107,12 106,12 106,11 108,11 108,10 109,10 109,9 110,9 110,8 111,8 111,7 112,7 112,0 105,0 105,0 103,0 103,10 105,10 105,27 107,27 107,12
 M100,10 99,10 99,11 100,11 100,10
 M95,45 100,45 100,27 98,27 98,25 96,25 96,32 95,32 95,45
 M103,27 104,27 104,26 103,26 103,27" />
</svg>`
        );
    });
});
