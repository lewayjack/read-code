import { ESGeoExtrudedPolygon, getMinMaxCorner } from "earthsdk3";
import { CzmESGeoPolygon } from "../CzmESGeoPolygon";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import * as Cesium from 'cesium';
import { positionsToUniqueCartesians } from "../../../utils";
import { createNextAnimateFrameEvent, ObjResettingWithEvent } from "xbsj-base";

export class CzmESGeoExtrudedPolygon<T extends ESGeoExtrudedPolygon = ESGeoExtrudedPolygon> extends CzmESGeoPolygon<T> {
    static override readonly type = this.register<ESGeoExtrudedPolygon, ESCesiumViewer>("ESCesiumViewer", ESGeoExtrudedPolygon.type, this);

    public entity?: Cesium.Entity

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const entity = this.entity = viewer.entities.add({ polygon: {} });
        //@ts-ignore
        Cesium.Entity.prototype && (entity.ESSceneObjectID = sceneObject.id);
        this.dispose(() => viewer.entities.remove(entity));
        // 动态绘制
        let hierarchy: Cesium.PolygonHierarchy = new Cesium.PolygonHierarchy();
        if (entity.polygon) {
            entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                return hierarchy;
            }, false); //使用回调函数,防止闪烁。
        }
        const updatePosition = () => {
            if (!sceneObject.points) {
                return;
            }
            const cartesians = positionsToUniqueCartesians(sceneObject.points);
            if (cartesians.length < 2) {
                hierarchy = new Cesium.PolygonHierarchy();
                return;
            }
            hierarchy = new Cesium.PolygonHierarchy(cartesians)
        }
        {
            updatePosition();
            this.dispose(sceneObject.pointsChanged.disposableOn(updatePosition));
        }
        {
            const update = () => {
                entity.show = sceneObject.show && !sceneObject.editing;
                if (this.geoPolygon)
                    this.geoPolygon.show = sceneObject.show && !entity.show;
            }
            update();
            const event = this.ad(createNextAnimateFrameEvent(
                sceneObject.editingChanged,
                sceneObject.showChanged,
            ))
            this.ad(event.don(update))
        }
        {
            const update = () => {
                if (entity.polygon) {
                    entity.polygon.perPositionHeight = new Cesium.ConstantProperty(sceneObject.perPositionHeight);
                    updatePosition();
                }
            }
            update();
            this.ad(sceneObject.perPositionHeightChanged.don(update));
        }
        {
            const updateProp = () => {
                if (entity.polygon) {
                    entity.polygon.height = new Cesium.ConstantProperty(sceneObject.height);
                }
            }
            updateProp();
            this.dispose(sceneObject.heightChanged.disposableOn(updateProp));
        }
        {
            const updateProp = () => {
                if (entity.polygon) {
                    entity.polygon.extrudedHeight = new Cesium.ConstantProperty(sceneObject.extrudedHeight);
                }
            }
            updateProp();
            this.dispose(sceneObject.extrudedHeightChanged.disposableOn(updateProp));
        }
        {
            const updateProp = () => {
                const ColorMaterial = Cesium.Color.fromCartesian4(
                    Cesium.Cartesian4.fromArray(sceneObject.fillColor)
                )
                if (entity.polygon)
                    //@ts-ignore
                    entity.polygon.material = ColorMaterial;
            }
            updateProp();
            this.dispose(sceneObject.fillColorChanged.disposableOn(updateProp));
        }
        const objResetting = this.disposeVar(new ObjResettingWithEvent(sceneObject.allowPickingChanged, () => {
            if (sceneObject.allowPicking) return undefined;
            return new ESCesiumViewer.ObjectsToExcludeWrapper(czmViewer, entity);
        }));
    }
    public getMinAndMaxheight() {
        const { sceneObject } = this;
        if (sceneObject.points) {
            const { minPos, maxPos } = getMinMaxCorner(sceneObject.points);
            return [minPos[2], maxPos[2]]
        }
        return [0, 0]
    }
}