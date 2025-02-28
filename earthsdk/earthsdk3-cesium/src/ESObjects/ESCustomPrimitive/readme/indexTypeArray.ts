export const indexTypeArrayReadMe = `\
### 默认的索引数组
\`\`\`
{
    "type": "Uint16Array",
    "array": [0, 1, 2, 3, 4, 5]
}
\`\`\`

### 索引类型规格说明
\`\`\`
export type IndexJsonType = {
    type: 'Uint8Array' | 'Uint16Array' | 'Uint32Array';
    array: number[];
}
\`\`\`
`;
