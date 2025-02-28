import { geoDestination, geoDistance } from "earthsdk3";
import { Destroyable, getReactFuncs, ObjResettingWithEvent, reactArrayWithUndefined, ReactParamsType } from "xbsj-base";
import { PositionsEditing } from "./PositionsEditing";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

class CirclePositionsEditingResetting extends Destroyable {
    private _points = this.disposeVar(reactArrayWithUndefined<[number, number, number][]>(undefined));

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(private _circleEditing: CircleEditing) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing(this._points, false, this._circleEditing.editingReact, this._circleEditing.czmViewer, 2));
        this._sPositionsEditing.moveWithFirstPosition = true;
        const points = this._points;
        const cr = this._circleEditing.centerReact;
        const [getCr, setCr] = getReactFuncs<[number, number, number] | undefined>(cr);
        const rr = this._circleEditing.radiusReact;
        const [getRr, setRr] = getReactFuncs<number>(rr);

        {
            const pointsToCircle = () => {
                const pointsValue = points.value;
                if (!pointsValue) return;
                if (pointsValue.length !== 2) return;

                const center = pointsValue[0];
                setCr(center);

                const radius = geoDistance(pointsValue[0], pointsValue[1]);
                setRr(radius);
            };
            pointsToCircle();
            this.dispose(points.changed.disposableOn(pointsToCircle));
        }
        {
            const points = this._points;
            const cr = this._circleEditing.centerReact;
            const [getCr, setCr] = getReactFuncs<[number, number, number] | undefined>(cr);
            const rr = this._circleEditing.radiusReact;
            const [getRr, setRr] = getReactFuncs<number>(rr);

            const circleToPoints = () => {
                const center = getCr();
                if (!center) {
                    points.value = undefined;
                    return;
                }
                const radius = getRr();
                const des = geoDestination(center, radius, 90);
                if (!des) {
                    points.value = [center];
                } else {
                    points.value = [center, des];
                }
            };
            circleToPoints();
        }
    }
}

export class CircleEditing extends Destroyable {
    get centerReact() { return this._centerReact; }
    get radiusReact() { return this._radiusReact; }
    get editingReact() { return this._editingReact; }
    get czmViewer() { return this._czmViewer; }
    // get components() { return this._components; }

    constructor(
        private _centerReact: ReactParamsType<[number, number, number] | undefined>,
        private _radiusReact: ReactParamsType<number>,
        private _editingReact: ReactParamsType<boolean>,
        private _czmViewer: ESCesiumViewer
        // private _components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
    ) {
        super();
        const [getEditing, setEditing, editingChanged] = getReactFuncs(this._editingReact);
        this.disposeVar(new ObjResettingWithEvent(editingChanged, () => {
            if (!getEditing()) return undefined;
            return new CirclePositionsEditingResetting(this);
        }));
    }
}
