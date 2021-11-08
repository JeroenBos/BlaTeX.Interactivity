// this function cannot be in one of the .spec.ts files,
// because then it needs to be imported and then that importing module will fail (according to yarn)
// if the imported module fails. Which is just annoying.
export const getTestableSvgPart = (svg: string): string => {
    while (true) {
        const pattern = ' style="';
        const styleIndex = svg.indexOf(pattern);
        if (styleIndex < 0) break;

        const closingQuote = svg.indexOf('"', styleIndex + pattern.length);
        svg = svg.substr(0, styleIndex) + svg.substr(closingQuote + 1);
    }
    return svg;
};

export const debugGetBoundingRects = (someElementOrDocument: Element | Document, ...ids: string[]) => {
    const document =
        someElementOrDocument instanceof Element ? someElementOrDocument.ownerDocument : someElementOrDocument;

    const result = [];
    for (const id of ids) {
        result.push(document.getElementById(id).getBoundingClientRect());
    }
    return result;
};
export const getStyle = (value: number): string => {
    const common = '; opacity: 50%; stroke: black; stroke-width: 0.1; ';
    if (value === -1) return '';
    switch (value % 10) {
        case 0:
            return 'fill:black;fill-rule: evenodd' + common;
        case 1:
            return 'fill:red;fill-rule: evenodd' + common;
        case 2:
            return 'fill:blue;fill-rule: evenodd' + common;
        case 3:
            return 'fill:purple;fill-rule: evenodd' + common;
        case 4:
            return 'fill:light-blue;fill-rule: evenodd' + common;
        case 5:
            return 'fill:orange;fill-rule: evenodd' + common;
        case 6:
            return 'fill:cyan;fill-rule: evenodd' + common;
        case 7:
            return 'fill:light-green;fill-rule: evenodd' + common;
        case 8:
            return 'fill:light-gray;fill-rule: evenodd' + common;
        case 9:
            return 'fill:green;fill-rule: evenodd' + common;
        default:
            return 'fill:yellow;fill-rule: evenodd' + common;
    }
};
