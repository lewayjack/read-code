import * as Cesium from 'cesium';
import { CzmESGeoVector, CzmPolylinesPrimitive, PositionsEditing } from '../../../CzmObjects';
import { ESJVector3D, ESVisibilityAnalysis } from "earthsdk3";
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { createNextAnimateFrameEvent, track } from 'xbsj-base';
import { flyWithPositions } from '../../../utils';
const td = Cesium.Math.toDegrees;
const scratchCartographic = new Cesium.Cartographic();

/**
 * 计算切割点
 * @param p1 起始点
 * @param p2 结束点
 * @param scene Cesium场景
 * @returns {ESJVector3D|undefined} 切割点
 */
export function computeCutPoint(p1: ESJVector3D, p2: ESJVector3D, scene: Cesium.Scene) {
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

    var result;
    // 如果结果存在
    if (resultScene && resultScene.position && resultGlobe) {
        // 计算距离
        const disScene = Cesium.Cartesian3.distance(c1, resultScene.position);
        const disGlobe = Cesium.Cartesian3.distance(c1, resultGlobe);
        // 比较距离，距离小的作为结果
        result = disScene < disGlobe ? resultScene.position : resultGlobe;
    } else if (resultScene && resultScene.position) {
        result = resultScene.position;
    } else if (resultGlobe) {
        result = resultGlobe;
    }

    if (!result) {
        return undefined;
    }

    // 计算距离
    const d1 = Cesium.Cartesian3.distance(c1, c2);
    const d2 = Cesium.Cartesian3.distance(c1, result);

    // 计算切割点
    const cutPontCartesian = d2 > d1 ? c2 : result;
    const carto = Cesium.Cartographic.fromCartesian(cutPontCartesian, undefined, scratchCartographic);
    // 返回切割点
    return [td(carto.longitude), td(carto.latitude), carto.height] as ESJVector3D;
}

export class CzmESVisibilityAnalysis extends CzmESGeoVector<ESVisibilityAnalysis> {
    static readonly type = this.register('ESCesiumViewer', ESVisibilityAnalysis.type, this);
    private _hideGeoPolylines = this.disposeVar(new CzmPolylinesPrimitive(this.czmViewer, this.sceneObject.id));
    get hideGeoPolylines() { return this._hideGeoPolylines; }

    private _visibleGeoPolylines = this.disposeVar(new CzmPolylinesPrimitive(this.czmViewer, this.sceneObject.id));
    get visibleGeoPolylines() { return this._visibleGeoPolylines; }

    private _sPositionsEditing = this.disposeVar(new PositionsEditing([this.sceneObject, 'points'], true, [this.sceneObject, 'editing'], this.czmViewer));
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(sceneObject: ESVisibilityAnalysis, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const hideGeoPolylines = this._hideGeoPolylines;
        const visibleGeoPolylines = this._visibleGeoPolylines;

        // czmViewer.add(hideGeoPolylines);
        // czmViewer.add(visibleGeoPolylines);
        // this.d(() => czmViewer.delete(hideGeoPolylines))
        // this.d(() => czmViewer.delete(visibleGeoPolylines))

        this.d(track([hideGeoPolylines, 'show'], [sceneObject, 'show']));
        this.d(track([visibleGeoPolylines, 'show'], [sceneObject, 'show']));

        this.d(track([visibleGeoPolylines, 'color'], [sceneObject, 'visibleColor']));
        this.d(track([hideGeoPolylines, 'color'], [sceneObject, 'invisibleColor']));

        {
            const updateProp = () => {
                const points = sceneObject.points;
                const heightOffset = sceneObject.heightOffset;
                if (!points || points.length < 2 || (points[0].toString() === points[1].toString())) {
                    hideGeoPolylines.positions = undefined;
                    visibleGeoPolylines.positions = undefined;
                    return;
                }
                const hidePositions: ESJVector3D[][] = [];
                const visiblePositions: ESJVector3D[][] = [];
                const [x, y, z] = points[0];
                const origin = [x, y, z + heightOffset] as ESJVector3D
                try {
                    points.forEach((p, index) => {
                        if (index === 0) return;
                        const cutPoint = computeCutPoint(origin, p, viewer.scene)
                        // console.log(index, cutPoint)
                        if (cutPoint) {
                            hidePositions.push([p, cutPoint]);
                            visiblePositions.push([origin, cutPoint]);
                        } else {
                            visiblePositions.push([origin, p]);
                        }
                    });

                    hideGeoPolylines.positions = hidePositions;
                    visibleGeoPolylines.positions = visiblePositions;
                } catch (error) {
                    console.warn(error)
                }

            }
            updateProp();
            const updateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.pointsChanged,
                sceneObject.heightOffsetChanged,
            ));
            this.d(updateEvent.don(updateProp));
        }

    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            let tempPos: ESJVector3D[] = []
            if (this.visibleGeoPolylines.positions) tempPos = [...this.visibleGeoPolylines.positions.flat()];
            if (this.hideGeoPolylines.positions) tempPos = [...tempPos, ...this.hideGeoPolylines.positions.flat()];
            flyWithPositions(czmViewer, sceneObject, id, tempPos, duration);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            let tempPos: ESJVector3D[] = []
            if (this.visibleGeoPolylines.positions) tempPos = [...this.visibleGeoPolylines.positions.flat()];
            if (this.hideGeoPolylines.positions) tempPos = [...tempPos, ...this.hideGeoPolylines.positions.flat()];
            flyWithPositions(czmViewer, sceneObject, id, tempPos, duration);
            return true;
        }
    }
}
