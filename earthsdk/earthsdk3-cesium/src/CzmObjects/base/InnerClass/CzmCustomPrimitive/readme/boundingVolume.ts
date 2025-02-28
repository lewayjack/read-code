export const boundingVolumeReadMe = `\
### 默认的BoundingVolume
\`\`\`
type: 'LocalAxisedBoundingBox',
data: {
    min: [0, -1, 0],
    max: [1, 0, 0],
}
\`\`\`

### BoundingVolume类型规格
\`\`\`
export type BoundingVolumeJsonType = {
    type: 'BoundingSphere'; // BoundingSphere表示世界坐标系下的包围球, center为[经度, 纬度, 高度], radius单位为米
    data: { center: [number, number, number], radius: number };
} | {
    type: 'LocalBoundingSphere'; // LocalBoundingSphere表示本地坐标系下的包围球, center本地坐标系下的[x, y, z]，单位是米, radius单位为米
    data: { center: [number, number, number], radius: number };
} | {
    type: 'BoundingRectangle'; // 指定地球上的矩形区域，分别用最西侧经度、最南侧纬度、最东侧经度、最北侧纬度来表示一个矩形范围
    data: [west: number, south: number, east: number, north: number];
} | {
    type: 'LocalAxisedBoundingBox'; // 本地坐标系下，min为最小角点，max为最大角点，推荐使用此种方式！
    data: {
        min: [number, number, number];
        max: [number, number, number];
    };
};
\`\`\`
`;

