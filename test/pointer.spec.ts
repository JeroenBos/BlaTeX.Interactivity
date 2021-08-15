import { toHTMLWithRectangles, toHTMLWithRectanglesWithKatex } from './jsdom.understanding.spec';
import { getCursorIndexByProximity } from '../src/PointToCursorHandleConverter';

describe('Resolve location to parsetree location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLWithRectangles('<div></div>');

        const result = getCursorIndexByProximity(element, { dx: 50, dy: 50 });

        expect(result).toBe(undefined);
    });
    it('Simple <div> clicking near the left', async () => {
        const element = await toHTMLWithRectangles('<div data-loc="0,1"></div>');

        const clickToTheLeft = getCursorIndexByProximity(element, { dx: 50, dy: 50 });
        expect(clickToTheLeft).toBe(0);
    });
    it('Simple <div> clicking near the right', async () => {
        const element = await toHTMLWithRectangles('<div data-loc="0,1"></div>');

        const clickToTheRight = getCursorIndexByProximity(element, { dx: 750, dy: 50 });
        expect(clickToTheRight).toBe(1);
    });
});

describe('Resolve KaTeX Source Location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLWithRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`);

        const result = getCursorIndexByProximity(element, { dx: 50, dy: 50 });

        expect(result).toBe(1);
    });
});
