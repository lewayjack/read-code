import { CzmAttributesType } from "../../../../ESJTypesCzm";
import { BoundingVolumeJsonType, CzmCustomPrimitiveUniformMapType } from "./types";

export const defaultVertexShaderSource = `\
in vec3 position;
in vec3 normal;
in vec2 st;
out vec3 v_normalEC;
out vec2 v_st;
void main()
{
    // 如果这一句注释，要相应地注释掉attribute中的normal，也就是说顶点属性要和shader中的一一匹配！
    v_normalEC = czm_normal * normal; 
    v_st = st;
    gl_Position = czm_modelViewProjection * vec4(position, 1.0);
}
`;

export const defaultFragmentShaderSource = `\
in vec2 v_st;
uniform sampler2D u_image;
uniform vec4 u_color;
void main()
{
    vec4 imageColor = texture(u_image, v_st);
    out_FragColor = imageColor * u_color;
}
`;

export const defaultBoundingVolume: BoundingVolumeJsonType = {
    type: 'LocalAxisedBoundingBox',
    data: {
        min: [0, -1, 0],
        max: [1, 0, 0],
    }
};

export const defaultRenderState = {
    depthTest: {
        enabled: true,
    },
    cull: {
        enabled: true,
        face: 1029, // FRONT: 1028; BACK: 1029; FRONT_AND_BACK: 1032
    },
    depthMask: false,
    blending: {
        enabled: true,
        equationRgb: 0x8006, // ADD: 0x8006; 
        equationAlpha: 0x8006, // ADD: 0x8006; 
        functionSourceRgb: 0x0302, // SRC_ALPHA: 0x0302
        functionSourceAlpha: 1, // ONE: 1
        functionDestinationRgb: 0x0303, // ONE_MINUS_SRC_ALPHA
        functionDestinationAlpha: 0x0303, // ONE_MINUS_SRC_ALPHA
    }
};


// if (translucent) {
//     rs.depthMask = false;
//     rs.blending = BlendingState.ALPHA_BLEND;
// }

// if (closed) {
//     rs.cull = {
//         enabled: true,
//         face: CullFace.BACK,
//     };
// }

export const defaultUniformMap: CzmCustomPrimitiveUniformMapType = {
    // myImage: { type: 'image', uri: '${earthsdk3-assets-script-dir}/assets/img/jerry.png' },
    u_image: { type: 'image', uri: '' },
    u_color: [1., 1., 0, 1.],
}

export const defaultAttribute: CzmAttributesType = {
    position: {
        typedArray: new Float32Array([0, 0, 0, 0, -1, 0, 1, -1, 0, 0, 0, 0, 1, -1, 0, 1, 0, 0]),
        componentsPerAttribute: 3,
    },
    normal: {
        typedArray: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
        componentsPerAttribute: 3,
    },
    textureCoordinates: {
        typedArray: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1]),
        componentsPerAttribute: 2,
    }
}

export const defaultIndexTypedArray = new Uint16Array([0, 1, 2, 3, 4, 5]);

export const defaultDsAttribute: CzmAttributesType = {
    position: {
        typedArray: new Float32Array([0, 0, 0, 0, -1, 0, 1, -1, 0, 0, 0, 0, 1, -1, 0, 1, 0, 0, 0, 0, 0, 0, -1, 0, 1, -1, 0, 0, 0, 0, 1, -1, 0, 1, 0, 0]),
        componentsPerAttribute: 3,
    },
    normal: {
        typedArray: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]),
        componentsPerAttribute: 3,
    },
    textureCoordinates: {
        typedArray: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1]),
        componentsPerAttribute: 2,
    }
}

export const defaultDsIndexTypedArray = new Uint16Array([0, 1, 2, 3, 4, 5, 8, 7, 6, 11, 10, 9]);
