import { assertEqual } from '../../src/utils';
import { dumpOverlay } from './overlay';
import { getTestableSvgPart } from './utils';

describe('Test html overlay', () => {
    it('Simple divs overlay, without html wrapper', async () => {
        const html1 = `<svg width="784" height="18"> <rect width="100" height="100" style="fill: red"/> </svg>`;
        const html2 = `<svg width="784" height="18"> <rect width="100" height="100" style="fill: green" left="10" top="10"/> </svg>`;
        const overlayed = dumpOverlay(html1, html2);

        assertEqual(
            overlayed,
            '<svg width="784" height="18"> <rect width="100" height="100" style="fill: red"/> </svg><div style="width:100%; height:100%; position:absolute; left:0px; top:0px; z-index:10; fill-opacity: 50%; "><svg width="784" height="18"> <rect width="100" height="100" style="fill: green" left="10" top="10"/> </svg></div>'
        );
    });

    it('Test that overlay is inserted at end of body when body is present', async () => {
        const htmlBody = `<svg width="784" height="18"> <rect width="100" height="100" style="fill: red"/> </svg>`;
        const html = `<!DOCTYPE html>
        <html>
            <head>
            <link href="katex.css" rel="stylesheet" />  <!-- doesn't exist, but doesn't matter for test -->
            </head>
            <body>${htmlBody}</body>
        </html>`;
        const svg = `<svg width="784" height="18"> <rect width="100" height="100" style="fill: green" left="10" top="10"/> </svg>`;

        const overlayed = dumpOverlay(html, svg);
        const testable = getTestableSvgPart(overlayed);
        assertEqual(
            testable,
            `<!DOCTYPE html>
        <html>
            <head>
            <link href="katex.css" rel="stylesheet" />  <!-- doesn't exist, but doesn't matter for test -->
            </head>
            <body><svg width="784" height="18"> <rect width="100" height="100"/> </svg><div><svg width="784" height="18"> <rect width="100" height="100" left="10" top="10"/> </svg></div></body>
        </html>`
        );
    });
});
