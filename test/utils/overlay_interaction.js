/* eslint-disable */
var annotatedElements = undefined;
var annotatedValue = -1;
document.addEventListener("mousemove", function (event) {
    const { x, y } = { x: event.clientX, y: event.clientY };
    const pointerElement = document.getElementById("pointer");
    pointerElement.textContent = `a(${toFixedIfNecessary(x, 5)}, ${toFixedIfNecessary(y, 5)})\n`;
});
document.addEventListener("mouseover", function (event) {
    const hintElement = document.getElementById("hint");
    hintElement.textContent = event.target.attributes;
    if ("data-loc-index" in event.target.attributes) {
        const value = event.target.attributes["data-loc-index"].value;
        hintElement.textContent = value;
        let count = 0;
        if (value != annotatedValue) {
            const rhs = document.querySelectorAll(`[data-loc^="${value},"]`);
            const lhs = document.querySelectorAll(`[data-loc$=",${value}"]`);

            annotatedValue = value;

            if (annotatedElements) {
                for (const element of annotatedElements) {
                    if (element.style) {
                        element.style.backgroundColor = "";
                    }
                }
            }

            annotatedElements = Array.from(rhs).concat(Array.from(lhs));

            for (const element of annotatedElements) {
                if (element.style) {
                    element.style.backgroundColor = "#205081";
                }
                else {
                    element.style = { backgroundColor: "#205081" };
                }
                count++;
            }
        }
        hintElement.textContent = value + ` ${count}`;
    }
    // else {
    //     const rect = event.target.getBoundingClientRect();
    //     hintElement.textContent = `(${rect.left}, ${rect.top})`;
    // }

}, false);

function toFixedIfNecessary(value, dp) {
    return +parseFloat(value).toFixed(dp);
}

document.addEventListener("click", function (event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);
    const datalocElements = [];
    for (const element of elements) {
        if (element.tagName === "SPAN") {
        // if (element.tagName !== "rect" && element.tagName !== "svg"  && element.tagName !== "path" && element.tagName !== "html" && element.tagName !== "body") {
            // for (const datalocElement in element.querySelector("[data-loc]")) {
            datalocElements.push(element);
            console.log(element.tagName);
        }
    }
    let text = "";
    for (const datalocElement of datalocElements) {
        const rect = datalocElement.getBoundingClientRect();
        if (rect.left != 0 || rect.top != 0) {
            if (rect.width != 0 && rect.height != 0) {
                text += `(${toFixedIfNecessary(rect.left, 5)}, ${toFixedIfNecessary(rect.top, 5)})\n`;
            }
        }
    }
    const hintElement = document.getElementById("hint");
    hintElement.textContent = text;
});


// const rhs = document.querySelectorAll(`[data-loc^="${value},"]`);
// const lhs = document.querySelectorAll(`[data-loc$=",${value}"]`);
// annotatedElements = Array.from(rhs) + Array.from(lhs);
