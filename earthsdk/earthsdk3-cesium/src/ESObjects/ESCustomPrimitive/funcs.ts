import { CzmAttributesType, CzmIndexType } from "../../ESJTypesCzm";
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