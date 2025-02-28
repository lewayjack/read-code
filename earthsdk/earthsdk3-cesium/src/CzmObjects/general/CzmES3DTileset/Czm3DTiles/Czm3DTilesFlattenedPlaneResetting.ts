import { ESJNativeNumber16 } from "earthsdk3";
import { createNextAnimateFrameEvent, Destroyable } from "xbsj-base";
import { NativeTilesetReadyResetting } from "./NativeTilesetReadyResetting";
import * as Cesium from 'cesium';
import { CzmFlattenedPlane } from "../../CzmESPolygonFlattenedPlane";

export class Czm3DTilesFlattenedPlaneResetting extends Destroyable {
    get czm3DTiles() { return this._nativeTilesetReadyResetting.czm3DTiles; }
    get tileset() { return this._nativeTilesetReadyResetting.tileset; }
    get czmFlattenedPlane() { return this._czmFlattenedPlane; }

    setFlattened(value: boolean) {
        // @ts-ignore
        this.tileset.xbsjFlattened = value;
    }

    setFlattenedBound(value: [number, number, number, number]) {
        // @ts-ignore
        this.tileset.xbsjFlattenedBound = Cesium.Cartesian4.fromArray(value);
    }

    setElevationMatrix(value: ESJNativeNumber16) {
        // @ts-ignore
        this.tileset.xbsjElevationMatrix = Cesium.Matrix4.fromArray(value);
    }

    constructor(private _nativeTilesetReadyResetting: NativeTilesetReadyResetting, private _czmFlattenedPlane: CzmFlattenedPlane) {
        super();
        const { tileset } = this;

        this.setFlattened(true);
        this.dispose(() => {
            this.setFlattened(false);
        });

        // this.czm3DTiles.customShaderInstanceClass = undefined;

        {
            const update = () => {
                const xbsjElevationMatrix = this._czmFlattenedPlane.finalMatrix ?
                    Cesium.Matrix4.toArray(this._czmFlattenedPlane.finalMatrix) :
                    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                this.setElevationMatrix(xbsjElevationMatrix as ESJNativeNumber16);
            };
            update();
            this.dispose(this._czmFlattenedPlane.finalMatrixChanged.disposableOn(update));
        }

        {
            const update = () => {
                const xbsjFlattenedBound = [...this._czmFlattenedPlane.minSize, ...this._czmFlattenedPlane.maxSize] as [number, number, number, number];
                this.setFlattenedBound(xbsjFlattenedBound);
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(this._czmFlattenedPlane.minSizeChanged, this._czmFlattenedPlane.maxSizeChanged));
            this.dispose(event.disposableOn(update));
        }

        {
            // @ts-ignore
            tileset.xbsjGetFlattenedTextureFunc = () => {
                const { sceneObject } = this._czmFlattenedPlane.czmTextureWithId;
                if (!sceneObject) return undefined;
                // if (!(sceneObject instanceof CzmTexture)) return undefined;
                //@ts-ignore
                const czmTexture = window.czmTexture[sceneObject.id];
                // const czmCzmTexture = this.czm3DTiles.czmViewer.getCzmObject(czmTexture);
                // if (!czmCzmTexture) return undefined;
                // if (!(czmCzmTexture instanceof CzmCzmTexture)) return undefined;
                // if (!czmCzmTexture.texture) return undefined;
                return czmTexture.texture;
            };
            // @ts-ignore
            this.dispose(() => tileset.xbsjGetFlattenedTextureFunc = undefined);
        }

        {
            const update = () => {
                const c = this._czmFlattenedPlane.computedCustomShader;
                this._nativeTilesetReadyResetting.flattenedCustomShader = c && new c(this.czm3DTiles, this.czm3DTiles.czmViewer);
            };
            update();
            this.dispose(this._czmFlattenedPlane.computedCustomShaderChanged.disposableOn(update));
            this.dispose(() => this._nativeTilesetReadyResetting.flattenedCustomShader = undefined);
        }
    }
}
