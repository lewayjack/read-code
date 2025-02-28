import { Destroyable, getReactFuncs, react, reactArrayWithUndefined, ReactParamsType } from "xbsj-base";
import { PositionEditing } from "./PositionEditing";
import { getMinMaxCorner } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export class PointEditing extends Destroyable {
    private _point = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get point() { return this._point.value; }
    set point(value: [number, number, number] | undefined) { this._point.value = value; }
    get pointChanged() { return this._point.value; }
    get pointReact() { return this._point; }

    private _innerPointEditing = this.disposeVar(react(false));
    get innerPointEditing() { return this._innerPointEditing; }

    private _sPositionsEditing: PositionEditing;
    get sPositionEditing() { return this._sPositionsEditing; }

    constructor(
        positionsReactParams: ReactParamsType<[number, number, number][] | undefined>,
        pointEditing: ReactParamsType<boolean | undefined> | ReactParamsType<boolean>,
        private _czmViewer: ESCesiumViewer
        // private _components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void }
    ) {
        super();

        const [getPositions, setPositions] = getReactFuncs<[number, number, number][] | undefined>(positionsReactParams);
        const [getPointEditing, setPointEditing, pointEditingChanged] = getReactFuncs<boolean | undefined>(pointEditing);

        const point = this._point;

        this.dispose(point.changed.disposableOn((val, oldVal) => {
            // 初始赋值不进行跟随
            if (oldVal === undefined) {
                return;
            }
            // 设置undefined时，表示不需要跟踪
            if (val === undefined) {
                return;
            }
            // 不存在positions时无需设置
            const positions = getPositions();
            if (!positions) {
                return;
            }
            const dl = val[0] - oldVal[0];
            const db = val[1] - oldVal[1];
            const dh = val[2] - oldVal[2];

            setPositions(positions.map(([l, b, h]) => [l + dl, b + db, h + dh] as [number, number, number]));
        }));

        // const pointEditingRef = this.disposeVar(createPositionEditingRefForComponent(point, components));
        const innerPointEditingRef = this._innerPointEditing;
        {
            const update = () => {
                if (getPointEditing() ?? false) {
                    const positions = getPositions();
                    if (!positions) {
                        setPointEditing(false);
                        return;
                    }
                    const { center } = getMinMaxCorner(positions);
                    point.value = center;
                    innerPointEditingRef.value = true;
                } else {
                    point.value = undefined;
                    innerPointEditingRef.value = false;
                }
            };
            update();
            this.dispose(pointEditingChanged.disposableOn(update));
        }

        {
            const update = () => {
                setPointEditing(innerPointEditingRef.value);
            };
            // update();
            this.dispose(innerPointEditingRef.changed.disposableOn(update));
            innerPointEditingRef.value = getPointEditing() ?? false;
        }

        this._sPositionsEditing = this.disposeVar(new PositionEditing(this._point, this._innerPointEditing, this._czmViewer));
    }
}
