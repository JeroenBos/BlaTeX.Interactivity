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
