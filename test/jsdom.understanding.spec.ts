import '../src/polyfills';
import { JSDOM } from 'jsdom';
import { assert, assertEqual } from '../src/utils';
import { implSymbol } from '../node_modules/jsdom/lib/jsdom/living/generated/utils';
import { initGlobalTypesFromJSDOM } from '.';
import { toHTML, toHTMLElementWithBoundingRectanglesWithTag } from './utils/computeLayout';

describe('JSDom Understanding tests', () => {
    let jsDomInstance: JSDOM;
    beforeEach(() => jsDomInstance = initGlobalTypesFromJSDOM());

    it('passes instanceof check', () => {
        assert(jsDomInstance.window.document.createElement('div') instanceof HTMLElement);
    });
});



describe('JSDom Understanding tests', () => {
    it('Can create html element from string', () => {
        const element = toHTML('<div></div>');
        assertEqual(element.childNodes.length, 1);
        assertEqual(element.childNodes[0].hasChildNodes(), false);
    });
});

function setClientSize(element: HTMLElement, width: number, height: number): void {
    Object.defineProperty(element[implSymbol], 'clientWidth', {
        get: () => width,
    });
    Object.defineProperty(element[implSymbol], 'clientHeight', {
        get: () => height,
    });
}
describe('JSDom Understanding tests', () => {
    it('Can override properties', () => {
        const element = toHTML('<div></div>');
        setClientSize(element, 10, 20);
        expect(element.clientWidth).toBe(10);
        expect(element.clientHeight).toBe(20);
    });
});



describe('JSDom Understanding tests', () => {
    beforeEach(initGlobalTypesFromJSDOM);

    it('Can override properties with selenium', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithTag('<div></div>', "sel");
        expect(element.clientLeft).toBe(0);
        expect(element.clientTop).toBe(0);
        expect(element.clientWidth).toBe(1920);
        expect(element.getBoundingClientRect()).toEqual(new DOMRect(0, 0, 1920, 0));
    });
});
