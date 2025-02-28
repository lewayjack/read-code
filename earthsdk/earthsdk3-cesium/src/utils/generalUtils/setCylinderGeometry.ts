import { CzmCustomPrimitive } from "../../CzmObjects";
import { getMinMaxPosition } from "./getMinMaxPosition";

export function setCylinderGeometry(
    cylinderCustomPrimitive: CzmCustomPrimitive,
    options: {
        segments: number;
        startRadius: number;
        stopRadius: number;
        height: number;
    }) {
    const angle = 360 / options.segments;
    const radian = Math.PI / 180 * angle; //弧度
    const num = Math.floor(360 / angle);
    const startRadius = options.startRadius;
    const endRadius = options.stopRadius;
    const height = options.height;
    const numberOfTriangles = [...new Array(num + 1).keys()];

    const startPositions = numberOfTriangles.map(e => e * radian).map(e => [startRadius * Math.cos(e), startRadius * Math.sin(e), 0] as [number, number, number]);
    const stopPositions = numberOfTriangles.map(e => e * radian).map(e => [endRadius * Math.cos(e), endRadius * Math.sin(e), height] as [number, number, number]);

    const positions = [...startPositions, ...stopPositions];
    const { minPos, maxPos } = getMinMaxPosition(positions);

    cylinderCustomPrimitive.boundingVolume = {
        type: 'LocalAxisedBoundingBox',
        data: {
            min: minPos,
            max: maxPos,
        }
    };

    const normals = numberOfTriangles.map(e => [0, 1, 0]).flat();
    const textureCoordinates1 = numberOfTriangles.map(e => [e / num, 0]).flat();
    const textureCoordinates2 = numberOfTriangles.map(e => [e / num, 1]).flat();
    cylinderCustomPrimitive.attributes = {
        position: {
            componentsPerAttribute: 3,
            typedArray: new Float32Array(positions.flat()),
        },
        normal: {
            componentsPerAttribute: 3,
            typedArray: new Float32Array([...normals, ...normals]),
        },
        textureCoordinates: {
            componentsPerAttribute: 2,
            typedArray: new Float32Array([...textureCoordinates1, ...textureCoordinates2]),
        },
    };
    const indexTypedOfTriangles = [...new Array(num).keys()];
    const indexTypedArray1 = indexTypedOfTriangles.map(e => [e, e + num + 1, e + num + 2, e, e + num + 2, e + 1]);
    const indexTypedArray2 = indexTypedOfTriangles.map(e => [e, e + num + 2, e + num + 1, e, e + 1, e + num + 2]);
    const indexTypedArray = [...indexTypedArray1, ...indexTypedArray2].flat();
    cylinderCustomPrimitive.indexTypedArray = new Uint16Array(indexTypedArray);
}