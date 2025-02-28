import { geoDestination, geoDistance, geoHeading } from "earthsdk3";
import { Destroyable, getReactFuncs, ObjResettingWithEvent, reactArrayWithUndefined, ReactParamsType } from "xbsj-base";
import { PositionsEditing } from "./PositionsEditing";
import { ESCesiumViewer } from "./../../../../ESCesiumViewer";

class RayPositionsEditingResetting extends Destroyable {
    private _points = this.disposeVar(reactArrayWithUndefined<[number, number, number][]>(undefined));
    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(private _rayEditing: RayEditing) {
        super();
        this._sPositionsEditing = this.disposeVar(new PositionsEditing(this._points, false, this._rayEditing.editingReact, this._rayEditing.components, 2));
        this._sPositionsEditing.moveWithFirstPosition = true;
        const points = this._points;
        const or = this._rayEditing.originReact;
        const [getOr, setOr] = getReactFuncs<[number, number, number]>(or);
        const rr = this._rayEditing.rotationReact;
        const [getRr, setRr] = getReactFuncs<[number, number, number]>(rr);
        const dr = this._rayEditing.distanceReact
        const [getDr, setDr] = getReactFuncs<number>(dr);

        {
            const pointsToCircle = () => {
                const pointsValue = points.value;
                if (!pointsValue) return;
                if (pointsValue.length !== 2) return;

                const origin = pointsValue[0];
                const des = pointsValue[1];

                setOr(origin);

                const heading = geoHeading(origin, des);
                const groundDistance = geoDistance(origin, des);

                if (groundDistance <= 0) {
                    setRr([0, 0, 0]);
                    setDr(0);
                    return;
                }
                const height = des[2] - origin[2];
                const pitch = Math.atan(height / groundDistance) * 180 / Math.PI;
                const distance = Math.sqrt(groundDistance * groundDistance + height * height);
                setRr([heading, pitch, 0]);
                setDr(distance);
            };
            pointsToCircle();
            this.dispose(points.changed.disposableOn(pointsToCircle));
        }
        {
            const origin = getOr();
            if (!origin) {
                points.value = undefined;
                return;
            }
            const rotation = getRr();
            const distance = getDr();
            const groundDistance = distance * Math.cos(rotation[1] * Math.PI / 180);
            const des = geoDestination(origin, groundDistance, rotation[0]);
            if (!des) {
                points.value = [origin];
                return;
            }

            const height = distance * Math.sin(rotation[1] * Math.PI / 180);
            des[2] += height;
            points.value = [origin, des];
        }
    }
}

export class RayEditing extends Destroyable {
    get originReact() { return this._originReact; }
    get rotationReact() { return this._rotationReact; }
    get distanceReact() { return this._distanceReact; }
    get editingReact() { return this._editingReact; }
    get components() { return this._components; }

    constructor(
        private _originReact: ReactParamsType<[number, number, number] | undefined>,
        private _rotationReact: ReactParamsType<[number, number, number]>,
        private _distanceReact: ReactParamsType<number>,
        private _editingReact: ReactParamsType<boolean>,
        private _components: ESCesiumViewer,
        // private _components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
    ) {
        super();
        const [getEditing, setEditing, editingChanged] = getReactFuncs(this._editingReact);
        this.disposeVar(new ObjResettingWithEvent(editingChanged, () => {
            if (!getEditing()) return undefined;
            return new RayPositionsEditingResetting(this);
        }));
    }
}
