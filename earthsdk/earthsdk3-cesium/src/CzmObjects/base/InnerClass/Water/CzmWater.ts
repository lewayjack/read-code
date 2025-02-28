//多边形水面
import * as Cesium from 'cesium';
import { ESCesiumViewer, getViewerExtensions } from '../../../../ESCesiumViewer';
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, react, reactPositions, SceneObjectKey, UniteChanged } from 'xbsj-base';
import { ESGeoWater, ESJColor, ESJVector3DArray, ESSceneObject } from "earthsdk3";
import { createPolygonHierarchy, flyTo, positionFromCartesian, positionsToUniqueCartesians, toColor } from '../../../../utils';
import { PolygonHierarchyType } from '../../../../ESJTypesCzm';
export type WaterAttribute = {
    waterColor?: ESJColor,
    frequency?: number,
    waveVelocity?: number,
    amplitude?: number,
    specularIntensity?: number,
    flowDirection?: number,
    flowSpeed?: number,
}

export class CzmWater extends Destroyable {
    private _primitive?: Cesium.Primitive;

    private _flyToEvent = this.dv(new Event<[duration: number]>());
    get flyToEvent() { return this._flyToEvent; }
    flyTo(duration: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) return;
        const normalMap = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/water/waterNormalsSmall.jpg')
        const removePrimitive = () => {
            if (!this._primitive) return;
            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.d(removePrimitive);

        const createWaterMaterial = () => {
            const uniforms: any = {
                baseWaterColor: toColor(this.waterColor),
                normalMap,
                frequency: this.frequency,
                animationSpeed: this.waveVelocity,
                amplitude: this.amplitude,
                specularIntensity: this.specularIntensity,
            }
            const material = new Cesium.Material({ fabric: { type: 'Water', uniforms } })
            return material;
        }

        const createPrimitive = () => {
            if (!this.points) return undefined
            const appearance = new Cesium.EllipsoidSurfaceAppearance({
                material: createWaterMaterial(),
                aboveGround: true,
            });

            const hierarchy = { positions: this.points } as PolygonHierarchyType;
            const polygonInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.CoplanarPolygonGeometry({
                    polygonHierarchy: createPolygonHierarchy(hierarchy),
                    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                }),
                id: this
            });

            const primitive = new Cesium.Primitive({
                geometryInstances: polygonInstance,
                appearance,
                asynchronous: false,
                allowPicking: this.allowPicking,
                compressVertices: false,
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObject = id)
            return primitive;
        }

        const boundingSphere = new Cesium.BoundingSphere();
        const recreatePolygon = () => {
            removePrimitive()
            if (!this.points) return;
            const cartesians = positionsToUniqueCartesians(this.points);
            if (cartesians.length < 3) {
                boundingSphere.radius = -1;
                return;
            }
            Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
            this._primitive = createPrimitive();
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updatePolygon = () => {
            const polygonShow = this.show ?? true;
            this._primitive && (this._primitive.show = polygonShow);
        };

        recreatePolygon();
        updatePolygon();

        const recreateEvent = this.dv(createNextAnimateFrameEvent(
            this.pointsChanged,
            this.allowPickingChanged,
            this.waterColorChanged,
            this.frequencyChanged,
            this.amplitudeChanged,
            this.specularIntensityChanged,
            this.waveVelocityChanged
        ));

        this.d(recreateEvent.don(() => {
            recreatePolygon();
            updatePolygon();
        }));
        this.d(this.showChanged.don(updatePolygon));
        this.d(this.flyToEvent.don(duration => {
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmWater {
    export const createDefaultProps = () => ({
        show: true,
        points: reactPositions(undefined),
        allowPicking: true,

        waterColor: [0.1497, 0.165, 0.0031, 1] as ESJColor,
        frequency: 1000,
        waveVelocity: 0.5,
        amplitude: 0.1,
        specularIntensity: 0.8
    });
}
extendClassProps(CzmWater.prototype, CzmWater.createDefaultProps);
export interface CzmWater extends UniteChanged<ReturnType<typeof CzmWater.createDefaultProps>> { }

