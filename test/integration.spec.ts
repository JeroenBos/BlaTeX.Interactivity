import { toHTMLElementWithBoundingRectangles } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';
import { assertEqual } from '../src/utils';
import { overlayBodyWithKatexCSS } from './utils/overlay';
import fs from 'fs';
import { debugGetBoundingRects, debug_it, getStyle, getTestableSvgPart } from './utils/utils';

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

    it('<div><div data-loc="0,1">TAXT</div><div data-loc="1,2">TAXT</div></div>', async () => {
        const htmlBody = '<div><div data-loc="0,1">TAXT</div><div data-loc="1,2">TAXT</div></div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="36">
<path d="M1920,0 960,0 960,36 1920,36 1920,0" />
<path d="M960,36 960,0 0,0 0,36 960,36" />
</svg>`
        );
    });

    it('<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>', async () => {
        const htmlBody = '<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>';
        const element = await toHTMLElementWithBoundingRectangles(htmlBody);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);
        overlayBodyWithKatexCSS(htmlBody, svg); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M0,18 22,18 22,0 0,0 0,18" />
<path d="M64,0 22,0 22,18 64,18 64,0" />
<path d="M960,0 960,0 480,0 480,0 240,0 240,0 64,0 64,18 120,18 120,18 240,18 240,18 480,18 480,18 960,18 960,18 1920,18 1920,0 960,0" />
</svg>`
        );
    });

    debug_it('x to the 2 with horizontal offset', async (zoom: boolean) => {
        // The unfortunate truth is that computing the boundingClientRect returns slightly different results in the headless vs headful chromedriver.
        // I have the following options to work around that:
        // - Switch to Firefox and hope it's not the same there
        // - Accept the slightly wrong values: they don't matter for testing anyway, only when I want to do a manual inspection can they be slightly off.
        // - Run the LayoutEngine headfully
        //
        // Actually you know what, I'm willing to go to the LayoutEngine to workaround it from there

        const htmlElement = fs.readFileSync('./test/AnnotatedData/x^2 with horizontal offset.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlElement, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(
            element,
            getStyle,
            undefined,
            'stroke:red; stroke-width: 0.1px; fill: transparent',
            'fill:green; stroke-width: 0.1px; opacity: 30%'
        );

        overlayBodyWithKatexCSS(htmlElement, svg, './test/x_to_the_2_with_horizontal_index_after.html'); // debug purposes only
        const debugRects = debugGetBoundingRects(element as HTMLDivElement, 'x', '2'); // eslint-disable-line @typescript-eslint/no-unused-vars

        const testableSvgPart = getTestableSvgPart(svg).replace(/\n<rect.*\/>/g, '');
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="17.425001" height="21.333334">
<path d="M105,0 100,0 100,23 105,23 105,0" />
<path d="M114,0 105,0 105,23 106,23 106,23 109,23 109,23 114,23 114,0" />
<path d="M115,23 115,23 118,23 118,0 114,0 114,23 115,23" />
</svg>`
                : `<svg width="17.421875" height="21">
<path d="M105,1 100,1 100,22 105,22 105,1" />
<path d="M106,1 105,1 105,22 106,22 106,22 109,22 109,1 106,1 106,1
 M109,22 114,22 114,1 109,1 109,22" />
<path d="M115,22 115,22 118,22 118,1 114,1 114,22 115,22" />
</svg>`
        );
    });

    debug_it('f(x)', async zoom => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(element as HTMLElement, getStyle);

        overlayBodyWithKatexCSS(htmlBody, svg, './test/f_of_x_index_after.html'); // debug purposes only

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
