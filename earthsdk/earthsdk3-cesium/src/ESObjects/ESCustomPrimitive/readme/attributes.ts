export const attributesReadMe = `\
### 默认的顶点属性
\`\`\`
{
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
\`\`\`

### Attributes类型规格
\`\`\`
export type AttributeJsonType = {
    typedArray: {
        type: 'Float32Array' | 'Float64Array' | 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array';
        array: number[];
    };
    componentsPerAttribute: 1 | 2 | 3 | 4;
    usage?: Cesium.BufferUsage;
    normalize?: boolean;
}

export type AttributesJsonType = {
    [k: string]: AttributeJsonType;
}
\`\`\`
`