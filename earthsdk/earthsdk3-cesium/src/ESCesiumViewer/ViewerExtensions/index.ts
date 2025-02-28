import { TerrainManager } from "./TerrainManager";
import { LabelManager } from "./LabelManager";
import { ImageriesManager } from "./ImageriesManager";
import { Destroyable, getExtProp, setExtProp } from "xbsj-base";
import * as Cesium from "cesium";
import { PickingManager } from "./PickingManager";
import { CzmPoisContext } from "../../CzmObjects";
import { ESCesiumViewer } from "..";
import { CursorPositionInfo } from "./CursorPositionInfo";

export * from './TerrainManager';
export * from './LabelManager';
export * from './ImageriesManager';
export * from './PickingManager';

export function getViewerExtensions(viewer: Cesium.Viewer) {
    return getExtProp<ViewerExtensions | undefined>(viewer, '_viewerExtensions');
}
export function setViewerExtensions(viewer: Cesium.Viewer, viewerExtensions: ViewerExtensions | undefined) {
    setExtProp(viewer, '_viewerExtensions', viewerExtensions);
}
export class ViewerExtensions extends Destroyable {

    get viewer() { return this._viewer; }

    get czmViewer() { return this._czmViewer; }

    private _imageriesManager: ImageriesManager;
    get imageriesManager() { return this._imageriesManager; }

    private _terrainManager: TerrainManager
    get terrainManager() { return this._terrainManager; }

    private _labelManager: LabelManager;
    get labelManager() { return this._labelManager; }

    private _pickingManager!: PickingManager;
    get pickingManager() { return this._pickingManager; }

    private _poiContext: CzmPoisContext;
    get poiContext() { return this._poiContext; }

    private _cursorPositionInfo: CursorPositionInfo;
    get cursorPositionInfo() { return this._cursorPositionInfo; }

    constructor(protected _viewer: Cesium.Viewer, protected _czmViewer: ESCesiumViewer) {
        super();
        this._imageriesManager = this.dv(new ImageriesManager(this.viewer))
        this._terrainManager = this.dv(new TerrainManager(this.viewer));
        this._labelManager = this.dv(new LabelManager(this.viewer));
        this._poiContext = this.disposeVar(new CzmPoisContext(this._viewer));
        this._cursorPositionInfo = this.disposeVar(new CursorPositionInfo(this._viewer));
        this.ad(_czmViewer.viewerChanged.don(() => {
            this._pickingManager = this.dv(new PickingManager(_czmViewer));
        }))
    }
}
