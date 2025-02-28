import * as Cesium from 'cesium';
import { ESJVector3D } from "earthsdk3";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, reactArrayWithUndefined, SceneObjectKey, UniteChanged } from "xbsj-base";
import { ESCesiumViewer, getViewerExtensions } from "../../../../ESCesiumViewer";
import { CzmPointPrimitiveType, czmPropMaps } from "../../../../ESJTypesCzm";
import { computeCzmModelMatrix, flyTo, NativeNumber16Type, positionFromCartesian, positionsToUniqueCartesians, positionToCartesian, toColor, toDistanceDisplayCondition, toNearFarScalar } from "../../../../utils";

export class CzmPointPrimitiveCollection extends Destroyable {
    pointPrimitives?: Cesium.PointPrimitiveCollection;

    private _flyToEvent = this.dv(new Event<[number | undefined]>());
    get flyToEvent() { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) {
            return;
        }
        let { pointPrimitives } = this;
        const resetPrimitive = () => {
            if (pointPrimitives) {
                pointPrimitives.removeAll()
                viewer.scene.primitives.remove(pointPrimitives);
                pointPrimitives = undefined;
            }
        };
        this.d(resetPrimitive);

        const getModelMatrix = () => {
            const modelMatrix = computeCzmModelMatrix({
                localScale: this.localScale,
                initialRotation: 'xForwardzUp',
                localRotation: this.localRotation,
                localPosition: this.localPosition,
                localModelMatrix: this.localModelMatrix,
                // sceneScaleFromPixelSize: sceneScaleFromPixelSize.value,
                scale: this.scale,
                rotation: this.rotation,
                position: this.position,
                modelMatrix: this.modelMatrix,
            });
            return modelMatrix;
        };

        const createPointsPrimitive = () => {
            const primitiveCollection = new Cesium.PointPrimitiveCollection({
                show: this.show ?? true,
                // modelMatrix: getModelMatrix(),//TODO(ysp)
                debugShowBoundingVolume: this.debugShowBoundingVolume ?? false,
                blendOption: (this.blendOption && czmPropMaps.blendOptionType[this.blendOption]) ?? Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT,
            });
            if (!this.pointPrimitiveOptions) {
                return primitiveCollection
            }
            const options = this.pointPrimitiveOptions
            options.forEach(el => {
                primitiveCollection.add({
                    show: el.show ?? true,
                    color: el.color && toColor(el.color),
                    disableDepthTestDistance: el.disableDepthTestDistance,
                    distanceDisplayCondition: el.distanceDisplayCondition && toDistanceDisplayCondition(el.distanceDisplayCondition),
                    outlineColor: el.outlineColor && toColor(el.outlineColor),
                    outlineWidth: el.outlineWidth,
                    pixelSize: el.pixelSize,
                    position: el.position && positionToCartesian(el.position),
                    scaleByDistance: el.scaleByDistance && toNearFarScalar(el.scaleByDistance),
                    translucencyByDistance: el.translucencyByDistance && toNearFarScalar(el.translucencyByDistance),
                })
            })
            //@ts-ignore
            Cesium.PointPrimitiveCollection.prototype && (primitiveCollection.ESSceneObjectID = id);
            return primitiveCollection
        }

        const recreatePrimitive = () => {
            resetPrimitive();
            pointPrimitives = createPointsPrimitive()
            viewer.scene.primitives.add(pointPrimitives)
        }
        recreatePrimitive();

        const updateEvent = this.dv(createNextAnimateFrameEvent(
            this.showChanged,
            this.debugShowBoundingVolumeChanged,
            this.blendOptionChanged,
        ));
        const updatePrimitive = () => {
            if (!pointPrimitives) return;
            pointPrimitives.show = this.show ?? true;
            pointPrimitives.debugShowBoundingVolume = this.debugShowBoundingVolume ?? false;
            pointPrimitives.blendOption = (this.blendOption && czmPropMaps.blendOptionType[this.blendOption]) ?? Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT;
        }
        this.d(updateEvent.don(updatePrimitive));
        const pointsPrimitiveEvent = this.dv(createNextAnimateFrameEvent(this.pointPrimitiveOptionsChanged));
        this.d(pointsPrimitiveEvent.don(recreatePrimitive));

        const boundingSphere = new Cesium.BoundingSphere();

        this.d(this.flyToEvent.don(duration => {
            if (!czmViewer.actived || !this.pointPrimitiveOptions) {
                return;
            }

            updateEvent.flush();
            pointsPrimitiveEvent.flush();

            if (this.pointPrimitiveOptions.length === 1) {
                const position = this.pointPrimitiveOptions[0].position
                if (!position) {
                    return
                }
                const viewDistance = viewer.scene.camera.positionCartographic.height;
                flyTo(viewer, position, viewDistance, undefined, duration);

            } else {
                const optionsList = this.pointPrimitiveOptions
                const position: [number, number, number][] = []

                optionsList.forEach(el => {
                    if (el.position) {
                        position.push(el.position)
                    }
                });
                const cartesians = positionsToUniqueCartesians(position);
                Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);

                if (boundingSphere.radius > 0) {
                    const target = positionFromCartesian(boundingSphere.center);
                    target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
                }
            }

        }));


    }
}

export namespace CzmPointPrimitiveCollection {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        debugShowBoundingVolume: undefined as boolean | undefined,
        blendOption: undefined as "OPAQUE" | "TRANSLUCENT" | "OPAQUE_AND_TRANSLUCENT" | undefined,
        pointPrimitiveOptions: undefined as CzmPointPrimitiveType[] | undefined,

        position: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 经度纬度高度，度为单
        rotation: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 偏航俯仰翻转，度为单位
        scale: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 缩放
        localPosition: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 本地单位，不是经纬度！
        localRotation: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 本地旋转
        localScale: reactArrayWithUndefined<ESJVector3D | undefined>(undefined), // 本地缩放
        localModelMatrix: reactArrayWithUndefined<NativeNumber16Type | undefined>(undefined), // 本地矩阵，一旦启用，localPosition、localRotation、localScale将不起作用！
        modelMatrix: reactArrayWithUndefined<NativeNumber16Type | undefined>(undefined),
    });
}
extendClassProps(CzmPointPrimitiveCollection.prototype, CzmPointPrimitiveCollection.createDefaultProps);
export interface CzmPointPrimitiveCollection extends UniteChanged<ReturnType<typeof CzmPointPrimitiveCollection.createDefaultProps>> { }


