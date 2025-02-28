import { ESSceneObject, ESViewer } from "earthsdk3";
import { Destroyable, getReactFuncs, react, ReactParamsType } from "xbsj-base";
import { PositionEditing } from "./PositionEditing";
import { RotationEditing } from "./RotationEditing";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export type PrsEditingMode = 'Position' | 'Rotation' | 'None';
export class PrsEditing extends Destroyable {
    private _editingMode = this.disposeVar(react<PrsEditingMode>('None'));
    private _editingChanging = false;
    private _editingModeInit = (() => {
        this._editingMode.toChangeFunc = () => (this._editingChanging = true, true);
        this._editingMode.changed.afterCallback = () => this._editingChanging = false;
    })();
    get editingMode() { return this._editingMode.value; }
    set editingMode(value: PrsEditingMode) { this._editingMode.value = value; }
    get editingModeChanged() { return this._editingMode.changed; }

    switch() {
        if (this.editingMode === 'Position') {
            this.editingMode = 'Rotation';
        } else if (this.editingMode === 'Rotation') {
            this.editingMode = 'Position';
        }
    }

    private _positionEditingReact = this.disposeVar(react(false));
    private _rotationEditingReact = this.disposeVar(react(false));

    // private _componentsOrViewer = this._sceneObjectOrViewer instanceof ESCesiumViewer ? this._sceneObjectOrViewer : this._sceneObjectOrViewer.components;

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _sRotationEditing;
    get sRotationEditing() { return this._sRotationEditing; }

    constructor(
        private _positionReactParam: ReactParamsType<[number, number, number] | undefined>,
        private _rotationReactParam: ReactParamsType<[number, number, number] | undefined>,
        private _prsEditingReact: ReactParamsType<boolean> | undefined,
        private _sceneObjectOrViewer: ESCesiumViewer,
        // private _components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
        private _options?: {
            rotation?: {
                initialRotation?: [number, number, number],
                showHelper?: boolean,
            },
        },
    ) {
        super();
        this._sPositionEditing = this.disposeVar(new PositionEditing(this._positionReactParam, this._positionEditingReact, this._sceneObjectOrViewer));
        this._sRotationEditing = this.disposeVar(new RotationEditing(this._positionReactParam, this._rotationReactParam, this._rotationEditingReact, this._sceneObjectOrViewer, this._options?.rotation));
        {
            const update = () => {
                if (this.editingMode === 'None') {
                    this._positionEditingReact.value = false;
                    this._rotationEditingReact.value = false;
                } else if (this.editingMode === 'Position') {
                    this._positionEditingReact.value = true;
                    this._rotationEditingReact.value = false;
                } else if (this.editingMode === 'Rotation') {
                    this._positionEditingReact.value = false;
                    this._rotationEditingReact.value = true;
                }
            };
            update();
            this.dispose(this.editingModeChanged.disposableOn(update));
        }

        if (this._prsEditingReact) {
            const [getEditing, setEditing, editingChanged] = getReactFuncs<boolean>(this._prsEditingReact);
            {
                const update = () => {
                    this.editingMode = getEditing() ? 'Position' : 'None';
                };
                update();
                this.dispose(editingChanged.disposableOn(update));
            }
            {
                const update = () => {
                    if (this.editingMode === 'None') {
                        setEditing(false);
                    } else {
                        setEditing(true);
                    }
                };
                this.dispose(this.editingModeChanged.disposableOn(update));
            }
        }

        {
            const update = () => {
                // 当前是editingMode主动修改的话，不做操作；
                // 除非是positionEditing内部主动触发的操作，才会走以下代码！
                if (this._editingChanging) return;
                if (this._positionEditingReact.value) return;
                this.editingMode = 'None';
            };
            this.dispose(this._positionEditingReact.changed.disposableOn(update));
        }

        {
            const update = () => {
                if (this._editingChanging) return;
                if (this._rotationEditingReact.value) return;
                this.editingMode = 'None';
            };
            this.dispose(this._rotationEditingReact.changed.disposableOn(update));
        }

        const rightClickInitFunc = (viewer: ESCesiumViewer) => {
            const _this = this;
            const d = new Destroyable();
            d.dispose(viewer.clickEvent.disposableOn(pointerEvent => {
                if (pointerEvent.pointerEvent?.buttons !== 2) return;
                if (_this.editingMode === 'None') return;
                _this.switch();
            }));
            return d;
        }
        if (this._sceneObjectOrViewer instanceof ESCesiumViewer) {
            rightClickInitFunc(this._sceneObjectOrViewer)
        } else {
            // this._sceneObjectOrViewer.registerAttachedObjectForContainer(rightClickInitFunc);
        }

        this.dispose(() => {
            this.editingMode = 'None';
        });
    }
}
