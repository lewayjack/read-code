import * as Cesium from 'cesium';
export function fixCesium3DTile() {
    //重写Cesium.Cesium3DTile.prototype.updateTransform
    //createBoundingVolume计算包围盒时，包围盒类型是region,通过修改modelMatrix后，恢复默认包围盒后，会出错
    //@ts-ignore
    Cesium.Cesium3DTile.prototype.updateTransform = function (parentTransform: Cesium.Matrix4, frameState: Cesium.FrameState) {
        parentTransform = Cesium.defaultValue(parentTransform, Cesium.Matrix4.IDENTITY);
        const computedTransform = Cesium.Matrix4.multiplyTransformation(parentTransform, this.transform, new Cesium.Matrix4());
        const transformChanged = !Cesium.Matrix4.equals(computedTransform, this.computedTransform);
        const exaggerationChanged = Cesium.defined(frameState) &&
            //@ts-ignore
            (this._verticalExaggeration !== frameState.verticalExaggeration || this._verticalExaggerationRelativeHeight !== frameState.verticalExaggerationRelativeHeight);

        if (!transformChanged && !exaggerationChanged) return;
        if (transformChanged) Cesium.Matrix4.clone(computedTransform, this.computedTransform);
        if (exaggerationChanged) {
            //@ts-ignore
            this._verticalExaggeration = frameState.verticalExaggeration;
            //@ts-ignore
            this._verticalExaggerationRelativeHeight = frameState.verticalExaggerationRelativeHeight;
        }

        // Update the bounding volumes
        //@ts-ignore
        const header = this._header;
        //@ts-ignore
        const contentHeader = this._contentHeader;
        //@ts-ignore
        this._boundingVolume = this.createBoundingVolume(header.boundingVolume, this.computedTransform);
        //@ts-ignore
        if (Cesium.defined(this._contentBoundingVolume)) {
            //@ts-ignore
            this._contentBoundingVolume = this.createBoundingVolume(contentHeader.boundingVolume, this.computedTransform);
        }
        //@ts-ignore
        if (Cesium.defined(this._viewerRequestVolume)) {
            //@ts-ignore
            this._viewerRequestVolume = this.createBoundingVolume(header.viewerRequestVolume, this.computedTransform);
        }
        //@ts-ignore
        this.updateGeometricErrorScale();
        // Destroy the debug bounding volumes. They will be generated fresh.
        //@ts-ignore
        this._debugBoundingVolume = this._debugBoundingVolume && this._debugBoundingVolume.destroy();
        //@ts-ignore
        this._debugContentBoundingVolume = this._debugContentBoundingVolume && this._debugContentBoundingVolume.destroy();
        //@ts-ignore
        this._debugViewerRequestVolume = this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
    }
}
