/* eslint-disable @typescript-eslint/no-use-before-define */
export type MinDistances = {
    minDistance: number;
    minHorizontalDistance: number;
    minVerticalDistance: number;
    horizontalType: HorizontalClosestDistanceType;
    verticalType: VerticalClosestDistanceType;
};
/* eslint-disable-next-line @typescript-eslint/no-redeclare */
export namespace MinDistances {
    /** Gets whether the point is contained in the rectangle represented by the MinDistances. */
    export function contains(self: MinDistances) {
        return (
            VerticalClosestDistanceType.IsIn(self.verticalType) &&
            HorizontalClosestDistanceType.IsIn(self.horizontalType)
        );
    }
    /** Gets the manhattan distance from the point to the boundary of the bounding rect represented by the MinDistances. */
    export function getManhattanDistance(self: MinDistances) {
        if (HorizontalClosestDistanceType.IsIn(self.horizontalType)) {
            if (VerticalClosestDistanceType.IsIn(self.verticalType)) {
                return Math.min(self.minHorizontalDistance, self.minVerticalDistance);
            }
            return self.minVerticalDistance;
        }
        if (VerticalClosestDistanceType.IsIn(self.verticalType)) {
            return self.minHorizontalDistance;
        }
        return self.minHorizontalDistance + self.minVerticalDistance;
    }
    export function fromManhattan(q: ManhattanOffset): MinDistances {
        const minDistance = Math.min(
            Math.abs(q.offsetFromBottom),
            Math.abs(q.offsetFromLeft),
            Math.abs(q.offsetFromRight),
            Math.abs(q.offsetFromTop)
        );
        const minHorizontalDistance = Math.min(Math.abs(q.offsetFromLeft), Math.abs(q.offsetFromRight));
        const minVerticalDistance = Math.min(Math.abs(q.offsetFromTop), Math.abs(q.offsetFromBottom));

        let horizontal: HorizontalClosestDistanceType;
        if (Math.abs(q.offsetFromLeft) < Math.abs(q.offsetFromRight)) {
            // according to the definition of Manhattan."offset", a negative offset means to the left of (both offsetToLeft and offsetToRight), and 0 is in.

            horizontal =
                q.offsetFromLeft >= 0 ? HorizontalClosestDistanceType.LeftIn : HorizontalClosestDistanceType.LeftOut;
        } else {
            horizontal =
                q.offsetFromRight > 0 ? HorizontalClosestDistanceType.RightOut : HorizontalClosestDistanceType.RightIn;
        }

        let vertical: VerticalClosestDistanceType;
        if (Math.abs(q.offsetFromTop) < Math.abs(q.offsetFromBottom)) {
            // according to the definition of Manhattan."offset", a negative offset means above (both offsetToTop and offsetToBottom), and 0 is in.
            vertical = q.offsetFromTop >= 0 ? VerticalClosestDistanceType.TopIn : VerticalClosestDistanceType.TopOut;
        } else {
            vertical =
                q.offsetFromBottom > 0 ? VerticalClosestDistanceType.BottomOut : VerticalClosestDistanceType.BottomIn;
        }

        return {
            minDistance,
            horizontalType: horizontal,
            verticalType: vertical,
            minHorizontalDistance,
            minVerticalDistance,
        };
    }
}

export enum HorizontalClosestDistanceType {
    LeftOut,
    LeftIn,
    RightIn,
    RightOut,
}
// eslint-disable-next-line no-redeclare
export namespace HorizontalClosestDistanceType {
    export function IsIn(e: HorizontalClosestDistanceType) {
        switch (e) {
            case HorizontalClosestDistanceType.LeftIn:
            case HorizontalClosestDistanceType.RightIn:
                return true;
            case HorizontalClosestDistanceType.LeftOut:
            case HorizontalClosestDistanceType.RightOut:
                return false;
            default:
                throw new Error('Invalid HorizontalClosestDistanceType');
        }
    }
    export function IsOut(e: HorizontalClosestDistanceType) {
        return !IsIn(e);
    }
}
export enum VerticalClosestDistanceType {
    TopOut,
    TopIn,
    BottomIn,
    BottomOut,
}
// eslint-disable-next-line no-redeclare
export namespace VerticalClosestDistanceType {
    export function IsIn(e: VerticalClosestDistanceType) {
        switch (e) {
            case VerticalClosestDistanceType.TopIn:
            case VerticalClosestDistanceType.BottomIn:
                return true;
            case VerticalClosestDistanceType.TopOut:
            case VerticalClosestDistanceType.BottomOut:
                return false;
            default:
                throw new Error('Invalid VerticalClosestDistanceType');
        }
    }
    export function IsOut(e: VerticalClosestDistanceType) {
        return !IsIn(e);
    }
}

export type ManhattanOffset = {
    offsetFromLeft: number;
    offsetFromRight: number;
    offsetFromTop: number;
    offsetFromBottom: number;
};
// "offset" means w.r.t. the positve axis, e.g.:
// - a negative left offset means the point is to the left of the rect.left
// - a negative right offset means the point is to the left of rect.right
// It means that the offset can be regarded as one of the dimensions of the offset vector that, when added to a boundary coordinate, ends up at the the point (at least that location).
