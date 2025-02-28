import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, Destroyable, getReactFuncs, Listener, ObjResettingWithEvent, react, ReactParamsType, track } from "xbsj-base";
import { GeoPolylineEditor } from "../GeoPolylineEditor";
import { defaultPositionsEditingConfig } from "./Config/defaultPositionsEditingConfig";
import { PositionsEditingConfigType } from "../../../../ESJTypesCzm";

class GeoPolylineEditorWrapper extends Destroyable {
    private _geoPolylineEditor;
    get geoPolylineEditor() { return this._geoPolylineEditor; }

    constructor(
        positionsEditing: PositionsEditing,
        positionsReactParams: ReactParamsType<[number, number, number][] | undefined>,
        loopReactParams: ReactParamsType<boolean | undefined> | boolean | undefined,
        czmViewer: ESCesiumViewer,
        // components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
        maxPointsNum?: number,
    ) {
        super();
        this._geoPolylineEditor = this.disposeVar(new GeoPolylineEditor(czmViewer));
        const { geoPolylineEditor } = this;
        // components.add(geoPolylineEditor)
        // this.dispose(() => components.delete(geoPolylineEditor));

        geoPolylineEditor.maxPointsNum = maxPointsNum as number;

        const [getPositions, setPositions, positionsChanged] = getReactFuncs<[number, number, number][] | undefined>(positionsReactParams);

        geoPolylineEditor.resetPositions(getPositions());
        geoPolylineEditor.dispose(positionsChanged.disposableOn(() => geoPolylineEditor && !(geoPolylineEditor.enabled) && geoPolylineEditor.resetPositions(getPositions())));
        geoPolylineEditor.dispose(geoPolylineEditor.positionsChanged.disposableOn(() => setPositions(geoPolylineEditor?.getPositions())));

        if (loopReactParams) {
            if (typeof loopReactParams === 'boolean') {
                geoPolylineEditor.loop = loopReactParams;
            } else {
                // } else if (loopReactParams instanceof ReactiveVariable) {
                geoPolylineEditor.dispose(bind([geoPolylineEditor, 'loop'], loopReactParams));
            }
        }

        geoPolylineEditor.enabled = true;

        {
            const update = () => {
                const { config } = positionsEditing;
                const { geoCoordinatesEditor: ge } = geoPolylineEditor.inner.editingProcessing;
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
                const { geoCoordinatesPicker: gp } = geoPolylineEditor.inner.editingProcessing;
                const cp = config.picker;
                if (cp) {
                    (cp.clickEnabled !== undefined) && (gp.clickEnabled = cp.clickEnabled);
                    (cp.dbClickEnabled !== undefined) && (gp.dbClickEnabled = cp.dbClickEnabled);
                    // (cp.clickFilterFunc !== undefined) && (gp.clickFilterFunc = cp.clickFilterFunc);
                    // (cp.dbClickFilterFunc !== undefined) && (gp.dbClickFilterFunc = cp.dbClickFilterFunc);
                }

                (config.noModifingAfterAdding !== undefined) && (geoPolylineEditor.noModifingAfterAdding = config.noModifingAfterAdding);
                (config.hideCursorInfo !== undefined) && (geoPolylineEditor.hideCursorInfo = config.hideCursorInfo);
            };
            update();
            this.dispose(positionsEditing.configChanged.disposableOn(update));
        }

        this.dispose(track([geoPolylineEditor, 'moveWithFirstPosition'], [positionsEditing, 'moveWithFirstPosition']));
    }
}

export class PositionsEditing extends Destroyable {
    private _resetting: ObjResettingWithEvent<GeoPolylineEditorWrapper, Listener<[[number, number, number][] | undefined]>>;
    get resetting() { return this._resetting; }

    static defaultConfig = defaultPositionsEditingConfig;

    // 注意这里用的是react，不是reactJson，意思就是一个配置信息可以配置多个不同的PositionEditing
    private _config = this.disposeVar(react<PositionsEditingConfigType>(PositionsEditing.defaultConfig));
    get config() { return this._config.value; }
    set config(value: PositionsEditingConfigType) { this._config.value = value; }
    get configChanged() { return this._config.changed; }

    private _moveWithFirstPosition = this.disposeVar(react<boolean>(false));
    get moveWithFirstPosition() { return this._moveWithFirstPosition.value; }
    set moveWithFirstPosition(value: boolean) { this._moveWithFirstPosition.value = value; }
    get moveWithFirstPositionChanged() { return this._moveWithFirstPosition.changed; }

    constructor(
        positionsReactParams: ReactParamsType<[number, number, number][] | undefined>,
        loopReactParams: ReactParamsType<boolean | undefined> | boolean | undefined,
        positionsEditing: ReactParamsType<boolean | undefined> | ReactParamsType<boolean>,
        viewer: ESCesiumViewer,
        // components: { add: (sceneObject: SceneObject) => void, delete: (sceneObject: SceneObject) => void },
        maxPointsNum?: number,
        defaultPositionsEditing: boolean = false,
    ) {
        super();
        const [getPositionsEditing, setPositionsEditing, positionsEditingChanged] = getReactFuncs<boolean | undefined>(positionsEditing);
        this._resetting = this.disposeVar(new ObjResettingWithEvent(positionsEditingChanged, () => {
            if (getPositionsEditing() ?? defaultPositionsEditing) {
                const wrapper = new GeoPolylineEditorWrapper(this, positionsReactParams, loopReactParams, viewer, maxPointsNum);
                wrapper.dispose(wrapper.geoPolylineEditor.enabledChanged.disposableOnce(enabled => {
                    if (!(enabled)) {
                        setPositionsEditing(false);
                    }
                }));

                return wrapper;
            } else {
                return undefined;
            }
        }));
    }
}