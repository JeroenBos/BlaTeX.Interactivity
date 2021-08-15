import { toHTMLWithRectangles } from './jsdom.understanding.spec';
import { getCursorIndexByProximity } from '../src/PointToCursorHandleConverter';
describe('Resolve location to parsetree location', () => {
    it('Simple <div> without annotations', async () => {
        const element = await toHTMLWithRectangles('<div></div>');

        const result = getCursorIndexByProximity(element, { dx: 50, dy: 50 });

        expect(result).toBe(undefined);
    });
    it('Simple <div>', async () => {
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
