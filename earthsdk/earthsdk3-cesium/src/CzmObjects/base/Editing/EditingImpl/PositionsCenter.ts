import { geoDistance, getMinMaxCorner } from "earthsdk3";
import { Destroyable, getReactFuncs, react, reactArrayWithUndefined, ReactParamsType } from "xbsj-base";

export class PositionsCenter extends Destroyable {
    private _center = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get centerReact() { return this._center; }
    get center() { return this._center.value; }
    get centerChanged() { return this._center.changed; }

    private _radius = this.disposeVar(react<number>(0));
    get radiusReact() { return this._radius; }
    get radius() { return this._radius.value; }
    get radiusChanged() { return this._radius.changed; }

    constructor(
        positionsReactParams: ReactParamsType<[number, number, number][] | undefined>,
    ) {
        super();

        const [getPositions, setPositions, positionsChanged] = getReactFuncs<[number, number, number][] | undefined>(positionsReactParams);

        {
            const update = () => {
                const positions = getPositions();
                if (positions) {
                    const { center, minPos, maxPos } = getMinMaxCorner(positions);
                    this._center.value = center;
                    this._radius.value = geoDistance(minPos, maxPos) / 2
                } else {
                    this._center.value = undefined;
                }
            }
            update();
            this.dispose(positionsChanged.disposableOn(update));
        }
    }
}
