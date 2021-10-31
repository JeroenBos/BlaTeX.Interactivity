import fs from 'fs';
import Point from '../../src/polyfills/Point';

/** Overlays two HTMLs. */
export function overlayBodyWithKatexCSS(
    htmlBody: string,
    htmlToBeOverlayed: string,
    offset: Point = new Point(0, 0),
    scale: number = 1,
    path: string | undefined = './test/index.html'
) {
    const bodyStyle = `transform: scale(${scale}); transform-origin: 0 0; margin: 0 0; `;
    const html = `<!DOCTYPE html><html>  <head><link href="../node_modules/katex/dist/katex.css" rel="stylesheet" /></head>  <body style="${bodyStyle}>${htmlBody}</body></html>`;
    return overlay(html, htmlToBeOverlayed, offset, path);
}
export function overlay(
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
