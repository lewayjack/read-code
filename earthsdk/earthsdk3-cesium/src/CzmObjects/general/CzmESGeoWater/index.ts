import { ESGeoWater } from "earthsdk3";
import { CzmESGeoVector, CzmPolyline, CzmWater, CzmWaterPrimitive, PositionsEditing } from "../../../CzmObjects";
import { createNextAnimateFrameEvent, track } from "xbsj-base";
import { WaterAttribute, waterType } from "./type";
import { ESCesiumViewer, getViewerExtensions } from "../../../ESCesiumViewer";
import { flyWithPositions } from "../../../utils";

export class CzmESGeoWater extends CzmESGeoVector<ESGeoWater> {
    static readonly type = this.register('ESCesiumViewer', ESGeoWater.type, this);
    //轮廓线
    geoPolyline;
    //编辑
    sPositionsEditing;
    //贴地
    czmWaterPrimitive;
    //地理位置
    czmWater;

    constructor(sceneObject: ESGeoWater, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const extensions = getViewerExtensions(czmViewer.viewer);
        if (!extensions) return;

        this.geoPolyline = this.dv(new CzmPolyline(czmViewer, sceneObject.id));
        this.czmWaterPrimitive = this.dv(new CzmWaterPrimitive(czmViewer, sceneObject.id));
        this.czmWaterPrimitive.ground = true;
        this.czmWater = this.dv(new CzmWater(czmViewer, sceneObject.id));
        this.sPositionsEditing = this.dv(new PositionsEditing([this.sceneObject, 'points'], true, [this.sceneObject, 'editing'], czmViewer));
        const { geoPolyline, czmWaterPrimitive, czmWater } = this;

        this.d(track([geoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(track([geoPolyline, 'color'], [sceneObject, 'strokeColor']));
        this.d(track([geoPolyline, 'width'], [sceneObject, 'strokeWidth']));
        this.d(track([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));

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
                        waterColor: sceneObject.waterColor ?? ESGeoWater.defaults.waterColor,
                        frequency: (sceneObject.frequency ?? ESGeoWater.defaults.frequency) / 10,
                        waveVelocity: (sceneObject.waveVelocity ?? ESGeoWater.defaults.waveVelocity) / 100,
                        amplitude: (sceneObject.amplitude ?? ESGeoWater.defaults.amplitude) * 100,
                        specularIntensity: sceneObject.specularIntensity ?? ESGeoWater.defaults.specularIntensity,
                        flowDirection: sceneObject.flowDirection ?? ESGeoWater.defaults.flowDirection,
                        flowSpeed: sceneObject.flowSpeed ?? ESGeoWater.defaults.flowSpeed,
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
                geoPolyline.show = (sceneObject.show && sceneObject.stroked) ? true : false;
            };
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
            ));
            this.d(updateEvent.don(update));
            update();
        }
        {//Water show  ground filled
            const update = () => {
                if (sceneObject.show && sceneObject.filled && sceneObject.fillGround) {
                    czmWaterPrimitive.show = true;
                    czmWater.show = false;
                } else if (sceneObject.show && sceneObject.filled && !sceneObject.fillGround) {
                    czmWater.show = true;
                    czmWaterPrimitive.show = false;
                } else {
                    czmWaterPrimitive.show = false;
                    czmWater.show = false;
                }
            };
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.filledChanged,
                sceneObject.fillGroundChanged
            ));
            this.d(updateEvent.don(update));
            update();
        }

        {
            // update positions
            const update = () => {
                if (sceneObject.points && sceneObject.points.length >= 3) {
                    geoPolyline.positions = [...sceneObject.points, sceneObject.points[0]];
                    czmWaterPrimitive.points = [...sceneObject.points];
                    czmWater.points = [...sceneObject.points];
                } else {
                    geoPolyline.positions = sceneObject.points
                        && sceneObject.points.length >= 2
                        ? [...sceneObject.points, sceneObject.points[0]]
                        : [];
                    czmWaterPrimitive.points = [];
                    czmWater.points = [];
                }
            };
            update();
            const updateEvent = this.dv(createNextAnimateFrameEvent(sceneObject.pointsChanged));
            this.d(updateEvent.don(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.points) {
                flyWithPositions(czmViewer, sceneObject, id, sceneObject.points, duration);
                return true;
            }
            return false;
        }
    }
    private updateWater(updateAttribute: WaterAttribute) {
        const { czmWater, czmWaterPrimitive } = this;
        if (!(czmWater && czmWaterPrimitive)) return;
        if (updateAttribute.waterColor && (czmWater.waterColor != updateAttribute.waterColor || czmWaterPrimitive.waterColor != updateAttribute.waterColor)) {
            czmWater.waterColor = czmWaterPrimitive.waterColor = updateAttribute.waterColor
        }
        if (updateAttribute.specularIntensity && (czmWater.specularIntensity != updateAttribute.specularIntensity || czmWaterPrimitive.specularIntensity != updateAttribute.specularIntensity)) {
            czmWater.specularIntensity = czmWaterPrimitive.specularIntensity = updateAttribute.specularIntensity
        }
        if (updateAttribute.frequency && (czmWater.frequency != updateAttribute.frequency || czmWaterPrimitive.frequency != updateAttribute.frequency)) {
            czmWater.frequency = czmWaterPrimitive.frequency = updateAttribute.frequency
        }
        if (updateAttribute.waveVelocity && (czmWater.waveVelocity != updateAttribute.waveVelocity || czmWaterPrimitive.waveVelocity != updateAttribute.waveVelocity)) {
            czmWater.waveVelocity = czmWaterPrimitive.waveVelocity = updateAttribute.waveVelocity
        }
        if (updateAttribute.amplitude && (czmWater.amplitude != updateAttribute.amplitude || czmWaterPrimitive.amplitude != updateAttribute.amplitude)) {
            czmWater.amplitude = czmWaterPrimitive.amplitude = updateAttribute.amplitude
        }
    }
}
