import * as Cesium from "cesium";
export type CzmPassType = 'ENVIRONMENT' | 'COMPUTE' | 'GLOBE' | 'TERRAIN_CLASSIFICATION' | 'CESIUM_3D_TILE' | 'CESIUM_3D_TILE_CLASSIFICATION' | 'CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW' | 'OPAQUE' | 'TRANSLUCENT' | 'OVERLAY' | 'NUMBER_OF_PASSES';

export type CzmPrimitiveType =
    'POINTS' |
    'LINES' |
    'LINE_LOOP' |
    'LINE_STRIP' |
    'TRIANGLES' |
    'TRIANGLE_STRIP' |
    'TRIANGLE_FAN';

export const primitiveTypeEnums = [
    ['POINTS', 'POINTS'],
    ['LINES', 'LINES'],
    ['LINE_LOOP', 'LINE_LOOP'],
    ['LINE_STRIP', 'LINE_STRIP'],
    ['TRIANGLES', 'TRIANGLES'],
    ['TRIANGLE_STRIP', 'TRIANGLE_STRIP'],
    ['TRIANGLE_FAN', 'TRIANGLE_FAN'],
] as [name: string, value: string][];

export type CzmCustomPrimitiveUniformType = number | [number, number] | [number, number, number] | [number, number, number, number] | { type: 'image', uri: string } | { type: 'texture', id: string };
export type CzmCustomPrimitiveUniformMapType = { [k: string]: CzmCustomPrimitiveUniformType };

export const passEnums = [
    ['ENVIRONMENT', 'ENVIRONMENT'],
    ['COMPUTE', 'COMPUTE'],
    ['GLOBE', 'GLOBE'],
    ['TERRAIN_CLASSIFICATION', 'TERRAIN_CLASSIFICATION'],
    ['CESIUM_3D_TILE', 'CESIUM_3D_TILE'],
    ['CESIUM_3D_TILE_CLASSIFICATION', 'CESIUM_3D_TILE_CLASSIFICATION'],
    ['CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW', 'CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW'],
    ['OPAQUE', 'OPAQUE'],
    ['TRANSLUCENT', 'TRANSLUCENT'],
    ['OVERLAY', 'OVERLAY'],
    ['NUMBER_OF_PASSES', 'NUMBER_OF_PASSES'],
] as [name: string, value: string][];

export type AttributeJsonType = {
    typedArray: {
        type: 'Float32Array' | 'Float64Array' | 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array';
        array: number[];
    };
    componentsPerAttribute: 1 | 2 | 3 | 4;
    //@ts-ignore
    usage?: Cesium.BufferUsage;
    normalize?: boolean;
}

export type AttributesJsonType = {
    [k: string]: AttributeJsonType;
}

export type IndexJsonType = {
    type: 'Uint8Array' | 'Uint16Array' | 'Uint32Array';
    array: number[];
}

export type BoundingVolumeJsonType = {
    type: 'BoundingSphere';
    data: { center: [number, number, number], radius: number };
} | {
    type: 'LocalBoundingSphere';
    data: { center: [number, number, number], radius: number };
} | {
    type: 'BoundingRectangle';
    data: [west: number, south: number, east: number, north: number];
    // } | {
    //     type: 'OrientedBoundingBox';
    //     data: {
    //         center: [number, number, number];
    //         halfAxes: [number, number, number, number, number, number, number, number, number];
    //     };
} | {
    type: 'LocalAxisedBoundingBox';
    data: {
        min: [number, number, number];
        max: [number, number, number];
    };
};

export type BlendEquation = 32774 | 32778 | 32779 | 32775 | 32776;
export type BlendFunction = 0 | 1 | 768 | 769 | 774 | 775 | 770 | 771 | 772 | 773 | 32769 | 32770 | 32771 | 32772 | 776
export type StencilFunction = 512 | 513 | 514 | 515 | 516 | 517 | 518 | 519
export type StencilOperation = 0 | 7680 | 7681 | 7682 | 7683 | 5386 | 34055 | 34056

export interface RenderStateOptions {
    // 默认值：2305 可选值: 2304(CLOCKWISE顺时针), 2305(COUNTER_CLOCKWISE逆时针)
    frontFace?: number,
    cull?: {
        enabled?: boolean, // false
        // 默认值：1029 可选值：1028(FRONT), 1029(BACK), 1032(FRONT_AND_BACK)
        face?: 1028 | 1029 | 1032,
    },
    lineWidth?: number, // 1 windows系统只能是，显卡驱动原因，设置其他数值不起作用！
    polygonOffset?: {
        enabled?: boolean, // false
        factor?: number, // 0,
        units?: number, // 0
    },
    scissorTest?: {
        enabled?: boolean, // false,
        rectangle?: {
            x?: number, // 0,
            y?: number, // 0,
            width?: number, // 0,
            height?: number, // 0
        }
    },
    depthRange?: {
        near?: number, // 0,
        far?: number, // 1
    },
    depthTest?: {
        enabled?: boolean; // false,
        // 默认值:513 可选值：512(NEVER), 513(LESS), 514(EQUAL), 515(LESS_OR_EQUAL), 
        //   516(GREATER), 517(NOT_EQUAL), 518(GREATER_OR_EQUAL), 519(ALWAYS)
        func?: 512 | 513 | 514 | 515 | 516 | 517 | 518 | 519;
    },
    colorMask?: {
        red?: boolean, // true,
        green?: boolean, // true,
        blue?: boolean, // true,
        alpha?: boolean, // true
    },
    depthMask?: boolean, // true,
    stencilMask?: number, // ~0
    blending?: {
        enabled?: boolean, // false,
        color?: {
            red?: number, // 0.0,
            green?: number, // 0.0,
            blue?: number, // 0.0,
            alpha?: number, // 0.0
        },
        // 默认值：32774, 可选值：32774(ADD), 32778(SUBTRACT), 32779(REVERSE_SUBTRACT), 32775(MIN), MIN(MAX)
        equationRgb?: BlendEquation, // BlendEquation.ADD,
        // 默认值：32774, 可选值：32774(ADD), 32778(SUBTRACT), 32779(REVERSE_SUBTRACT), 32775(MIN), MIN(MAX)
        equationAlpha?: BlendEquation, // BlendEquation.ADD,
        // BlendFunction类型可选值：0(ZERO), 1(ONE), 768(SOURCE_COLOR), 769(ONE_MINUS_SOURCE_COLOR),
        //   774(DESTINATION_COLOR), 775(ONE_MINUS_DESTINATION_COLOR), 770(SOURCE_ALPHA),
        //   771(ONE_MINUS_SOURCE_ALPHA), 772(DESTINATION_ALPHA), 773(ONE_MINUS_DESTINATION_ALPHA),
        //   32769(CONSTANT_COLOR), 32770(ONE_MINUS_CONSTANT_COLOR), 32771(CONSTANT_ALPHA),
        //   32772(ONE_MINUS_CONSTANT_ALPHA), 776(SOURCE_ALPHA_SATURATE)
        // 默认值：1, 可选值参见上方BlendFunction类型可选值
        functionSourceRgb?: BlendFunction, // BlendFunction.ONE,
        // 默认值：1, 可选值参见上方BlendFunction类型可选值
        functionSourceAlpha?: BlendFunction, // BlendFunction.ONE,
        // 默认值：0, 可选值参见上方BlendFunction类型可选值
        functionDestinationRgb?: BlendFunction, // BlendFunction.ZERO,
        // 默认值：0, 可选值参见上方BlendFunction类型可选值
        functionDestinationAlpha?: BlendFunction, // BlendFunction.ZERO
    },
    stencilTest?: {
        enabled?: boolean, // false,
        // StencilFunction类型可选值：512(NEVER), 513(LESS), 514(EQUAL), 515(LESS_OR_EQUAL),
        //   516(GREATER), 517(NOT_EQUAL), 518(GREATER_OR_EQUAL), 519(ALWAYS)
        // 默认值 519, 可选值参见StencilFunction类型可选值
        frontFunction?: StencilFunction, // StencilFunction.ALWAYS,
        // 默认值 519, 可选值参见StencilFunction类型可选值
        backFunction?: StencilFunction, // StencilFunction.ALWAYS,
        reference?: number; // 0,
        mask?: number; // ~0,
        // StencilOperation类型可选值：0(ZERO), 7680(KEEP), 7681(REPLACE), 7682(INCREMENT),
        //   7683(DECREMENT), 5386(INVERT), 34055(INCREMENT_WRAP), 34056(DECREMENT_WRAP)
        frontOperation?: {
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            fail?: StencilOperation, // StencilOperation.KEEP,
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            zFail?: StencilOperation, // StencilOperation.KEEP,
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            zPass?: StencilOperation, // StencilOperation.KEEP
        },
        backOperation?: {
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            fail?: StencilOperation, // StencilOperation.KEEP,
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            zFail?: StencilOperation, // StencilOperation.KEEP,
            // 默认值：7680，可选值参见上方StencilOperation类型可选值
            zPass?: StencilOperation, // StencilOperation.KEEP
        }
    },
    sampleCoverage?: {
        enabled?: boolean, // false,
        value?: number, // 1.0,
        invert?: boolean, // false
    }
}