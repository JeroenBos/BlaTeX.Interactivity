//@ts-nocheck

import { assert } from "./utils";

function getXPath(node: Element): string {
    var comp, comps = [];
    var xpath = '';
    var getPos = function (node) {
        var position = 1, curNode;
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName === node.nodeName) {
                ++position;
            }
        }
        return position;
    }

    assert(typeof Document !== "undefined");
    if (node instanceof Document) {
        return '/';
    }

    // @ts-ignore
    for (; node && !(node instanceof Document); node = node.nodeType === Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
    }

    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        xpath += '/' + comp.name;
        if (comp.position != null) {
            xpath += '[' + comp.position + ']';
        }
    }
    return xpath;
}

/** Gets all elements (recursively) in the specified element, sorted by xpath. */
export function getAllElementsByXPath(node: Element | Document): [string, HTMLElement][] {
    const all = node.getElementsByTagName("*");

    const result: [string, Element][] = [];
    for (var i = 0, max = all.length; i < max; i++) {
        const xpath = getXPath(all[i]);

        result.push([xpath, all[i]]);
    }
    result.sort((a, b) => a[0].localeCompare(b[0]));
    return result;
}
