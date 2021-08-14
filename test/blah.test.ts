import { JSDOM } from 'jsdom';
import { assert } from '../src/utils';

describe('JSDOM instanceof demonstration', () => {
    // copied from https://stackoverflow.com/a/64027981/308451
    let jsDomInstance: JSDOM;

    beforeEach(() => {
        jsDomInstance = new JSDOM();
        global.HTMLElement = jsDomInstance.window.HTMLElement;
    });

    it('passes instanceof check', () => {
        expect(
            jsDomInstance.window.document.createElement('div') instanceof
                HTMLElement
        ).toBe(true);
    });
});

function toHTML(html: string): HTMLElement {
    const window = new JSDOM(html).window;
    // make instanceof checks work as expected:
    global.Element = window.Element;
    global.HTMLElement = window.HTMLElement;
    global.HTMLHeadElement = window.HTMLHeadElement;
    global.HTMLBodyElement = window.HTMLBodyElement;

    const rootElement = window.document.firstElementChild;
    if (rootElement == null || !(rootElement instanceof HTMLElement)) {
        throw new Error();
    }
    const [headElement, bodyElement] = rootElement.children;
    assert(headElement instanceof HTMLHeadElement);
    assert(bodyElement instanceof HTMLBodyElement);
    assert(bodyElement.childElementCount === 1);
    const firstElement = bodyElement.childNodes[0];

    assert(firstElement instanceof HTMLElement);
    return firstElement;
}

describe('JSDom Understanding tests', () => {
    it('works', () => {
        const element = toHTML('<div></div>');
        expect(element.hasChildNodes()).toBeFalsy();
    });
});
