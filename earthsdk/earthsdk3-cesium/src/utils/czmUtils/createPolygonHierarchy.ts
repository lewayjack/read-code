import * as Cesium from 'cesium';
import { positionsToUniqueCartesians } from './positionsToUniqueCartesians';
import { CesiumPolygonHierarchyType, PolygonHierarchyType } from '../../ESJTypesCzm';

export function createPolygonHierarchy(polygonHierarchyJson: PolygonHierarchyType): CesiumPolygonHierarchyType {
    const cartesians = positionsToUniqueCartesians(polygonHierarchyJson.positions);
    const holes = polygonHierarchyJson.holes && (polygonHierarchyJson.holes.map(e => createPolygonHierarchy(e)) as CesiumPolygonHierarchyType[]);
    return {
        positions: cartesians,
        holes,
    } as CesiumPolygonHierarchyType;
}
