import {
    toHTMLElementWithBoundingRectangles,
    toHTMLElementWithBoundingRectanglesWithKatex,
} from './jsdom.understanding.spec';
import { getCursorIndexByProximity, getDistance_FOR_TESTING_ONLY } from '../src/PointToCursorHandleConverter';

describe('Resolve location to parsetree location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div></div>');

        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        expect(result).toBe(undefined);
    });
    it('Simple <div> clicking near the left', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div data-loc="0,1"></div>');

        const clickToTheLeft = getCursorIndexByProximity(element, { x: 50, y: 50 });
        expect(clickToTheLeft).toBe(0);
    });
    it('Simple <div> clicking near the right', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div data-loc="0,1"></div>');

        const clickToTheRight = getCursorIndexByProximity(element, { x: 750, y: 50 });
        expect(clickToTheRight).toBe(1);
    });
});

describe('Resolve KaTeX Source Location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`);

        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        expect(result).toBe(1);
    });
});

describe('Test getDistance internally.', () => {
    it('<katex>c</katex>', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`);

        const distancesToOrigin = getDistance_FOR_TESTING_ONLY(element, { x: 0, y: 0 });

        // the element's bounding rect is {0, 1, width=13.4375, 21}
        expect(distancesToOrigin.distanceToLeft).toBe(0);
        expect(distancesToOrigin.distanceToRight).toBe(-13.4375);
        expect(distancesToOrigin.distanceToTop).toBe(-1);
        expect(distancesToOrigin.distanceToBottom).toBe(-22);
    });
});
