import { PositionsEditing } from './PositionsEditing';
import { PointEditing } from "./PointEditing";
import { Destroyable, getReactFuncs, ObjResettingWithEvent, reactArrayWithUndefined, ReactParamsType } from 'xbsj-base';
import { getMinMaxCorner } from "earthsdk3";
import { ESCesiumViewer } from '../../../../ESCesiumViewer';

class RectanglePositionsEditingResetting extends Destroyable {
    private _points = this.disposeVar(reactArrayWithUndefined<[number, number, number][]>(undefined));

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(private _rectangleEditing: RectangleEditing) {
        super();
        {
            const points = this._points;
            const hr = this._rectangleEditing.heightReact;
            const [getHr, setHr] = getReactFuncs<number>(hr);
            const rr = this._rectangleEditing.rectangleReact
            const [getRr, setRr] = getReactFuncs<[number, number, number, number] | undefined>(rr);

            const rectangleToPoints = () => {
                const hrv = getHr();
                const rrv = getRr();
                if (!rrv) {
                    this._points.value = undefined;
                    return;
                }

                const [minX, minY, maxX, maxY] = rrv;
                let height = hrv;

                if (points.value && points.value.length > 0) {
                    height = points.value[0][2] ?? 0;
                }
                points.value = [
                    [minX, minY, height],
                    [maxX, maxY, height],
                ];
            };
            rectangleToPoints();
        }
        this._sPositionsEditing = this.disposeVar(new PositionsEditing(this._points, false, this._rectangleEditing.editingReact, this._rectangleEditing.czmViewer, 2));
        const points = this._points;
        const hr = this._rectangleEditing.heightReact;
        const [getHr, setHr] = getReactFuncs<number>(hr);
        const rr = this._rectangleEditing.rectangleReact
        const [getRr, setRr] = getReactFuncs<[number, number, number, number] | undefined>(rr);

        {
            const pointsToRectangle = () => {
                const pointsValue = points.value;
                if (!pointsValue) return;
                if (pointsValue.length !== 2) return;

                const { minPos, maxPos, center } = getMinMaxCorner(pointsValue);
                setRr([minPos[0], minPos[1], maxPos[0], maxPos[1]]);
                setHr(pointsValue[0][2]);
            };
            pointsToRectangle();
            this.dispose(points.changed.disposableOn(pointsToRectangle));
        }
    }
}

class RectangleCenterEditingResetting extends Destroyable {
    private _points = this.disposeVar(reactArrayWithUndefined<[number, number, number][]>(undefined));

    private _pointEditing;
    get pointEditing() { return this._pointEditing; }

    constructor(private _rectangleEditing: RectangleEditing) {
        super();
        {
            const points = this._points;
            const hr = this._rectangleEditing.heightReact;
            const [getHr, setHr] = getReactFuncs<number>(hr);
            const rr = this._rectangleEditing.rectangleReact
            const [getRr, setRr] = getReactFuncs<[number, number, number, number] | undefined>(rr);

            const rectangleToPoints = () => {
                const hrv = getHr();
                const rrv = getRr();
                if (!rrv) {
                    this._points.value = undefined;
                    return;
                }

                const [minX, minY, maxX, maxY] = rrv;
                let height = hrv;

                if (points.value && points.value.length > 0) {
                    height = points.value[0][2] ?? 0;
                }
                points.value = [
                    [minX, minY, hrv],
                    [maxX, maxY, hrv],
                ];
            };
            rectangleToPoints();
        }
        this._pointEditing = this.disposeVar(new PointEditing(this._points, this._rectangleEditing.pointEditingReact, this._rectangleEditing.czmViewer));
        const points = this._points;
        const hr = this._rectangleEditing.heightReact;
        const [getHr, setHr] = getReactFuncs<number>(hr);
        const rr = this._rectangleEditing.rectangleReact
        const [getRr, setRr] = getReactFuncs<[number, number, number, number] | undefined>(rr);

        {
            const pointsToRectangle = () => {
                const pointsValue = points.value;
                if (!pointsValue) return;
                if (pointsValue.length !== 2) return;

                const { minPos, maxPos, center } = getMinMaxCorner(pointsValue);
                setRr([minPos[0], minPos[1], maxPos[0], maxPos[1]]);
            };
            pointsToRectangle();
            this.dispose(points.changed.disposableOn(pointsToRectangle));
        }
    }
}

export class RectangleEditing extends Destroyable {
    get heightReact() { return this._heightReact; }
    get rectangleReact() { return this._rectangleReact; }
    get editingReact() { return this._editingReact; }
    get pointEditingReact() { return this._pointEditingReact; }
    get czmViewer() { return this._czmViewer; }
    // get components() { return this._components; }

    constructor(
        private _heightReact: ReactParamsType<number>,
        private _rectangleReact: ReactParamsType<[number, number, number, number] | undefined>,
        private _editingReact: ReactParamsType<boolean>,
        private _pointEditingReact: ReactParamsType<boolean>,
        private _czmViewer: ESCesiumViewer,
        // private _components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
    ) {
        super();
        const [getEditing, setEditing, editingChanged] = getReactFuncs(this._editingReact);
        this.disposeVar(new ObjResettingWithEvent(editingChanged, () => {
            if (!getEditing()) return undefined;
            return new RectanglePositionsEditingResetting(this);
        }));
        const [getPointEditing, setPointEditing, pointEditingChanged] = getReactFuncs(this._pointEditingReact);
        this.disposeVar(new ObjResettingWithEvent(pointEditingChanged, () => {
            if (!getPointEditing()) return undefined;
            return new RectangleCenterEditingResetting(this);
        }));
    }
}
