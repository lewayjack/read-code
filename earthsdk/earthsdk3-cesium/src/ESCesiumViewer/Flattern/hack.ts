//@ts-nocheck
import * as Cesium from 'cesium';
import FlattenedPipelineStage from './FlattenedPipelineStage';

export function hackModel() {
    Object.defineProperties(Cesium.Model.prototype, {
        xbsjFlattened: {
            get: function (): boolean {
                return this._xbsjFlattened ?? false;
            },
            set: function (value: boolean) {
                if (value !== this._xbsjFlattened) {
                    this.resetDrawCommands();
                }
                this._xbsjFlattened = value;
            },
        },
        xbsjElevationMatrix: {
            get: function (): Cesium.Matrix4 | undefined{
                return this._xbsjElevationMatrix;
            },
            set: function (value: Cesium.Matrix4 | undefined) {
                if (value !== this._xbsjElevationMatrix) {
                    this.resetDrawCommands();
                }
                this._xbsjElevationMatrix = value;
                this._xbsjElevationMatrixInv = this._xbsjElevationMatrix && Cesium.Matrix4.inverseTransformation(this._xbsjElevationMatrix, new Cesium.Matrix4());
            }
        },
        xbsjElevationMatrixInv: {
            get: function (): Cesium.Matrix4 | undefined {
                return this._xbsjElevationMatrixInv;
            },
        },
        xbsjFlattenedBound: {
            get: function (): Cesium.Cartesian4 | undefined {
                return this._xbsjFlattenedBound;
            },
            set: function (value: Cesium.Cartesian4 | undefined) {
                if (value !== this._xbsjFlattenedBound) {
                    this.resetDrawCommands();
                }
                this._xbsjFlattenedBound = value;
            },
        },
        xbsjGetFlattenedTextureFunc: {
            get: function (): undefined | (() => Cesium.Texture | undefined) {
                return this._xbsjGetFlattenedTextureFunc;
            },
            set: function (value: undefined | (() => Cesium.Cartesian4 | undefined)) {
                if (value !== this._xbsjGetFlattenedTextureFunc) {
                    this.resetDrawCommands();
                }
                this._xbsjGetFlattenedTextureFunc = value;
            },
        },
    });
}

export function hackCesium3DTileset() {
    Object.defineProperties(Cesium.Cesium3DTileset.prototype, {
        xbsjFlattened: {
            get: function (): boolean {
                return this._xbsjFlattened ?? false;
            },
            set: function (value: boolean) {
                this._xbsjFlattened = value;
            },
        },
        xbsjElevationMatrix: {
            get: function (): Cesium.Matrix4 | undefined {
                return this._xbsjElevationMatrix;
            },
            set: function (value: Cesium.Matrix4 | undefined) {
                this._xbsjElevationMatrix = value;
            }
        },
        xbsjFlattenedBound: {
            get: function (): Cesium.Cartesian4 | undefined {
                return this._xbsjFlattenedBound;
            },
            set: function (value: Cesium.Cartesian4 | undefined) {
                this._xbsjFlattenedBound = value;
            },
        },
        xbsjGetFlattenedTextureFunc: {
            get: function (): undefined | (() => Cesium.Texture | undefined) {
                return this._xbsjGetFlattenedTextureFunc;
            },
            set: function (value: undefined | (() => Cesium.Cartesian4 | undefined)) {
                this._xbsjGetFlattenedTextureFunc = value;
            },
        },
    });
}

export function hackCzmModel3DTileContent() {
    // @ts-ignore
    const originFunc = Cesium.Model3DTileContent.prototype.update;
    // @ts-ignore
    Cesium.Model3DTileContent.prototype.update = function (tileset, frameState, ...params) {
        const model = this._model;
        model.xbsjFlattened = tileset.xbsjFlattened;
        model.xbsjElevationMatrix = tileset.xbsjElevationMatrix;
        model.xbsjFlattenedBound = tileset.xbsjFlattenedBound;
        model.xbsjGetFlattenedTextureFunc = tileset.xbsjGetFlattenedTextureFunc;
        const result = originFunc.call(this, tileset, frameState, ...params);
        return result;
    }
}

export function hackModelSceneGraph() {
    // @ts-ignore
    const originFunc = Cesium.ModelSceneGraph.prototype.configurePipeline;
    // @ts-ignore
    Cesium.ModelSceneGraph.prototype.configurePipeline = function (frameState, ...parmas) {
        const result = originFunc.call(this, frameState, ...parmas);

        const model = this._model;
        const modelPipelineStages = this.modelPipelineStages;

        if (!!model.xbsjFlattened) {
            modelPipelineStages.push(FlattenedPipelineStage);
        }

        return result;
    }
}

hackModel();
hackCesium3DTileset();
hackCzmModel3DTileContent();
hackModelSceneGraph();
