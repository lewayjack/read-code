import { ESDynamicWater, getDistancesFromPositions } from "earthsdk3";
import { CzmESLocalVector, CzmPolyline, CzmWaterPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer, getViewerExtensions } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, track } from "xbsj-base";
import { WaterAttribute, waterType } from "./type";
import { flyWithPositions, getCameraPosition, localPositionsToPositions } from "../../../utils";
/**
 * https://www.wolai.com/earthsdk/f9Kycrmp1srzt2dJyzgUxr
 */
export class CzmESDynamicWater extends CzmESLocalVector<ESDynamicWater> {
    static readonly type = this.register('ESCesiumViewer', ESDynamicWater.type, this);
    czmGeoPolyline;
    czmWaterPrimitive;

    constructor(sceneObject: ESDynamicWater, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) return;

        this.czmGeoPolyline = this.dv(new CzmPolyline(czmViewer, sceneObject.id));
        this.czmWaterPrimitive = this.dv(new CzmWaterPrimitive(czmViewer, sceneObject.id));
        const { czmGeoPolyline, czmWaterPrimitive } = this;

        {
            this.d(track([czmWaterPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.d(track([czmWaterPrimitive, 'ground'], [sceneObject, 'fillGround']));
            this.d(track([czmGeoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.d(track([czmGeoPolyline, 'color'], [sceneObject, 'strokeColor']));
            this.d(track([czmGeoPolyline, 'width'], [sceneObject, 'strokeWidth']));
            this.d(track([czmGeoPolyline, 'ground'], [sceneObject, 'strokeGround']));
        }
        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.waterColorChanged,
                sceneObject.frequencyChanged,
                sceneObject.waveVelocityChanged,
                sceneObject.amplitudeChanged,
                sceneObject.specularIntensityChanged,
                sceneObject.waterTypeChanged,
                sceneObject.flowDirectionChanged,
                sceneObject.flowSpeedChanged,
            ))
            const update = () => {
                if (sceneObject.waterType === 'custom') {
                    this.updateWater({
                        waterColor: sceneObject.waterColor ?? ESDynamicWater.defaults.waterColor,
                        frequency: (sceneObject.frequency ?? ESDynamicWater.defaults.frequency) / 10,
                        waveVelocity: (sceneObject.waveVelocity ?? ESDynamicWater.defaults.waveVelocity) / 100,
                        amplitude: (sceneObject.amplitude ?? ESDynamicWater.defaults.amplitude) * 100,
                        specularIntensity: sceneObject.specularIntensity ?? ESDynamicWater.defaults.specularIntensity,
                        flowDirection: sceneObject.flowDirection ?? ESDynamicWater.defaults.flowDirection,
                        flowSpeed: sceneObject.flowSpeed ?? ESDynamicWater.defaults.flowSpeed,
                    });
                } else {
                    const waterAttribute = Object.assign({}, waterType[sceneObject.waterType]);
                    waterAttribute.frequency && (waterAttribute.frequency /= 10);
                    waterAttribute.waveVelocity && (waterAttribute.waveVelocity /= 100);
                    waterAttribute.amplitude && (waterAttribute.amplitude *= 100);
                    this.updateWater(waterAttribute)
                }
            }
            update();
            this.d(event.don(update));
        }
        {//line show
            const update = () => {
                czmGeoPolyline.show = sceneObject.show && sceneObject.stroked;
            };
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
            ));
            this.d(updateEvent.don(update));
            update();
        }
        {//Water show
            const update = () => {
                czmWaterPrimitive.show = (sceneObject.show && sceneObject.filled) ? true : false;
            };
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.filledChanged,
            ));
            this.d(updateEvent.don(update));
            update();
        }

        {
            // update positions
            const update = () => {
                if (!sceneObject.points || (sceneObject.points && sceneObject.points.length <= 2)) {
                    czmGeoPolyline.positions = [];
                    czmWaterPrimitive.points = [];
                    return
                };
                if (sceneObject.scale && sceneObject.scale.some(e => e === 0)) {
                    console.warn(`缩放属性(scale)不能设置值为0`);
                    return;
                }
                const points = sceneObject.points.map(e => [e[0], e[1], 0] as [number, number, number])
                const [positions] = localPositionsToPositions({
                    originPosition: sceneObject.position,
                    originRotation: sceneObject.rotation,
                    originScale: sceneObject.scale,
                    // @ts-ignore
                    initialRotationMode: 'XForwardZUp',
                }, points);
                czmGeoPolyline.positions = [...positions, positions[0]];
                czmWaterPrimitive.points = [...positions];
                czmWaterPrimitive.height = positions[0][2];
            };
            update();
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.pointsChanged,
                sceneObject.positionChanged,
                sceneObject.rotationChanged,
                sceneObject.scaleChanged,
            ));
            this.d(updateEvent.don(update));
        }
    }
    override visibleDistance(sceneObject: ESDynamicWater, czmViewer: ESCesiumViewer): void {
        if (czmViewer.viewer?.camera && sceneObject.show) {
            const dis = getDistancesFromPositions([sceneObject.position, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (sceneObject.minVisibleDistance < sceneObject.maxVisibleDistance) {
                show = sceneObject.minVisibleDistance < dis && dis < sceneObject.maxVisibleDistance;
            } else if (sceneObject.maxVisibleDistance == 0) {
                show = dis > sceneObject.minVisibleDistance;
            }
            this.czmGeoPolyline && (this.czmGeoPolyline.show = sceneObject.show && sceneObject.stroked && show);
            this.czmWaterPrimitive && (this.czmWaterPrimitive.show = sceneObject.show && sceneObject.filled && show);
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmWaterPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmWaterPrimitive?.points) {
                flyWithPositions(czmViewer, sceneObject, id, czmWaterPrimitive.points, duration, true);
                return true;
            }
            return false;
        }
    }
    private updateWater(updateAttribute: WaterAttribute) {
        const { czmWaterPrimitive } = this;
        if (!czmWaterPrimitive) return;
        if (updateAttribute.waterColor && czmWaterPrimitive.waterColor != updateAttribute.waterColor) {
            czmWaterPrimitive.waterColor = updateAttribute.waterColor
        }
        if (updateAttribute.specularIntensity && czmWaterPrimitive.specularIntensity != updateAttribute.specularIntensity) {
            czmWaterPrimitive.specularIntensity = updateAttribute.specularIntensity
        }
        if (updateAttribute.frequency && czmWaterPrimitive.frequency != updateAttribute.frequency) {
            czmWaterPrimitive.frequency = updateAttribute.frequency
        }
        if (updateAttribute.waveVelocity && czmWaterPrimitive.waveVelocity != updateAttribute.waveVelocity) {
            czmWaterPrimitive.waveVelocity = updateAttribute.waveVelocity
        }
        if (updateAttribute.amplitude && czmWaterPrimitive.amplitude != updateAttribute.amplitude) {
            czmWaterPrimitive.amplitude = updateAttribute.amplitude
        }
    }
}
