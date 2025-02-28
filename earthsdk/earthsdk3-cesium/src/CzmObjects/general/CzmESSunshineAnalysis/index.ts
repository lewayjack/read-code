import * as turf from '@turf/turf';
import * as Cesium from 'cesium';
import { ESJColor, ESJVector2D, ESJVector3D, ESJVector3DArray, ESSunshineAnalysis } from "earthsdk3";
import { createProcessingFromAsyncFunc, track } from 'xbsj-base';
import { CzmPointPrimitiveCollection } from '../../../CzmObjects';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { CzmPointPrimitiveType } from '../../../ESJTypesCzm';
import { flyWithPositions, fromCartesian3 } from '../../../utils';
import { CzmESGeoPolygon } from '../CzmESGeoPolygon';

function computeCutPoint(p1: ESJVector3D, p2: ESJVector3D, scene: Cesium.Scene) {
    // 将经纬高转换为笛卡尔坐标
    const c1 = Cesium.Cartesian3.fromDegrees(p1[0], p1[1], p1[2]);
    const c2 = Cesium.Cartesian3.fromDegrees(p2[0], p2[1], p2[2]);
    // 计算方向
    const direction = Cesium.Cartesian3.subtract(c2, c1, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(direction, direction);
    // 创建射线
    const ray = new Cesium.Ray(c1, direction);
    // @ts-ignore
    const resultScene = scene.pickFromRay(ray);
    const resultGlobe = scene.globe.pick(ray, scene);

    if (resultGlobe || resultScene) {
        return true
    } else {
        return false
    }
}

const sleep = (time: number = 0) => new Promise(resolve => setTimeout(resolve, time))

/**
 * 
 * @param points 必须首尾一致的多边形
 * @param distance 插值距离m
 * @returns 多边形内插值点
 */
function getPoints(points: ESJVector3DArray, distance: number) {
    const featureCollection = turf.featureCollection(points.map(p => turf.point(p)));
    const polygon = turf.polygon([points]);
    const options = { gridType: 'point' as turf.Grid, units: 'meters' as turf.Units };
    const grid = turf.interpolate(featureCollection, distance, options);
    //@ts-ignore
    const coordinates = grid.features.map(f => f.geometry.coordinates as ESJVector2D);
    const positions = coordinates.filter(c => turf.booleanPointInPolygon(turf.point(c), polygon));
    return positions
}

function getSunPointFromDate(time: Date) {
    // 创建一个 JulianDate
    const julianDate = Cesium.JulianDate.fromDate(time);
    // 计算太阳在惯性地球坐标系中的位置。
    const cartesian3 = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(julianDate);
    const position = fromCartesian3(cartesian3);
    return position
}

//颜色比例
function colorLerp(start: ESJColor, end: ESJColor, t: number) {
    const r = start[0] + (end[0] - start[0]) * t;
    const g = start[1] + (end[1] - start[1]) * t;
    const b = start[2] + (end[2] - start[2]) * t;
    const a = start[3] + (end[3] - start[3]) * t;
    return [r, g, b, a];
}

export class CzmESSunshineAnalysis extends CzmESGeoPolygon<ESSunshineAnalysis> {
    static override readonly type = this.register('ESCesiumViewer', ESSunshineAnalysis.type, this);

    czmPointPrimitiveCollection;

    private _stopRun = false;

    constructor(sceneObject: ESSunshineAnalysis, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmPointPrimitiveCollection = this.dv(new CzmPointPrimitiveCollection(czmViewer, sceneObject.id));
        this.czmPointPrimitiveCollection = czmPointPrimitiveCollection;
        {
            this.d(track([czmPointPrimitiveCollection, 'show'], [sceneObject, 'show']));
        }
        {
            /**
             * 1.共面内点位插值
             * 2.按照海拔高度和高度计算分层点位
             * 3.时间分段，计算各个时间点太阳位置
             * 4.各个点与各个太阳点求射线是否有阻挡，记录各个点的连通个数与未连通个数
             * 5.根据连通比例对应到颜色段上，组合出pointPrimitiveOptions参数
             */

            const update = async () => {
                if (!(sceneObject.points && sceneObject.points.length >= 3) || (sceneObject.endTime < sceneObject.startTime)) {
                    czmPointPrimitiveCollection.pointPrimitiveOptions = undefined;
                    return;
                };
                const positions = [...sceneObject.points, sceneObject.points[0]];
                const distance = sceneObject.sampleDistance;
                const points = getPoints(positions, distance).map(e => [...e, sceneObject.extrudedHeight] as [number, number, number])

                //根据插值距离抬高
                const num = Math.floor(sceneObject.height / distance)
                if (num > 0) {
                    const pos = [...points]
                    for (let i = 1; i <= num; i++) {
                        points.push(...pos.map((p) => [p[0], p[1], sceneObject.extrudedHeight + (i * distance)] as [number, number, number]))
                    }
                }
                // 时间分段+太阳位置+
                const { startTime, endTime, spanTime } = sceneObject
                const spanTimeMs = spanTime * 3600000
                const timeLength = Math.floor((endTime - startTime) / spanTimeMs)
                //比例记录
                const colorScalelist: number[] = Array(points.length).fill(0);

                forLoop1:
                for (let i = 0; i < timeLength; i++) {
                    await sleep();
                    if (this._stopRun) break forLoop1;
                    //时间分段
                    const time = new Date(startTime + (i * spanTimeMs))
                    const sunPos = getSunPointFromDate(time);
                    forLoop2:
                    for (let j = 0; j < points.length; j++) {
                        await sleep();
                        if (this._stopRun) break forLoop2;
                        //计算射线，没有阻挡表示连通则比例+1，颜色更趋近于endColor
                        if (!computeCutPoint(points[j], sunPos, viewer.scene)) {
                            colorScalelist[j] = ((colorScalelist[j] * timeLength) + 1) / timeLength
                        }
                    }
                    //保留两位
                    (!this._stopRun) && (sceneObject.progress = Number(((i + 1) / timeLength * 100).toFixed(2)));
                }

                //根据比例计算颜色,生成pointPrimitiveOptions
                const pointPrimitiveOptions = points.map((point, index) => ({
                    position: [...point],
                    color: colorLerp(sceneObject.startColor, sceneObject.endColor, colorScalelist[index]),
                    pixelSize: 10,
                } as CzmPointPrimitiveType))
                czmPointPrimitiveCollection.pointPrimitiveOptions = pointPrimitiveOptions;
            }

            const processing = this.dv(createProcessingFromAsyncFunc<void>(async (cancelsManager) => {
                await cancelsManager.promise(update());
            }));

            this.d(sceneObject.startEvent.don(() => {
                this._stopRun = false;
                czmPointPrimitiveCollection.pointPrimitiveOptions = undefined;
                sceneObject.progress = 0;
                processing.restart();
            }));

            this.d(sceneObject.stopEvent.don(() => {
                this._stopRun = true;
                czmPointPrimitiveCollection.pointPrimitiveOptions = undefined;
                sceneObject.progress = 0;
                processing.isRunning && processing.cancel();
            }));

        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolygon } = this;
        if (!geoPolygon) return false;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (geoPolygon.positions) {
                const tempPos = [...geoPolygon.positions]
                geoPolygon.positions.forEach(item => {
                    tempPos.push([item[0], item[1], sceneObject.height], [item[0], item[1], sceneObject.extrudedHeight])
                })
                flyWithPositions(czmViewer, sceneObject, id, tempPos, duration);
                return true;
            }
            return false
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolygon } = this;
        if (!geoPolygon) return false;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (geoPolygon.positions) {
                const tempPos = [...geoPolygon.positions]
                geoPolygon.positions.forEach(item => {
                    tempPos.push([item[0], item[1], sceneObject.height], [item[0], item[1], sceneObject.extrudedHeight])
                })
                flyWithPositions(czmViewer, sceneObject, id, tempPos, duration);
                return true;
            }
            return false
        }
    }
}
