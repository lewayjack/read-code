export const renderStateReadMe = `\
### 默认使用的渲染状态
\`\`\`
{
    depthTest: {
        enabled: true,
    },
    cull: {
        enabled: true,
        face: 1029,
    },
    blending: {
        enabled: true,
        equationRgb: 0x8006,
        equationAlpha: 0x8006,
        functionSourceRgb: 0x0302,
        functionSourceAlpha: 1,
        functionDestinationRgb: 0x0303,
        functionDestinationAlpha: 0x0303,
    }
};
\`\`\`

### 所有状态值说明
\`\`\`
interface RenderStateOptions {
    // 默认值：2305 可选值: 2304(CLOCKWISE顺时针), 2305(COUNTER_CLOCKWISE逆时针)
    frontFace?: number, 
    cull?: {
        enabled?: boolean, // false
        // 默认值：1029 可选值：1028(FRONT), 1029(BACK), 1032(FRONT_AND_BACK)
        face?: CullFace, // CullFace.BACK
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
        func?: number; 
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
\`\`\`
`;