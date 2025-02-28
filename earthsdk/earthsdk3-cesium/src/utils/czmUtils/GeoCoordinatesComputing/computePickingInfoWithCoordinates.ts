import * as Cesium from 'cesium';
import { fromCartographic, positionFromCartesian, positionToCartesian, toCartesian } from '../czmConverts';
import { getDomEventCurrentTargetPos } from 'xbsj-base';
import { getSceneScaleForScreenPixelSize } from '../getSceneScaleForScreenPixelSize';
import { geoDistance } from "earthsdk3";
import { geoNeareastPointOnRhumbLine } from './geoNeareastPointOnRhumbLine';
import { pickHeightPosition } from '../Pick/pickHeightPosition';
import { pickVirtualEarth } from '../Pick/pickVirtualEarth';
export type CoordinatesComputingPickingInfo = {
    constraintMode: 'x' | 'y' | 'z' | 'xy' | 'zAxis' | 'none', // zAxis表示绕z轴旋转
    startDragPos: [number, number, number],
}

export type GeoCoordinatesComputingInfo = {
    readonly position: [number, number, number];
    readonly dimensions: [number, number, number];
    readonly heading: number;
}

function setPosition(position: [number, number, number], result: [number, number, number]) {
    result[0] = position[0];
    result[1] = position[1];
    result[2] = position[2];
}

function heightDistanceRatio(height: number) {
    const radius = Cesium.Ellipsoid.WGS84.minimumRadius;
    const ratio = (height + radius) / radius;
    return ratio;
}

const pickingCarto = new Cesium.Cartographic();
const pickingCartesian = new Cesium.Cartesian3();
const pickingPosition: [number, number, number] = [0, 0, 0];
const neareastPosition: [number, number, number] = [0, 0, 0];
const screenCartesian = new Cesium.Cartesian2();
const centerCartesian = new Cesium.Cartesian3();

export function computePickingInfoWithCoordinates(
    pointerEvent: MouseEvent,
    scene: Cesium.Scene,
    coordinates: GeoCoordinatesComputingInfo,
    axisSnapPixelSize: number,
    result: CoordinatesComputingPickingInfo,
    disabledOptions?: {
        x?: boolean;
        y?: boolean;
        xy?: boolean;
        z?: boolean;
        zAxis?: boolean;
    }
) {
    result.constraintMode = 'none';
    setPosition([0, 0, 0], result.startDragPos);

    disabledOptions = disabledOptions || {};

    toCartesian(getDomEventCurrentTargetPos(pointerEvent), screenCartesian);
    const centerPosition = coordinates.position;
    if (!positionToCartesian(centerPosition, centerCartesian)) {
        return;
    }

    const snapSceneSize = getSceneScaleForScreenPixelSize(scene, centerCartesian, axisSnapPixelSize);
    if (snapSceneSize === undefined) {
        return;
    }

    if (!pickHeightPosition(scene, centerCartesian, screenCartesian, pickingCartesian)) {
        return;
    }
    if (!positionFromCartesian(pickingCartesian, pickingPosition)) {
        return;
    }
    const heightSurfaceDistance = heightDistanceRatio(pickingPosition[2]) * geoDistance(centerPosition, pickingPosition);
    if (!disabledOptions.z &&
        heightSurfaceDistance < snapSceneSize &&
        Math.abs(centerPosition[2] - pickingPosition[2]) < coordinates.dimensions[0] &&
        pickingPosition[2] > centerPosition[2] // 拾取点要比中心点高 vtxf 20231021
    ) {
        result.constraintMode = 'z';
        setPosition(pickingPosition, result.startDragPos);
        return true;
    }

    if (!pickVirtualEarth(scene, screenCartesian, centerPosition[2], pickingCarto)) {
        return;
    }
    if (!fromCartographic(pickingCarto, pickingPosition)) {
        return;
    }

    const virtualEarthSurfaceDistance = heightDistanceRatio(centerPosition[2]) * geoDistance(centerPosition, pickingPosition);

    const d = coordinates.dimensions[0];

    if (virtualEarthSurfaceDistance > 1.05 * d) {
        return;
    }

    if (!disabledOptions.zAxis &&
        virtualEarthSurfaceDistance > .95 * d &&
        virtualEarthSurfaceDistance <= 1.05 * d
    ) {
        result.constraintMode = 'zAxis';
        setPosition(pickingPosition, result.startDragPos);
        return;
    }

    {
        const [dis, pos] = geoNeareastPointOnRhumbLine(centerPosition, coordinates.heading + 90, pickingPosition, neareastPosition)
        // dis > 0 表示拾取的是x轴正向上的点
        if (!disabledOptions.x &&
            dis > 0 && pos) {
            neareastPosition[2] = centerPosition[2];
            const d = geoDistance(neareastPosition, pickingPosition);
            if (d < snapSceneSize) {
                result.constraintMode = 'x';
                setPosition(neareastPosition, result.startDragPos);
                return;
            }
        }
    }

    {
        const [dis, pos] = geoNeareastPointOnRhumbLine(centerPosition, coordinates.heading, pickingPosition, neareastPosition)
        // dis > 0 表示拾取的是y轴正向上的点
        if (!disabledOptions.y &&
            dis > 0 && pos) {
            neareastPosition[2] = centerPosition[2];
            const d = geoDistance(neareastPosition, pickingPosition);
            if (d < snapSceneSize) {
                result.constraintMode = 'y';
                setPosition(neareastPosition, result.startDragPos);
                return;
            }
        }
    }

    if (!disabledOptions.xy) {
        result.constraintMode = 'xy';
        setPosition(pickingPosition, result.startDragPos);
    }

    return;
}
