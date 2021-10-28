import { toHTMLWithRectangles } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';
import { assert } from '../src/utils';

const getStyle = (value: number): string => {
    const common = '; stroke: black; stroke-width: 1; ';
    if (value === -1) return 'fill:gray;fill-rule: evenodd';
    switch (value % 10) {
        case 0:
            return 'fill:black;fill-rule: evenodd' + common;
        case 1:
            return 'fill:red;fill-rule: evenodd' + common;
        case 2:
            return 'fill:blue;fill-rule: evenodd' + common;
        case 3:
            return 'fill:purple;fill-rule: evenodd' + common;
        case 4:
            return 'fill:light-blue;fill-rule: evenodd' + common;
        case 5:
            return 'fill:orange;fill-rule: evenodd' + common;
        case 6:
            return 'fill:cyan;fill-rule: evenodd' + common;
        case 7:
            return 'fill:light-green;fill-rule: evenodd' + common;
        case 8:
            return 'fill:light-gray;fill-rule: evenodd' + common;
        case 9:
            return 'fill:green;fill-rule: evenodd' + common;
        default:
            return 'fill:yellow;fill-rule: evenodd' + common;
    }
};
const getTestableSvgPart = (svg: string): string => {
    while (true) {
        const pattern = ' style="';
        const styleIndex = svg.indexOf(pattern);
        if (styleIndex < 0) break;

        const closingQuote = svg.indexOf('"', styleIndex + pattern.length);
        svg = svg.substr(0, styleIndex) + svg.substr(closingQuote + 1);
    }
    return svg;
};
describe('Color HTML based on source locations', () => {
    it('<div>TEXT</div>', async () => {
        const html = '<div>TEXT</div>';
        const element = await toHTMLWithRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assert(
            testableSvgPart ===
                `<svg width="784" height="18">
<path d="M792,0 0,0 0,26 792,26 792,0" />
</svg>`
        );
    });

    it('<div data-loc="0,1">TEXT</div>', async () => {
        const html = '<div data-loc="0,1">TEXT</div>';
        const element = await toHTMLWithRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assert(
            testableSvgPart ===
                `<svg width="784" height="18">
<path d="M392,0 0,0 0,26 392,26 392,0" />
<path d="M792,26 792,0 400,0 400,0 392,0 392,26 792,26" />
</svg>`
        );
    });

    it('<div><div data-loc="0,1">TEXT</div><div data-loc="1,2">TEXT</div></div>', async () => {
        const html = '<div><div data-loc="0,1">TEXT</div><div data-loc="1,2">TEXT</div></div>';
        const element = await toHTMLWithRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assert(
            testableSvgPart ===
                `<svg width="784" height="36">
<path d="M392,0 0,0 0,44 392,44 392,0" />
<path d="M792,44 792,0 400,0 400,0 392,0 392,44 792,44" />
</svg>`
        );
    });

    it('<div><span data-loc="0,1">TEXT</span><span data-loc="1,2">TEXT</span></div>', async () => {
        const html = '<div><span data-loc="0,1">TEXT</span><span data-loc="1,2">TEXT</span></div>';
        const element = await toHTMLWithRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assert(
            testableSvgPart ===
                `<svg width="784" height="18">
<path d="M21,0 0,0 0,26 21,26 21,0" />
<path d="M62,26 106,26 106,0 62,0 62,26
 M106,26 204,26 204,0 106,0 106,26
 M204,26 400,26 400,0 204,0 204,26
 M400,26 792,26 792,0 400,0 400,26" />
<path d="M62,0 21,0 21,26 62,26 62,0" />
</svg>`
        );
    });
});
