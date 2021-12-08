import fs from 'fs';
export { getCursorIndexByProximity } from './PointToCursorHandleConverter';


export function readAllText(path: string): string {
    return fs.readFileSync(path).toString();
}
