/* 
This implements a comparer between two MinDistances that decides which one is closer:
The one closest (by the Manhattan metric) to its bounding rectangle wins, and containment always wins over non-containment.

More explicitly, consider these cases:
  - one MinDistances contains the point of interest and the other one doesn't:     
    - The one containing the point is closer
  - neither contain the point:
    - A the one with smallest Manhattan distance to the bounding rectangle is considered closest
  - both contain the point
    - Again, the one with the smallest distance to the bounding rectangle is considered closest

*/

import { MinDistances } from "./MinDistances";

const LHS_IS_SMALLER = -1;
const RHS_IS_SMALLER = 1;

export const ManhattenComparerToBoundary = createComparer();

function createComparer() {
    const result = (lhs: MinDistances, rhs: MinDistances) => {
        if (MinDistances.contains(lhs) !== MinDistances.contains(rhs)) {
            if (MinDistances.contains(lhs))
                return LHS_IS_SMALLER;
            else
                return RHS_IS_SMALLER;
        }

        const lhsDistance = MinDistances.getManhattanDistance(lhs);
        const rhsDistance = MinDistances.getManhattanDistance(rhs);
        if (lhsDistance < rhsDistance)
            return LHS_IS_SMALLER;
        else if (rhsDistance < lhsDistance)
            return RHS_IS_SMALLER;
        return 0;
    };
    return result;
}
