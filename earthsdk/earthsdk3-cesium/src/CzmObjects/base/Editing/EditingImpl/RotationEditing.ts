import { bind, Destroyable, getReactFuncs, ObjResettingWithEvent, react, ReactParamsType } from "xbsj-base";
import { GeoRotator } from "../RotatorDisplay";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";

export class RotationEditing extends Destroyable {

    private _editingRef = this.disposeVar(react(false));
    get editingRef() { return this._editingRef; }

    private _geoRotator: GeoRotator;
    get geoRotator() { return this._geoRotator; }

    constructor(
        positionReactParam: ReactParamsType<[number, number, number] | undefined>,
        rotationReactParam: ReactParamsType<[number, number, number] | undefined>,
        rotationEditing: ReactParamsType<boolean> | undefined,
        private _czmViewer: ESCesiumViewer,
        // components: { add: (sceneObject: ESSceneObject) => void, delete: (sceneObject: ESSceneObject) => void },
        options?: {
            initialRotation?: [number, number, number],
            showHelper?: boolean,
        },
    ) {
        super();
        const [getPosition, setPosition, positionChanged] = getReactFuncs<[number, number, number] | undefined>(positionReactParam);
        const [getRotation, setRotation, rotationChanged] = getReactFuncs<[number, number, number] | undefined>(rotationReactParam);
        this._geoRotator = this.disposeVar(new GeoRotator(_czmViewer));

        const rotationEditingObj = this;
        class EditorAndPickerWrapper extends Destroyable {
            constructor() {
                super();
                const geoRotator = rotationEditingObj._geoRotator;
                geoRotator.rotation = (options && options.initialRotation) ?? [0, 0, 0];
                geoRotator.showHelper = (options && options.showHelper) ?? true;
                this.dispose(() => {
                    geoRotator.position = undefined;
                    geoRotator.selfRotation = [0, 0, 0];
                    geoRotator.enabled = false;
                });

                {
                    const update = () => geoRotator.position = getPosition();
                    update();
                    this.dispose(positionChanged.disposableOn(update));
                }
                {
                    const update = () => geoRotator.selfRotation = getRotation() ?? [0, 0, 0];
                    update();
                    this.dispose(rotationChanged.disposableOn(update));
                }
                this.dispose(geoRotator.selfRotationChanged.disposableOn(() => setRotation(geoRotator.selfRotation)));
                this.dispose(bind([geoRotator, 'enabled'], rotationEditingObj.editingRef));
            }
        }

        this.disposeVar(new ObjResettingWithEvent(this.editingRef.changed, () => {
            if (!this.editingRef.value) {
                return undefined;
            }
            return new EditorAndPickerWrapper();
        }));

        if (rotationEditing) {
            this.dispose(bind(this.editingRef, rotationEditing));
        }
    }
}
