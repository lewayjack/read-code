import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, getReactFuncs, ObjResettingWithEvent, react, reactArrayWithUndefined, ReactParamsType, Vector } from "xbsj-base";
import { PrsEditing } from "./EditingImpl";

export type CzmESPrsEditingOptionsType = {
    rotation?: {
        initialRotation?: [number, number, number];
        showHelper?: boolean;
    };
}

export class CzmESPrsEditing extends Destroyable {
    private _enabled = this.disposeVar(react<boolean>(false));
    get enabled() { return this._enabled.value; }
    set enabled(value: boolean) { this._enabled.value = value; }
    get enabledChanged() { return this._enabled.changed; }

    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    private _esOptions: CzmESPrsEditingOptionsType;
    get esOptions() { return this._esOptions; }

    private _prsEditingSetting;
    get prsEditing() { return this._prsEditingSetting.obj; }

    constructor(
        private _czmViewer: ESCesiumViewer,
        private _editing: ReactParamsType<boolean> | undefined,
        private _positionReactParam: ReactParamsType<[number, number, number] | undefined>,
        private _rotationReactParam: ReactParamsType<[number, number, number] | undefined>,
        private _options?: {
            rotation?: {
                initialRotation?: [number, number, number],
                showHelper?: boolean,
            },
        },
    ) {
        super();
        this._esOptions = {
            ...(this._options ?? {}),
            rotation: {
                initialRotation: this._options?.rotation?.initialRotation ?? [90, 0, 0],
                showHelper: this._options?.rotation?.showHelper ?? false,
            }
        }
        const [getPosition, setPosition, positionChanged] = getReactFuncs<[number, number, number]>(this._positionReactParam);
        this._prsEditingSetting = this.disposeVar(new ObjResettingWithEvent(this.enabledChanged, () => {
            if (!this.enabled) return undefined;
            return new PrsEditing(this._innerPositionReact, this._rotationReactParam, this._editing, this._czmViewer, this._esOptions);
        }));

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