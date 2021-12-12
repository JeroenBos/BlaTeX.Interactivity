import { TimedoutException } from "../../src/jbsnorro/TimedoutException";
import { assert } from "../../src/utils";

describe("TimedoutException", () => {
    it("can be caught", () => {
        try {
            throw new TimedoutException();
        }
        catch (TimedoutException) {
            return;
        }
        /* eslint-disable-next-line no-unreachable */
        assert(false, "Not caught");
    });
})
