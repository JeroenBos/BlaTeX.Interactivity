// ensures logs of the previous run aren't relogged
module.exports = async function () {
    try {
        const fs = require('fs');

        // "unlink" in JS means "delete"
        fs.unlinkSync('../.jestNotes.txt');
    }
    catch (e) {
    }
};
