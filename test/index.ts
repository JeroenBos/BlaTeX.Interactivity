
import { JSDOM } from 'jsdom';

/** 
 * Initializes types (on global) to be identical to the ones provided by JSDom.
 * Use like `const jsDomInstance = beforeEach(initGlobalTypesFromJSDOM)` in a `describe` context;
*/
export function initGlobalTypesFromJSDOM() {
    const jsDomInstance = new JSDOM();
    global.Node = jsDomInstance.window.Node;
    global.Document = jsDomInstance.window.Document;
    global.HTMLElement = jsDomInstance.window.HTMLElement;
    return jsDomInstance;
};

// from https://stackoverflow.com/a/64027981/308451
