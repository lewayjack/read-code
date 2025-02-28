import { CzmCustomPrimitive } from "../../CzmObjects";

export function setRectangleGeometry(
    cylinderCustomPrimitive: CzmCustomPrimitive,
    options: {
        width: number;
        height: number;
    }) {
    const { width, height } = options;

    cylinderCustomPrimitive.boundingVolume = {
        type: 'LocalAxisedBoundingBox',
        data: {
            min: [-width * .5, -height * .5, 0],
            max: [width * .5, height * .5, 0],
        }
    };

    cylinderCustomPrimitive.attributes = {
        position: {
            componentsPerAttribute: 3,
            typedArray: new Float32Array([
                -0.5 * width, -0.5 * height, 0,
                0.5 * width, -0.5 * height, 0,
                0.5 * width, 0.5 * height, 0,
                -0.5 * width, 0.5 * height, 0,
            ]),
        },
        normal: {
            componentsPerAttribute: 3,
            typedArray: new Float32Array([
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
            ]),
        },
        textureCoordinates: {
            componentsPerAttribute: 2,
            typedArray: new Float32Array([
                -1, -1,
                1, -1,
                1, 1,
                -1, 1,
            ]),
        },
    };
    cylinderCustomPrimitive.indexTypedArray = new Uint16Array([0, 1, 2, 0, 2, 3]);
}