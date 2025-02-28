import { createNextAnimateFrameEvent, Destroyable, Event } from "xbsj-base";
import { Czm3DTiles } from ".";
import * as Cesium from 'cesium';
import { createClippingPlaneCollection, setClippingPlaneCollection } from "../../../../utils";

export class AbsoluteClippingPlaneCollectionUpdating extends Destroyable {
    get tileset() { return this._tileset; }
    get czm3DTiles() { return this._czm3DTiles; }

    constructor(private _tileset: Cesium.Cesium3DTileset, private _czm3DTiles: Czm3DTiles, private _updateMatrixEvent: Event) {
        super();
        {
            const update = () => {
                // @ts-ignore
                // const originRootTransform = Cesium.Matrix4.multiply(_tileset.modelMatrix, _tileset._root.transform as Cesium.Matrix4, new Cesium.Matrix4());
                // const originRootTransformInv = Cesium.Matrix4.inverseTransformation(originRootTransform, new Cesium.Matrix4());
                const originRootTransformInv = Cesium.Matrix4.inverseTransformation(_tileset.clippingPlanesOriginMatrix, new Cesium.Matrix4());

                // Cesium有一个特别恶劣的bug，就是clippingPlanes如果已经有了，再设置就有可能崩溃！所以这里要处理以下，一旦有了，那么就只能更新，不能销毁重建！
                if (!_tileset.clippingPlanes) {
                    _tileset.clippingPlanes = createClippingPlaneCollection(_czm3DTiles.clippingPlanes ?? { enabled: false }, originRootTransformInv);
                    return;
                }
                setClippingPlaneCollection(_tileset.clippingPlanes, _czm3DTiles.clippingPlanes, originRootTransformInv);
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                _czm3DTiles.clippingPlanesChanged,
                _czm3DTiles.originRootTransformInvChanged,
                this._updateMatrixEvent
            ));
            this.dispose(event.disposableOn(update));
        }
    }
}
