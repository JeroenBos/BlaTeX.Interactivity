import { assert, sequenceIndexOf } from '../src/utils';

describe('utils.sequenceIndexOf', () => {
    it('', () => {
        const result = sequenceIndexOf([], [1]);

        expect(result).toBe(-1);
    });
    it('', () => {
        const result = sequenceIndexOf([1], [1]);

        expect(result).toBe(0);
    });
    it('', () => {
        const result = sequenceIndexOf([1, 1], [1]);

        expect(result).toBe(0);
    });
    it('', () => {
        const result = sequenceIndexOf([1, 1], [1, 2]);

        expect(result).toBe(-1);
    });
    it('', () => {
        const result = sequenceIndexOf([1, 2], [1, 2]);

        expect(result).toBe(0);
    });
    it('', () => {
        const result = sequenceIndexOf([1, 2, 3], [1, 2]);

        expect(result).toBe(0);
    });
    it('', () => {
        const result = sequenceIndexOf([1, 1, 2, 3], [1, 2]);

        expect(result).toBe(1);
    });
});
