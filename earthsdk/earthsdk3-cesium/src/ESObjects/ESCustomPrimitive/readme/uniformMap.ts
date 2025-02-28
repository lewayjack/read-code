export const uniformMapReadMe = `\
### 默认使用的UniformMap
\`\`\`
{
    "myImage": { 
        "type": "image", 
        "uri": "\${xe2-assets-script-dir}/xe2-assets/scene-manager/images/location.png"
    }
}
\`\`\`

### 示例1
\`\`\`
{
    "myImage": { 
        "type": "image", 
        "uri": "\${xe2-assets-script-dir}/xe2-assets/scene-manager/images/location.png"
    },
    "ratio": 0.5,
}
\`\`\`

### 示例2
\`\`\`
{
    "u_image": {
        "type": "texture",
        "id": "3010d3bd-cbf8-46cd-939f-c0b39b926255"
    },
    "ratio": 0.5,
}

\`\`\`

### 示例3
\`\`\`
{
    "ratioAndStart": [0.5, 0.7],
}
\`\`\`

### UniformMap类型规格
\`\`\`
export type CzmCustomPrimitiveUniformType = number | [number, number] | [number, number, number] | [number, number, number, number] | { type: 'image', uri: string };
export type CzmCustomPrimitiveUniformMapType = { [k: string]: CzmCustomPrimitiveUniformType };
\`\`\`
`