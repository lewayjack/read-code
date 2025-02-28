import * as Cesium from 'cesium';
import { NativePrimitive } from './NativePrimitive';
import { Destroyable } from 'xbsj-base';
import { computeCzmModelMatrix } from '../../../../utils';

export class ModelMatrixUpdating extends Destroyable {
    get nativePrimitive() { return this._nativePrimitive; }
    get czmCzmModelPrimitive() { return this.nativePrimitive.czmCzmModelPrimitive; }
    get sceneObject() { return this.czmCzmModelPrimitive; }
    get sceneScaleFromPixelSize() { return this.czmCzmModelPrimitive.sceneScaleFromPixelSize; }
    get viewer() { return this.czmCzmModelPrimitive.czmViewer.viewer as Cesium.Viewer; }
    get finalShow() { return this.czmCzmModelPrimitive.finalShow; }
    get primitive() { return this.nativePrimitive.primitive; }

    // constructor(private _primitive: Cesium.Model, private _czmCzmModelPrimitive: CzmCzmModelPrimitive) {
    constructor(private _nativePrimitive: NativePrimitive) {
        super();

        const { sceneObject, sceneScaleFromPixelSize, viewer, primitive } = this;

        const updateModelMatrixAndShow = () => {
            // if (!(sceneObject.show ?? true)) {
            if (!this.finalShow) {
                primitive.show = false;
                return;
            }
            primitive.show = true;

            const modelMatrix = computeCzmModelMatrix({
                localScale: sceneObject.localScale,
                initialRotation: 'xForwardzUp',
                localRotation: sceneObject.localRotation,
                localPosition: sceneObject.localPosition,
                localModelMatrix: sceneObject.localModelMatrix,
                sceneScaleFromPixelSize: sceneScaleFromPixelSize.value,
                scale: sceneObject.scale,
                rotation: sceneObject.rotation,
                position: sceneObject.position,
                modelMatrix: sceneObject.modelMatrix,
            });

            if (!modelMatrix) {
                console.warn(`computeCzmModelMatrix error.`);
                return;
            }

            primitive.modelMatrix = modelMatrix;
        };

        {
            let modelMatrixDirty = true;
            this.dispose(sceneObject.showChanged.disposableOn(() => modelMatrixDirty = true));
            // this.dispose(pickingReact.changed.disposableOn(() => modelMatrixDirty = true)); // TODO 拾取时需要修改modelMatrix？？
            this.dispose(sceneObject.localPositionChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.localRotationChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.localScaleChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.localModelMatrixChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.positionChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.rotationChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.scaleChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneObject.modelMatrixChanged.disposableOn(() => modelMatrixDirty = true));
            this.dispose(sceneScaleFromPixelSize.changed.disposableOn(() => modelMatrixDirty = true));

            updateModelMatrixAndShow();
            this.dispose(viewer.scene.preUpdate.addEventListener(() => {
                if (!modelMatrixDirty) {
                    return;
                }
                if (modelMatrixDirty) {
                    modelMatrixDirty = false;
                }
                updateModelMatrixAndShow();
            }));
        }
    }
}
