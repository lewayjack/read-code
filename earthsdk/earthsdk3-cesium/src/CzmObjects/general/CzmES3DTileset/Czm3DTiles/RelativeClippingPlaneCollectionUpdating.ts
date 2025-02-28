import { Destroyable } from "xbsj-base";
import { Czm3DTiles } from ".";
import { createClippingPlaneCollection, setClippingPlaneCollection } from "../../../../utils";
import * as Cesium from 'cesium';

export class RelativeClippingPlaneCollectionUpdating extends Destroyable {
    get tileset() { return this._tileset; }
    get czm3DTiles() { return this._czm3DTiles; }

    constructor(private _tileset: Cesium.Cesium3DTileset, private _czm3DTiles: Czm3DTiles) {
        super();

        const { tileset, czm3DTiles: sceneObject } = this;
        {
            const update = () => {
                // Cesium有一个特别恶劣的bug，就是clippingPlanes如果已经有了，再设置就有可能崩溃！所以这里要处理以下，一旦有了，那么就只能更新，不能销毁重建！
                if (!tileset.clippingPlanes) {
                    // @ts-ignore
                    tileset.clippingPlanes = createClippingPlaneCollection(sceneObject.clippingPlanes ?? { enabled: false });
                    return;
                }
                setClippingPlaneCollection(tileset.clippingPlanes, sceneObject.clippingPlanes);
            };
            update();
            this.dispose(sceneObject.clippingPlanesChanged.disposableOn(update));
        }
    }
}
