import fs from 'fs';
import Point from '../../src/polyfills/Point';
import { isString } from '../../src/utils';
import { isDebugging } from './utils';

/** Overlays two HTMLs. */
export function dumpOverlayBodyWithKatexCSS(
    htmlBody: string,
    htmlToBeOverlayed: string,
    js: string | { src: string } | undefined = undefined,
    path: string | undefined = './test/index.html'
) {
    if (!isDebugging) {
        return;
    }
    const bodyStyle = `margin: 0 0; `;
    const jsElement = js === undefined ? "" : isString(js) ? `<script>${js}</script>` : `<script src="${js.src}"></script>`;
    const html = `<!DOCTYPE html><html>  <head><link href="../node_modules/katex/dist/katex.css" rel="stylesheet" />${jsElement}</head>  <body style="${bodyStyle}">${htmlBody}<div id="hint"></div><div id="pointer"></div></body></html>`;
    return dumpOverlay(html, htmlToBeOverlayed, new Point(0, 0), path);
}
export function dumpOverlay(
    html: string,
    htmlToBeOverlayed: string,
    offset: Point = new Point(0, 0),
    path: string | undefined = './test/index.html'
): string {
    const overlayPrefix = `<div style="width:100%; height:100%; position:absolute; left:${offset.x}px; top:${offset.y}px; z-index:10; fill-opacity: 50%; ">`;
    const overlayPostfix = `</div>`;

    const insertionIndex = getInsertionIndex(html);

    const overlayed: string =
        html.substr(0, insertionIndex) +
        overlayPrefix +
        htmlToBeOverlayed +
        overlayPostfix +
        html.substr(insertionIndex);

    if (path !== undefined) {
        fs.writeFileSync(path, overlayed);
    }

    return overlayed;
}

/** Gets the index at which to insert the overlay div */
function getInsertionIndex(html: string): number {
    const result = html.indexOf('</body>');
    if (result === -1) return html.length;
    return result;
}
