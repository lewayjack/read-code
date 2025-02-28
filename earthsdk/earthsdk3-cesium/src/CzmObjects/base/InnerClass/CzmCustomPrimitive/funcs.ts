import { CzmAttributesType, CzmIndexType } from "../../../../ESJTypesCzm";
import { AttributesJsonType, IndexJsonType } from "./types";

export function attributesToAttributesJson(attributes: CzmAttributesType) {
    const attributesJson: AttributesJsonType = {};
    for (let key of Object.keys(attributes)) {
        const { typedArray, componentsPerAttribute, usage, normalize } = attributes[key];
        attributesJson[key] = {
            typedArray: {
                // @ts-ignore
                type: typedArray.constructor.name,
                array: [...typedArray.values()],
            },
            componentsPerAttribute,
            usage,
            normalize,
        }
    }
    return attributesJson;
}

export function attributesJsonToAttributes(attributesJson: AttributesJsonType) {
    const attributes: CzmAttributesType = {};
    for (let key of Object.keys(attributesJson)) {
        const { typedArray: { type, array }, componentsPerAttribute, usage, normalize } = attributesJson[key];
        attributes[key] = {
            typedArray: new global[type](array),
            componentsPerAttribute,
            usage,
            normalize,
        };
    }
    return attributes;
}

export function indexToIndexJson(indexTypedArray: CzmIndexType) {
    return {
        type: indexTypedArray.constructor.name,
        array: [...indexTypedArray.values()],
    } as IndexJsonType;
}

export function indexJsonToIndex(indexJson: IndexJsonType) {
    const { type, array } = indexJson;
    return new global[type](array);
}

export function triangleIndicesToLine(triangleIndices: number[]) {
    if (triangleIndices.length % 3 === 0) {
        console.warn(`当前传入的索引不是3的倍数，可能不是三角片的索引！`);
    }
    const l = triangleIndices.length / 3 | 0;
    const lineIndices: number[] = new Array(l * 6);
    for (let i = 0; i < l; ++i) {
        lineIndices[i * 6 + 0] = triangleIndices[i * 3 + 0];
        lineIndices[i * 6 + 1] = triangleIndices[i * 3 + 1];
        lineIndices[i * 6 + 2] = triangleIndices[i * 3 + 2];
        lineIndices[i * 6 + 3] = triangleIndices[i * 3 + 1];
        lineIndices[i * 6 + 4] = triangleIndices[i * 3 + 2];
        lineIndices[i * 6 + 5] = triangleIndices[i * 3 + 0];
    };
    return lineIndices;
}