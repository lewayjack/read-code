import { createProcessingFromAsyncFunc, Destroyable, ObjResettingWithEvent, react } from "xbsj-base";
import { NativeTilesetReadyResetting } from "./NativeTilesetReadyResetting";
import { ESJResource } from "earthsdk3";
import { Czm3DTiles } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createCzm3DTiles } from "./createCzm3DTiles";
import * as Cesium from 'cesium';

export class NativeTilesetResetting extends Destroyable {
    get url() { return this._url; }
    get czm3DTiles() { return this._czm3DTiles; }
    get czmViewer() { return this.czm3DTiles.czmViewer; }

    private _tileset = this.disposeVar(react<Cesium.Cesium3DTileset | undefined>(undefined));
    get tileset() { return this._tileset.value; }
    set tileset(value: Cesium.Cesium3DTileset | undefined) { this._tileset.value = value; }
    get tilesetChanged() { return this._tileset.changed; }

    private _readyResetting;
    get readyResetting() { return this._readyResetting; }

    constructor(
        private _url: string | ESJResource,
        private _czm3DTiles: Czm3DTiles,
        private _czmNativeViewer: Cesium.Viewer,
        private _czmViewer: ESCesiumViewer
    ) {
        super();
        this._readyResetting = this.disposeVar(new ObjResettingWithEvent(this.tilesetChanged, () => {
            if (!this.tileset) return undefined;
            return new NativeTilesetReadyResetting(this.tileset, this.czm3DTiles, this._czmNativeViewer, this._czmViewer);
        }));
        if (!this.url) throw new Error(`!url`);

        const customShader = this.czm3DTiles.customShaderInstance?.customShader;

        const processing = this.disposeVar(createProcessingFromAsyncFunc(async (cancelsManager) => {
            const tileset = await cancelsManager.promise(createCzm3DTiles(this.czm3DTiles, this.url, customShader));
            if (!tileset) return;

            // 创建完成需要做的更新操作
            tileset.style = this.czm3DTiles.style;
            tileset.foveatedInterpolationCallback = this.czm3DTiles.foveatedInterpolationCallback;
            // updateModelMatrix();
            this._czmNativeViewer.scene.primitives.add(tileset);
            this.dispose(() => this._czmNativeViewer.scene.primitives.remove(tileset));
            // await cancelsManager.promise(tileset.readyPromise);
            this._tileset.value = tileset;
            this.czm3DTiles.notifyCzmTilesetReady(tileset, this.czm3DTiles);
        }));
        processing.start();
    }
}
