import { Feature, GeoJSON, Geometry } from 'geojson';
import { STCRoutePathType } from '.';

import { lineString } from '@turf/helpers';
import length from '@turf/length';

function geoLength(positions: [number, number, number][]) {
    var line = lineString(positions);
    var len = length(line, { units: 'meters' });
    return len;
}

export function* getGeoJsonNodeIterator(geoJsonNode: GeoJSON) {
    if (geoJsonNode.type === 'FeatureCollection') {
        yield* geoJsonNode.features.map(feature => [feature.geometry, feature] as [Geometry, Feature]);
    } else if (geoJsonNode.type === 'Feature') {
        yield [geoJsonNode.geometry, geoJsonNode] as [Geometry, Feature];
    }
}

export function* geoPolylinesFromGeoJson(geoJsonNode: GeoJSON) {
    for (const [node, feature] of getGeoJsonNodeIterator(geoJsonNode)) {
        if (node.type === 'LineString') {
            yield [node.coordinates, feature] as [number[][], Feature];
        } else if (node.type === 'MultiLineString') {
            for (let coordinates of node.coordinates) {
                yield [coordinates, feature] as [number[][], Feature];
            }
        }
    }
}

export function getSTCRoutePathsFromGeoJson(geoJsonNode: GeoJSON, width: number, repeatLength: number) {
    return [...geoPolylinesFromGeoJson(geoJsonNode)].map(([coordinates, feature]) => {
        if (coordinates.length < 2) return undefined;
        const positions = coordinates.map(c => [c[0], c[1], c[2] ?? 0] as [number, number, number]);
        const length = geoLength(positions);
        const repeat = length / repeatLength;
        return {
            positions,
            repeat,
            width,
            extra: { geojson: { feature } },
        } as STCRoutePathType;
    }).filter(e => !!e) as STCRoutePathType[];
}

