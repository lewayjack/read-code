import { createNextAnimateFrame, Destroyable } from "xbsj-base";
import * as Cesium from 'cesium';
import { CzmESTerrainLayer } from "../../CzmObjects/general/CzmESTerrainLayer";
const defaultEllipsoidTerrainProvider = new Cesium.EllipsoidTerrainProvider();
export class TerrainManager extends Destroyable {
    private _terrainMap = new Map<CzmESTerrainLayer, () => void>();
    private _nextAnimateFrame = this.dv(createNextAnimateFrame());
    private _makeDirty() { this._nextAnimateFrame.restartIfNotRunning(); }
    private get _changed() { return this._nextAnimateFrame.completeEvent; }

    constructor(private _viewer: Cesium.Viewer) {
        super();
        const viewer = this._viewer;

        this.dispose(this._changed.disposableOn(() => {
            let selectedTerrain: CzmESTerrainLayer | undefined;
            let tempIndex = Number.MIN_SAFE_INTEGER;
            for (let terrain of this._terrainMap.keys()) {
                if ((terrain.sceneObject.show ?? true) && terrain.provider
                    && (terrain.sceneObject.zIndex >= tempIndex)) {
                    if (selectedTerrain) {
                        console.warn(`存在多个terrain，只能显示一个，当前terrian：${selectedTerrain.sceneObject.name}(${selectedTerrain.sceneObject.id}), 即将被替换成${terrain.sceneObject.name}(${terrain.sceneObject.id})`);
                    }
                    tempIndex = terrain.sceneObject.zIndex;
                    selectedTerrain = terrain;
                }
            }
            viewer.scene.terrainProvider = selectedTerrain && selectedTerrain.provider || defaultEllipsoidTerrainProvider;
        }));
    }

    add(terrain: CzmESTerrainLayer) {
        if (this._terrainMap.has(terrain)) {
            console.warn(`this._terrainMap.has(imagery)`);
            return;
        }
        const disposer = new Destroyable();
        disposer.dispose(terrain.providerChanged.disposableOn(() => this._makeDirty()));
        disposer.dispose(terrain.sceneObject.showChanged.disposableOn(() => this._makeDirty()));
        this._terrainMap.set(terrain, () => disposer.destroy());
        this._makeDirty();
        this.d(terrain.sceneObject.zIndexChanged.don(() => {
            this._changed.emit();
        }));
    }

    delete(terrain: CzmESTerrainLayer) {
        if (!this._terrainMap.has(terrain)) {
            console.warn(`!this._imageriesMap.has(imagery)`);
            return;
        }
        const disposeFunc = this._terrainMap.get(terrain);
        if (!disposeFunc) {
            console.error(`!disposeFunc`);
            return;
        }
        disposeFunc();
        this._terrainMap.delete(terrain);
        this._makeDirty();
    }
}