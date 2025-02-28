import { GeoCoordinatesEditorAndPicker } from "../../../../CzmObjects";
import { PositionEditingConfigType } from "../../../../ESJTypesCzm";
import { bind, Destroyable, getReactFuncs, ObjResettingWithEvent, ObservableSet, react, ReactParamsType } from "xbsj-base";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { defaultPositionEditingConfig } from "./Config/defaultPositionEditingConfig";

export class PositionEditing extends Destroyable {
    static defaultConfig = defaultPositionEditingConfig;

    // 注意这里用的是react，不是reactJson，意思就是一个配置信息可以配置多个不同的PositionEditing
    private _config = this.disposeVar(react<PositionEditingConfigType>(PositionEditing.defaultConfig));
    get config() { return this._config.value; }
    set config(value: PositionEditingConfigType) { this._config.value = value; }
    get configChanged() { return this._config.changed; }

    private _editingRef = this.disposeVar(react(false));
    get editingRef() { return this._editingRef; }

    get picking() { return this._geoCoordinatesEditorAndPicker?.picking; }
    get pickingChanged() { return this._geoCoordinatesEditorAndPicker?.pickingChanged; }

    private _geoCoordinatesEditorAndPicker: GeoCoordinatesEditorAndPicker | undefined;
    get geoCoordinatesEditorAndPicker() { return this._geoCoordinatesEditorAndPicker; }

    constructor(
        positionReactParam: ReactParamsType<[number, number, number] | undefined>,
        positionEditing: ReactParamsType<boolean> | undefined,
        // components: { add: (sceneObject: ObservableSet<ESSceneObject> | ESViewer) => void, delete: (sceneObject: ObservableSet<ESSceneObject> | ESViewer) => void },
        private _czmViewer: ESCesiumViewer
    ) {
        super();
        const [getPosition, setPosition, positionChanged] = getReactFuncs<[number, number, number] | undefined>(positionReactParam);

        const positionEditingObj = this;
        class EditorAndPickerWrapper extends Destroyable {
            constructor() {
                super();
                positionEditingObj._geoCoordinatesEditorAndPicker = this.disposeVar(new GeoCoordinatesEditorAndPicker(positionEditingObj._czmViewer));
                const geoCoordinatesEditorAndPicker = positionEditingObj._geoCoordinatesEditorAndPicker;
                geoCoordinatesEditorAndPicker.position = undefined;
                geoCoordinatesEditorAndPicker.enabled = false;
                geoCoordinatesEditorAndPicker.position = getPosition();
                this.dispose(positionChanged.disposableOn(() => geoCoordinatesEditorAndPicker && (geoCoordinatesEditorAndPicker.position = getPosition())));
                this.dispose(geoCoordinatesEditorAndPicker.positionChanged.disposableOn(() => setPosition(geoCoordinatesEditorAndPicker?.position)));
                this.dispose(bind([geoCoordinatesEditorAndPicker, 'enabled'], positionEditingObj.editingRef));

                {
                    const update = () => {
                        const { config } = positionEditingObj;
                        const ge = geoCoordinatesEditorAndPicker.editor;
                        const ce = config.editor;
                        if (ce) {
                            (ce.showCoordinates !== undefined) && (ge.showCoordinates = ce.showCoordinates);
                            (ce.showCircle !== undefined) && (ge.showCircle = ce.showCircle);
                            (ce.disableX !== undefined) && (ge.disableX = ce.disableX);
                            (ce.disableY !== undefined) && (ge.disableY = ce.disableY);
                            (ce.disableXY !== undefined) && (ge.disableXY = ce.disableXY);
                            (ce.disableZ !== undefined) && (ge.disableZ = ce.disableZ);
                            (ce.disableZAxis !== undefined) && (ge.disableZAxis = ce.disableZAxis);
                        }
                        const gp = geoCoordinatesEditorAndPicker.picker;
                        const cp = config.picker;
                        if (cp) {
                            (cp.clickEnabled !== undefined) && (gp.clickEnabled = cp.clickEnabled);
                            (cp.dbClickEnabled !== undefined) && (gp.dbClickEnabled = cp.dbClickEnabled);
                        }
                        (config.noModifingAfterAdding !== undefined) && (geoCoordinatesEditorAndPicker.noModifingAfterAdding = config.noModifingAfterAdding);
                        (config.hideCursorInfo !== undefined) && (geoCoordinatesEditorAndPicker.hideCursorInfo = config.hideCursorInfo); // 暂时没用上
                    };
                    update();
                    this.dispose(positionEditingObj.configChanged.disposableOn(update));
                }
            }
        }

        this.disposeVar(new ObjResettingWithEvent(this.editingRef.changed, () => {
            if (!this.editingRef.value) {
                return undefined;
            }
            return new EditorAndPickerWrapper();
        }));

        if (positionEditing) {
            this.dispose(bind(this.editingRef, positionEditing));
        }
    }
}
