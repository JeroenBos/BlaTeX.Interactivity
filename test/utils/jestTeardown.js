module.exports = async function () {
    try {
        const fs = require('fs');

        console.log("\nWriting out '../.jestNotes.txt'");
        const contents = fs.readFileSync('../.jestNotes.txt').toString();
        const lines = contents.split("\n");
        lines.sort();
        for (const line of lines)
            console.log(line);
    }
    catch (e) {
        console.log("Error in jestTeardown:");
        console.log(e);
    }
};
