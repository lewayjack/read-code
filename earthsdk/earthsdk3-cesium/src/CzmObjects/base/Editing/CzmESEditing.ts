import { PositionEditing } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, getReactFuncs, reactArrayWithUndefined, ReactParamsType, Vector } from "xbsj-base";

export class CzmESEditing extends Destroyable {
    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    constructor(
        private _czmViewer: ESCesiumViewer,
        private _editing: ReactParamsType<boolean> | undefined,
        private _positionReactParam: ReactParamsType<[number, number, number] | undefined>
    ) {
        super();
        this._sPositionEditing = this.disposeVar(new PositionEditing(this._innerPositionReact, this._editing, this._czmViewer));
        const [getPosition, setPosition, positionChanged] = getReactFuncs<[number, number, number]>(this._positionReactParam);

        // 为了使编辑生效，需要监听sceneObject的position和_innerPositionReact,
        // 如果是在[0,0,0]点的话，就把_innerPositionReact设置为undefined,就能编辑了
        {
            const updated = () => {
                if (Vector.equals(getPosition(), [0, 0, 0])) {
                    this._innerPositionReact.value = undefined;
                } else {
                    this._innerPositionReact.value = getPosition();
                }
            };
            updated();
            this.dispose(positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (this._innerPositionReact.value == undefined) {
                    setPosition([0, 0, 0]);
                }
                else {
                    setPosition(this._innerPositionReact.value);
                }
            }
            this.dispose(this._innerPositionReact.changed.disposableOn(updated));
        }
    }
}