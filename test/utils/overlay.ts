import fs from 'fs';

/** Overlays two HTMLs. */
export function overlay(
    html: string,
    htmlToBeOverlayed: string,
    path: string | undefined = './test/index.html'
): string {
    const overlayPrefix = `<div style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:10; fill-opacity: 50%; ">`;
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
