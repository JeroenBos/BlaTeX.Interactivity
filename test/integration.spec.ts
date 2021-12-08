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
} from '../src/PointToCursorHandleConverter';
import { ManhattanDistanceComparer } from '../src/jbsnorro/polygons/ManhattanDistanceComparer';
import Point from '../src/polyfills/Point';
import { HorizontalClosestDistanceType, MinDistances, VerticalClosestDistanceType } from '../src/jbsnorro/polygons/MinDistances';
import { initGlobalTypesFromJSDOM } from '.';

describe('Color HTML based on source locations', () => {
    beforeEach(initGlobalTypesFromJSDOM);

    it('<div>TEXT</div>', async () => {
        const htmlBody = '<div>TEXT</div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
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
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
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
            `<svg width="1920" height="36">
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
                ? `<svg width="381.2" height="46.4625">
<path d="M106,0 0,0 0,24 106,24 106,0" />
<path d="M106,24 119,24 119,24 143,24 143,21 117,21 117,20 116,20 116,19 115,19 115,18 114,18 114,17 113,17 113,16 112,16 112,15 111,15 111,1 110,1 110,0 106,0 106,24
 M143,24 382,24 382,21 143,21 143,24" />
<path d="M111,15 112,15 112,16 113,16 113,17 114,17 114,0 110,0 110,1 111,1 111,15" />
<path d="M382,21 382,0 191,0 191,0 143,0 143,0 114,0 114,18 115,18 115,19 116,19 116,20 117,20 117,21 382,21" />
</svg>`
                : `<svg width="1920" height="46.4375">
<path d="M0,24 106,24 106,0 0,0 0,24" />
<path d="M112,14 112,15 113,15 113,16 114,16 114,0 111,0 111,14 112,14" />
<path d="M113,16 113,15 112,15 112,14 111,14 111,0 106,0 106,24 120,24 120,24 240,24 240,24 1920,24 1920,20 117,20 117,19 116,19 116,18 115,18 115,17 114,17 114,16 113,16" />
<path d="M1920,0 960,0 960,0 480,0 480,0 240,0 240,0 114,0 114,17 115,17 115,18 116,18 116,19 117,19 117,20 1920,20 1920,0" />
</svg>`
        );
    });

    debug_it('f(x)', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
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
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createLatticeWithSpacing(5));

        assertParticularPointLocation(
            element,
            new Point(117.5, 35),
            14,
            htmlBody
        );

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        // I just annotated the html, that's all. below is nonsense

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom ? `<svg width="381.2" height="98.125008">
<path d="M0,16 0,61 79,61 79,16 0,16" />
<path d="M100,34 101,34 101,32 102,32 102,30 103,30 103,28 104,28 104,26 105,26 105,24 106,24 106,23 107,23 107,22 108,22 108,21 109,21 109,20 110,20 110,19 111,19 111,18 112,18 112,17 113,17 113,16 100,16 100,16 97,16 97,38 98,38 98,37 99,37 99,36 100,36 100,34" />
<path d="M100,51 100,51
 M106,55 105,55 105,53 104,53 104,51 103,51 103,49 102,49 102,48 101,48 101,47 100,47 100,46 99,46 99,61 110,61 110,60 109,60 109,59 108,59 108,58 107,58 107,57 106,57 106,55" />
<path d="M122,16 115,16 115,16 113,16 113,17 112,17 112,61 115,61 115,61 122,61 122,16" />
<path d="M125,16 122,16 122,61 125,61 125,61 380,61 380,16 125,16 125,16" />
<path d="M85,51 85,61 90,61 90,47 89,47 89,48 88,48 88,49 87,49 87,50 86,50 86,51 85,51" />
<path d="M87,18 87,16 80,16 80,16 79,16 79,61 85,61 85,51 86,51 86,50 87,50 87,49 88,49 88,48 89,48 89,47 90,47 90,46 91,46 91,45 92,45 92,44 93,44 93,43 94,43 94,42 95,42 95,39 94,39 94,38 93,38 93,36 92,36 92,34 91,34 91,32 90,32 90,30 89,30 89,20 88,20 88,18 87,18" />
<path d="M89,30 90,30 90,32 91,32 91,34 92,34 92,36 93,36 93,38 94,38 94,39 95,39 95,40 96,40 96,39 97,39 97,16 90,16 90,16 87,16 87,18 88,18 88,20 89,20 89,30" />
<path d="M97,44 97,43 96,43 96,42 94,42 94,43 93,43 93,44 92,44 92,45 91,45 91,46 90,46 90,61 99,61 99,45 98,45 98,44 97,44" />
<path d="M97,44 98,44 98,45 99,45 99,46 100,46 100,47 101,47 101,48 102,48 102,49 103,49 103,51 104,51 104,53 105,53 105,55 106,55 106,57 107,57 107,58 108,58 108,59 109,59 109,60 110,60 110,61 112,61 112,18 111,18 111,19 110,19 110,20 109,20 109,21 108,21 108,22 107,22 107,23 106,23 106,24 105,24 105,26 107,26 107,26 105,26 105,26 104,26 104,28 103,28 103,30 102,30 102,31 102,32 101,32 101,34 100,34 100,36 102,36 102,36 99,36 99,37 98,37 98,38 97,38 97,39 96,39 96,40 95,40 95,42 96,42 96,43 97,43 97,44" />
</svg>` :
                `<svg width="1920" height="98.125">
<path d="M0,16 0,61 79,61 79,16 0,16" />
<path d="M100,34 101,34 101,32 102,32 102,30 103,30 103,29 104,29 104,27 105,27 105,25 106,25 106,23 107,23 107,22 108,22 108,21 109,21 109,20 110,20 110,19 111,19 111,18 112,18 112,17 113,17 113,16 100,16 100,16 97,16 97,38 98,38 98,37 99,37 99,36 100,36 100,34" />
<path d="M100,51 100,51
 M108,58 108,57 107,57 107,56 106,56 106,55 105,55 105,53 104,53 104,51 103,51 103,49 102,49 102,48 101,48 101,47 100,47 100,46 99,46 99,61 111,61 111,60 110,60 110,59 109,59 109,58 108,58" />
<path d="M122,16 115,16 115,16 113,16 113,17 112,17 112,61 115,61 115,61 122,61 122,16" />
<path d="M1920,61 1920,16 125,16 125,16 122,16 122,61 125,61 125,61 1920,61" />
<path d="M79,61 85,61 85,52 86,52 86,51 87,51 87,50 88,50 88,49 89,49 89,48 90,48 90,47 91,47 91,46 92,46 92,45 93,45 93,44 94,44 94,43 95,43 95,39 94,39 94,38 93,38 93,36 92,36 92,34 91,34 91,32 90,32 90,30 89,30 89,20 88,20 88,18 87,18 87,16 80,16 80,16 79,16 79,61" />
<path d="M85,52 85,61 90,61 90,48 89,48 89,49 88,49 88,50 87,50 87,51 86,51 86,52 85,52" />
<path d="M89,30 90,30 90,32 91,32 91,34 92,34 92,36 93,36 93,38 94,38 94,39 95,39 95,40 96,40 96,39 97,39 97,16 90,16 90,16 87,16 87,18 88,18 88,20 89,20 89,30" />
<path d="M98,44 98,45 99,45 99,46 100,46 100,47 101,47 101,48 102,48 102,49 103,49 103,51 104,51 104,53 105,53 105,55 106,55 106,56 107,56 107,57 108,57 108,58 109,58 109,59 110,59 110,60 111,60 111,61 112,61 112,18 111,18 111,19 110,19 110,20 109,20 109,21 108,21 108,22 107,22 107,23 106,23 106,25 105,25 105,26 107,26 107,26 105,26 105,27 104,27 104,29 103,29 103,30 102,30 102,31 102,32 101,32 101,34 100,34 100,36 102,36 102,36 99,36 99,37 98,37 98,38 97,38 97,39 96,39 96,40 95,40 95,42 96,42 96,43 97,43 97,44 98,44" />
<path d="M99,45 98,45 98,44 97,44 97,43 96,43 96,42 95,42 95,43 94,43 94,44 93,44 93,45 92,45 92,46 92,46 91,46 91,47 90,47 90,51 90,61 99,61 99,45" />
</svg>`
        );
    });


    debug_it('Annotated complicated expression', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/complicatedExpression.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createLatticeWithSpacing(5), undefined, "fill:green; stroke-width: 0.1px; opacity: 30%");

        dumpOverlayBodyWithKatexCSS(htmlBody, svg, { src: "./utils/overlay_interaction.js" }); // debug purposes only

        // I just annotated the html, that's all. below is nonsense

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom ? `<svg width="381.2" height="92.32917">
<path d="M102,41 103,41 103,42 104,42 104,43 106,43 106,45 107,45 107,45 110,45 110,0 102,0 102,41" />
<path d="M114,8 115,8 115,9 116,9 116,28 121,28 121,26 120,26 120,13 119,13 119,12 118,12 118,11 117,11 117,10 121,10 121,0 110,0 110,45 114,45 114,8" />
<path d="M12,0 5,0 5,0 3,0 3,45 12,45 12,0" />
<path d="M127,10 124,10 124,11 126,11 126,28 123,28 123,10 120,10 120,10 119,10 119,13 120,13 120,26 121,26 121,27 122,27 122,28 120,28 120,28 119,28 119,45 127,45 127,10" />
<path d="M128,9 128,8 129,8 129,7 130,7 130,6 131,6 131,0 125,0 125,0 122,0 122,0 121,0 121,10 123,10 123,28 126,28 126,11 124,11 124,10 127,10 127,9 128,9
 M116,9 115,9 115,8 114,8 114,45 119,45 119,28 116,28 116,9
 M115,30 115,30
 M117,10 117,11 118,11 118,12 119,12 119,10 117,10
 M121,27 121,28 122,28 122,27 121,27" />
<path d="M131,6 130,6 130,7 129,7 129,8 128,8 128,9 127,9 127,10 127,45 131,45 131,6" />
<path d="M136,0 132,0 132,0 131,0 131,45 132,45 132,45 136,45 136,0" />
<path d="M140,10 139,10 139,9 138,9 138,8 137,8 137,0 136,0 136,45 137,45 137,45 140,45 140,45 149,45 149,32 148,32 148,31 147,31 147,30 146,30 146,29 145,29 145,28 144,28 144,27 143,27 143,26 142,26 142,25 141,25 141,24 140,24 140,10" />
<path d="M143,0 137,0 137,8 138,8 138,9 139,9 139,10 140,10 140,24 141,24 141,25 142,25 142,26 143,26 143,0" />
<path d="M147,0 143,0 143,27 144,27 144,28 145,28 145,29 146,29 146,30 147,30 147,0" />
<path d="M152,0 147,0 147,31 148,31 148,32 149,32 149,45 150,45 150,45 152,45 152,0" />
<path d="M157,0 152,0 152,45 157,45 157,0" />
<path d="M160,45 160,0 157,0 157,45 160,45" />
<path d="M164,0 160,0 160,45 164,45 164,0" />
<path d="M166,32 167,32 167,0 164,0 164,45 166,45 166,32" />
<path d="M169,29 170,29 170,28 171,28 171,27 172,27 172,25 173,25 173,10 174,10 174,0 167,0 167,31 168,31 168,30 169,30 169,29" />
<path d="M181,0 175,0 175,0 174,0 174,10 173,10 173,25 172,25 172,30 170,30 170,30 172,30 172,27 171,27 171,28 170,28 170,29 169,29 169,30 168,30 168,31 167,31 167,32 166,32 166,45 167,45 167,45 170,45 170,45 181,45 181,0" />
<path d="M182,45 190,45 190,0 182,0 182,0 181,0 181,45 182,45 182,45" />
<path d="M21,0 15,0 15,0 12,0 12,45 15,45 15,45 21,45 21,0" />
<path d="M3,0 0,0 0,45 3,45 3,0" />
<path d="M30,0 22,0 22,0 21,0 21,45 30,45 30,0" />
<path d="M36,0 30,0 30,45 36,45 36,0" />
<path d="M380,45 380,0 190,0 190,45 380,45" />
<path d="M47,0 40,0 40,0 37,0 37,0 36,0 36,45 40,45 40,45 47,45 47,0" />
<path d="M48,45 48,44 49,44 49,43 50,43 50,42 51,42 51,41 52,41 52,40 53,40 53,39 54,39 54,38 55,38 55,36 56,36 56,34 57,34 57,10 56,10 56,8 55,8 55,6 54,6 54,4 53,4 53,3 52,3 52,2 51,2 51,0 47,0 47,45 48,45" />
<path d="M54,6 55,6 55,8 56,8 56,10 57,10 57,34 56,34 56,36 55,36 55,38 54,38 54,39 53,39 53,40 52,40 52,41 51,41 51,42 50,42 50,43 49,43 49,44 48,44 48,45 55,45 55,40 55,45 65,45 65,0 55,0 55,0 52,0 52,0 51,0 51,2 52,2 52,3 53,3 53,4 54,4 54,6" />
<path d="M76,28 75,28 75,29 74,29 74,30 73,30 73,31 72,31 72,32 71,32 71,33 70,33 70,35 72,35 72,35 70,35 70,45 76,45 76,28" />
<path d="M80,19 79,19 79,18 78,18 78,16 77,16 77,14 76,14 76,12 75,12 75,1 74,1 74,0 65,0 65,45 70,45 70,33 71,33 71,32 72,32 72,31 73,31 73,30 74,30 74,29 75,29 75,28 76,28 76,27 77,27 77,26 78,26 78,25 79,25 79,24 80,24 80,23 81,23 81,22 82,22 82,21 81,21 81,20 80,20 80,19" />
<path d="M81,21 82,21 82,22 86,22 86,0 74,0 74,1 75,1 75,12 76,12 76,14 77,14 77,16 78,16 78,18 79,18 79,19 80,19 80,20 81,20 81,21" />
<path d="M87,0 86,0 86,22 87,22 87,21 88,21 88,20 89,20 89,19 90,19 90,18 91,18 91,17 92,17 92,16 93,16 93,14 94,14 94,12 95,12 95,10 96,10 96,9 97,9 97,7 98,7 98,5 99,5 99,3 100,3 100,2 101,2 101,1 102,1 102,0 90,0 90,0 87,0 87,0" />
<path d="M88,22 81,22 81,23 80,23 80,24 79,24 79,25 78,25 78,26 77,26 77,27 76,27 76,45 77,45 77,45 80,45 80,25 82,25 82,25 80,25 80,45 88,45 88,22" />
<path d="M92,20 90,20 90,20 92,20 92,17 91,17 91,18 90,18 90,19 89,19 89,20 88,20 88,21 87,21 87,22 88,22 88,23 89,23 89,24 90,24 90,25 91,25 91,26 92,26 92,27 93,27 93,28 94,28 94,29 95,29 95,31 96,31 96,33 97,33 97,35 98,35 98,37 99,37 99,38 100,38 100,39 101,39 101,40 102,40 102,1 101,1 101,2 100,2 100,3 99,3 99,5 98,5 98,7 97,7 97,9 96,9 96,10 95,10 95,12 94,12 94,14 93,14 93,16 92,16 92,20" />
<path d="M93,27 92,27 92,26 91,26 91,25 90,25 90,24 89,24 89,23 88,23 88,45 106,45 106,43 104,43 104,42 103,42 103,41 102,41 102,40 101,40 101,39 100,39 100,38 99,38 99,37 98,37 98,35 97,35 97,33 96,33 96,31 95,31 95,29 94,29 94,28 93,28 93,27
 M90,35 90,35" />
</svg>` :
                `<svg width="1920" height="92.3125">
<path d="M110,0 105,0 105,0 103,0 103,1 102,1 102,41 103,41 103,42 104,42 104,43 106,43 106,45 107,45 107,45 110,45 110,0" />
<path d="M115,9 115,10 116,10 116,28 121,28 121,25 120,25 120,14 119,14 119,13 118,13 118,12 117,12 117,11 121,11 121,0 110,0 110,45 113,45 113,34 114,34 114,9 115,9" />
<path d="M12,0 5,0 5,0 3,0 3,45 12,45 12,0" />
<path d="M121,11 123,11 123,27 122,27 122,26 121,26 121,28 126,28 126,10 127,10 127,9 128,9 128,8 129,8 129,7 130,7 130,6 131,6 131,0 125,0 125,0 122,0 122,0 121,0 121,11
 M115,30 115,30
 M116,28 116,10 115,10 115,9 114,9 114,34 113,34 113,45 115,45 115,45 119,45 119,28 116,28
 M119,11 117,11 117,12 118,12 118,13 119,13 119,11" />
<path d="M123,11 119,11 119,14 120,14 120,25 121,25 121,26 122,26 122,27 123,27 123,11
 M127,45 127,10 126,10 126,28 119,28 119,45 127,45" />
<path d="M131,6 130,6 130,7 129,7 129,8 128,8 128,9 127,9 127,10 127,45 131,45 131,6" />
<path d="M136,0 132,0 132,0 131,0 131,45 132,45 132,45 136,45 136,0" />
<path d="M140,10 139,10 139,9 138,9 138,8 137,8 137,0 136,0 136,45 137,45 137,45 140,45 140,45 149,45 149,33 148,33 148,32 147,32 147,31 146,31 146,30 145,30 145,29 144,29 144,28 143,28 143,27 142,27 142,26 141,26 141,25 140,25 140,10" />
<path d="M143,0 137,0 137,8 138,8 138,9 139,9 139,10 140,10 140,25 141,25 141,26 142,26 142,27 143,27 143,0" />
<path d="M147,0 143,0 143,28 144,28 144,29 145,29 145,30 146,30 146,31 147,31 147,0" />
<path d="M152,0 147,0 147,32 148,32 148,33 149,33 149,45 150,45 150,45 152,45 152,0" />
<path d="M157,0 152,0 152,45 157,45 157,0" />
<path d="M160,45 160,0 157,0 157,45 160,45" />
<path d="M164,0 160,0 160,45 164,45 164,0" />
<path d="M164,45 166,45 166,33 167,33 167,32 168,32 168,0 165,0 165,0 164,0 164,45" />
<path d="M168,31 169,31 169,30 170,30 170,29 171,29 171,27 172,27 172,25 173,25 173,10 174,10 174,8 175,8 175,0 168,0 168,31" />
<path d="M181,0 175,0 175,8 174,8 174,10 173,10 173,25 172,25 172,27 171,27 171,29 170,29 170,30 169,30 169,31 168,31 168,32 167,32 167,33 166,33 166,45 167,45 167,45 170,45 170,30 172,30 172,30 170,30 170,45 181,45 181,0" />
<path d="M182,45 190,45 190,0 182,0 182,0 181,0 181,45 182,45 182,45" />
<path d="M190,0 190,45 1920,45 1920,0 190,0" />
<path d="M21,0 15,0 15,0 12,0 12,45 15,45 15,45 21,45 21,0" />
<path d="M3,0 0,0 0,45 3,45 3,0" />
<path d="M30,0 22,0 22,0 21,0 21,45 30,45 30,0" />
<path d="M37,0 30,0 30,45 37,45 37,0" />
<path d="M47,0 40,0 40,0 37,0 37,45 40,45 40,45 47,45 47,0" />
<path d="M47,45 48,45 48,44 49,44 49,43 50,43 50,42 51,42 51,41 52,41 52,40 53,40 53,39 54,39 54,38 55,38 55,36 56,36 56,34 57,34 57,10 56,10 56,8 55,8 55,6 54,6 54,5 53,5 53,4 52,4 52,3 51,3 51,0 47,0 47,45" />
<path d="M54,5 54,6 55,6 55,8 56,8 56,10 57,10 57,34 56,34 56,36 55,36 55,38 54,38 54,39 53,39 53,40 52,40 52,41 51,41 51,42 50,42 50,43 49,43 49,44 48,44 48,45 55,45 55,40 55,45 65,45 65,0 55,0 55,0 52,0 52,0 51,0 51,3 52,3 52,4 53,4 53,5 54,5" />
<path d="M76,28 75,28 75,29 74,29 74,30 73,30 73,31 72,31 72,32 71,32 71,33 70,33 70,35 72,35 72,35 70,35 70,45 76,45 76,28" />
<path d="M80,19 79,19 79,18 78,18 78,16 77,16 77,14 76,14 76,12 75,12 75,1 74,1 74,0 65,0 65,45 70,45 70,33 71,33 71,32 72,32 72,31 73,31 73,30 74,30 74,29 75,29 75,28 76,28 76,27 77,27 77,26 78,26 78,25 79,25 79,24 80,24 80,23 81,23 81,22 82,22 82,21 81,21 81,20 80,20 80,19" />
<path d="M81,21 82,21 82,22 86,22 86,0 74,0 74,1 75,1 75,12 76,12 76,14 77,14 77,16 78,16 78,18 79,18 79,19 80,19 80,20 81,20 81,21" />
<path d="M87,0 86,0 86,22 88,22 88,21 89,21 89,20 90,20 90,19 91,19 91,18 92,18 92,17 93,17 93,15 94,15 94,13 95,13 95,11 96,11 96,9 97,9 97,7 98,7 98,5 99,5 99,4 100,4 100,3 101,3 101,2 102,2 102,1 103,1 103,0 87,0 87,0" />
<path d="M88,22 81,22 81,23 80,23 80,24 79,24 79,25 78,25 78,26 77,26 77,27 76,27 76,45 77,45 77,45 80,45 80,25 82,25 82,25 80,25 80,45 88,45 88,22" />
<path d="M93,27 92,27 92,26 91,26 91,25 90,25 90,24 89,24 89,23 88,23 88,45 106,45 106,43 104,43 104,42 103,42 103,41 102,41 102,40 101,40 101,39 100,39 100,38 99,38 99,37 98,37 98,35 97,35 97,33 96,33 96,31 95,31 95,29 94,29 94,28 93,28 93,27
 M90,35 90,35" />
<path d="M95,15 95,15
 M99,4 99,5 98,5 98,7 97,7 97,9 96,9 96,11 95,11 95,13 94,13 94,15 93,15 93,17 92,17 92,18 91,18 91,19 90,19 90,20 90,20 89,20 89,21 88,21 88,23 89,23 89,24 90,24 90,25 91,25 91,26 92,26 92,27 93,27 93,28 94,28 94,29 95,29 95,31 96,31 96,33 97,33 97,35 98,35 98,37 99,37 99,38 100,38 100,39 101,39 101,40 102,40 102,2 101,2 101,3 100,3 100,4 99,4" />
</svg>`
        );
    });
});
