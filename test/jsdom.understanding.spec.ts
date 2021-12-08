import '../src/polyfills';
import { JSDOM } from 'jsdom';
import { assert, assertEqual, createRandomString, sequenceIndexOf } from '../src/utils';
import { implSymbol } from '../node_modules/jsdom/lib/jsdom/living/generated/utils';
import os from 'os';
import fs from 'fs';
import Path from 'path';
import { spawnSync, SpawnSyncReturns, execSync } from 'child_process';
import { getAllElementsByXPath } from '../src/xpathutils';
import { isDebuggingZoomed } from './utils/utils';
import { timer } from './utils/timer';
import { initGlobalTypesFromJSDOM } from '.';

function writeNoteLine(s: string) {
    // these notes are printed at the end of a jest session
    fs.appendFileSync('../.jestNotes.txt', s + "\n");
}
describe('JSDom Understanding tests', () => {
    let jsDomInstance: JSDOM;
    beforeEach(() => jsDomInstance = initGlobalTypesFromJSDOM());

    it('passes instanceof check', () => {
        assert(jsDomInstance.window.document.createElement('div') instanceof HTMLElement);
    });
});

export function toHTML(html: string): HTMLElement {
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

    return bodyElement;
}
export function isKatexStylesheetLink(htmlElement: Element): boolean {
    return htmlElement.tagName.toUpperCase() === 'LINK' && (htmlElement as HTMLLinkElement).href.endsWith('/katex.css');
}

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

// if there's a zoom, headless must be false
type LayoutConfig =
    {
        noCache?: boolean;
    } & ({
        headless?: boolean;
    }
        | {
            headless?: false;
            zoom?: number;
        });

export async function toHTMLElementWithBoundingRectanglesWithKatex(htmlElement: string, tag: string): Promise<HTMLElement> {
    return toHTMLElementWithBoundingRectangles(htmlElement, true, {}, tag);
}
export async function toHTMLElementWithBoundingRectanglesWithTag(htmlElement: string, tag: string) {
    return toHTMLElementWithBoundingRectangles(htmlElement, false, {}, tag);
}
export async function toHTMLElementWithBoundingRectangles(
    htmlElement: string,
    includeKaTeX: boolean = false,
    layoutConfig: LayoutConfig = {},
    tag: string
): Promise<HTMLElement> {
    const dir = Path.join(os.tmpdir(), 'blatex.interactivity.jsdom', createRandomString(8)) + '/';
    fs.mkdirSync(dir, { recursive: true });
    const path = Path.join(dir, 'Index.html');
    let links: string = '';
    if (includeKaTeX) {
        const katexDir = Path.resolve('./node_modules/katex/dist/') + '/';
        assert(fs.existsSync(katexDir), 'katex not found. Run `yarn install`?');

        for (const file of ['katex.css']) {
            fs.copyFileSync(katexDir + file, dir + file);
        }
        links = `<link href="katex.css" rel="stylesheet" />`;
    }
    const html = `<!DOCTYPE html>
    <html>
        <head>
            ${links}
        </head>
        ${htmlElement.indexOf('<body>') < 0 ? `<body style="margin: 0">${htmlElement}</body>` : htmlElement}
    </html>`;

    fs.appendFileSync(path, html);

    const rectanges = await computeLayout(path, layoutConfig, tag);

    const element = toHTML(html);
    const elements = getAllElementsByXPath(element.ownerDocument);
    let alignedRectangles;
    if (rectanges.length === elements.length) {
        alignedRectangles = rectanges;
    } else {
        if (rectanges.length === 0 || elements.length === 0)
            throw new Error('At least one element in each sequence must exist');
        if (rectanges.length > elements.length) {
            const rectangleTags = rectanges.map(r => r.tag);
            const elementTags = elements.map(r => r[1].tagName);
            const index = sequenceIndexOf(rectangleTags, elementTags);
            if (index === -1) throw new Error("It looks like the rectangles and elements don't match");
            alignedRectangles = rectanges.slice(index);
        } else throw new Error('Fewer rectangles than elements');
    }
    for (let i = 0; i < alignedRectangles.length; i++) {
        setClientDimensions(elements[i][1], alignedRectangles[i]);
    }
    return element;
}
export async function computeLayout(path: string, layoutConfig: LayoutConfig, tag: string): Promise<TaggedRectangle[]> {
    const tcs = new PromiseCompletionSource<string>();
    let subprocess: SpawnSyncReturns<Buffer>;
    const options = { cwd: './tools/', timeout: 30000 };

    const dir = fs.statSync(path).isDirectory();
    const args = [dir ? '--dir' : '--file', path];
    if (layoutConfig.noCache === true)
        args.push('--no-cache');

    if ('zoom' in layoutConfig && layoutConfig.zoom !== undefined && layoutConfig.zoom !== 100) {
        assert(isDebuggingZoomed, "'zoom' cannot be specified in CI");
        assert(Number.isInteger(layoutConfig.zoom), "'zoom' must be an integer");
        args.push('--zoom');
        args.push(layoutConfig.zoom.toString());
        args.push('--headful'); // zoom requires headful (next version of LayoutEngine will automatically do this, but this can't hurt)
    } else if (layoutConfig.headless === false) {
        args.push('--headful');
    }

    // launch layoutengine
    const startTime = timer();
    if (os.platform() === 'win32') {
        if (!fs.existsSync(Path.resolve('./tools/LayoutEngine.exe')))
            throw new Error('LayoutEngine not found at ' + Path.resolve('./tools/LayoutEngine.exe'));
        // args[1] is path:
        args[1] = args[1].replace(/\\/g, '/');
        subprocess = spawnSync('LayoutEngine.exe', args, options);
    } else {
        const enginePath = Path.resolve('./tools/layoutengine');
        if (!fs.existsSync(enginePath)) throw new Error(`LayoutEngine not found at '${enginePath}`);

        const bashOutput = execSync(`/bin/bash -c "[[ -x '${enginePath}' ]] && echo true || echo false"`).toString();
        assert(bashOutput === 'true\n', './tools/layoutengine does not have the executable bit set!');

        subprocess = spawnSync('./layoutengine', args, options);
    }

    writeNoteLine(`${tag}.process = ${startTime.ms}`);
    if (subprocess.error !== undefined) {
        // handle failure to start the process
        tcs.reject(subprocess.error);
        console.log(subprocess.error.stack);
        console.log('stderr: ' + subprocess.stderr);
        throw new Error('fatal: ' + subprocess.error.name + ': ' + subprocess.error.message);
    } else if (subprocess.status !== 0) {
        // handle if the process fails internally
        tcs.reject(subprocess.stderr.toString());
        console.log('stderr: ' + subprocess.stderr.toString());
        throw new Error(subprocess.stderr.toString());
    } else {
        // handle success by the process
        tcs.resolve(subprocess.stdout.toString());
    }

    const stdout = await tcs.promise;
    // console.log(subprocess);
    // console.log(stdout);
    return parseComputeLayoutOutput([stdout]);
}
function parseComputeLayoutOutput(stdout: string[]): TaggedRectangle[] {
    const lines = toLines(stdout);

    const rectangles: TaggedRectangle[] = [];
    let foundStart = false;
    for (const line of lines) {
        if (!foundStart) {
            foundStart = line.startsWith('########## RECTANGLES INCOMING');
        } else {
            const dimensions = line.split(',');
            if (dimensions.length !== 5) throw new Error('Expected a tag and 4 numbers for a rectangle');
            rectangles.push({
                tag: dimensions[0],
                x: parseFloat(dimensions[1]),
                y: parseFloat(dimensions[2]),
                width: parseFloat(dimensions[3]),
                height: parseFloat(dimensions[4]),
            });
        }
    }
    return rectangles;
}
function* toLines(stdOut: string[]): Iterable<string> {
    for (const output of stdOut) {
        yield* output
            .replace(/\r/g, '')
            .split('\n')
            .filter(s => s !== '');
    }
}
function setClientDimensions(element: HTMLElement, rect: TaggedRectangle): void {
    assert(element.tagName.toUpperCase() === rect.tag.toUpperCase());
    const domRect = new DOMRect(rect.x, rect.y, rect.width, rect.height);
    assert(domRect.x !== undefined);
    assert(domRect.y !== undefined);
    assert(domRect.width !== undefined);
    assert(domRect.height !== undefined);

    Object.defineProperty(element[implSymbol], 'clientLeft', {
        get: () => domRect.x,
    });
    Object.defineProperty(element[implSymbol], 'clientTop', {
        get: () => domRect.y,
    });
    Object.defineProperty(element[implSymbol], 'clientWidth', {
        get: () => domRect.width,
    });
    Object.defineProperty(element[implSymbol], 'clientHeight', {
        get: () => domRect.height,
    });
    // tslint:disable-next-line: no-string-literal
    element[implSymbol]['getBoundingClientRect'] = () => domRect;
}
interface TaggedRectangle {
    tag: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * I've never been able to remember this pattern, and just wanted to build it
 * such that I can use it like a TaskCompletionSource{T}
 */
class PromiseCompletionSource<T> {
    public readonly promise: Promise<T>;
    public readonly resolve: (value: T | PromiseLike<T>) => void;
    public readonly reject: (reason?: any) => void;

    constructor() {
        let promiseResolve;
        let promiseReject;

        this.promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
        this.resolve = promiseResolve;
        this.reject = promiseReject;
    }
}

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
