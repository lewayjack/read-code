import { getFloat32ArrayFromBuffer, getStrFromBuffer, getUint16ArrayFromBuffer, getUint32ArrayFromBuffer, getUint32FromBuffer, getUint8ArrayFromBuffer } from "./bufferUtils";

export type ParseGlbResultType = {
    version: number;
    length: number;
    gltfJson: string;
    gltfBinary?: ArrayBuffer | Uint8Array;
};

export function parseGlb(glbBuffer: ArrayBuffer | ArrayBufferView) {
    // magic
    const magic = getStrFromBuffer(glbBuffer, 0, 4);
    if (magic !== "glTF") {
        // throw new Error("Not a glTF file");
        console.error("Not a glTF file");
        return undefined;
    }

    // version
    const version = getUint32FromBuffer(glbBuffer, 4);
    if (version !== 2) {
        console.error("Unsupported glTF version");
        return undefined;
    }

    // length
    const length = getUint32FromBuffer(glbBuffer, 8);
    if (length !== glbBuffer.byteLength) {
        console.error("Invalid glTF length");
        return undefined;
    }

    // chunk length
    const chunkLength = getUint32FromBuffer(glbBuffer, 12);
    if (chunkLength + 12 + 4 > length) {
        console.error("Invalid glTF chunk length");
        return undefined;
    }

    // chunk type
    const chunkType = getStrFromBuffer(glbBuffer, 16, 4);
    if (chunkType !== "JSON") {
        console.error("Invalid glTF chunk type");
        return undefined;
    }

    // json
    const json = getStrFromBuffer(glbBuffer, 20, chunkLength);

    const result: ParseGlbResultType = {
        version,
        length,
        gltfJson: json,
    }

    do {
        if (20 + chunkLength >= glbBuffer.byteLength) {
            break;
        }

        // chunk length
        const chunkLength2 = getUint32FromBuffer(glbBuffer, 20 + chunkLength);

        // chunk type
        const chunkType2 = getStrFromBuffer(glbBuffer, 20 + chunkLength + 4, 4);
        if (chunkType2 !== "BIN\0") {
            console.error("Invalid glTF chunk type");
            return undefined;
        }

        // binary
        const binary = getUint8ArrayFromBuffer(glbBuffer, 20 + chunkLength + 8, chunkLength2);

        result.gltfBinary = binary;
    } while (false);

    return result;
}

// @ts-ignore
window.parseGlb = parseGlb;

export function parseWaterGlb(glbBuffer: ArrayBuffer | ArrayBufferView) {
    const glbParseResult = parseGlb(glbBuffer);
    if (glbParseResult === undefined) {
        return undefined;
    }
    if (!glbParseResult.gltfBinary) return undefined;

    const gj = JSON.parse(glbParseResult.gltfJson);

    return gj.nodes.map((node: any) => {
        var mesh = gj.meshes[node.mesh]
        var posIndex = mesh.primitives[0].attributes.POSITION
        var indicesIndex = mesh.primitives[0].indices

        var posAccessor = gj.accessors[posIndex]
        var posBufferView = gj.bufferViews[posAccessor.bufferView]
        if (!glbParseResult.gltfBinary) throw new Error(`!glbParseResult.gltfBinary`);
        const posBuffer = getFloat32ArrayFromBuffer(glbParseResult.gltfBinary, posBufferView.byteOffset ?? 0, posBufferView.byteLength / 4)

        var indicesAccessor = gj.accessors[indicesIndex]
        var indicesBufferView = gj.bufferViews[indicesAccessor.bufferView]
        if (!glbParseResult.gltfBinary) throw new Error(`!glbParseResult.gltfBinary`);

        let indicesBuffer: Uint8Array | Uint16Array | Uint32Array | undefined;
        if (5121 === indicesAccessor.componentType) {
            indicesBuffer = getUint8ArrayFromBuffer(glbParseResult.gltfBinary, indicesBufferView.byteOffset ?? 0, indicesBufferView.byteLength / 1)
        } else if (5123 === indicesAccessor.componentType) {
            indicesBuffer = getUint16ArrayFromBuffer(glbParseResult.gltfBinary, indicesBufferView.byteOffset ?? 0, indicesBufferView.byteLength / 2)
        } else if (5125 === indicesAccessor.componentType) {
            indicesBuffer = getUint32ArrayFromBuffer(glbParseResult.gltfBinary, indicesBufferView.byteOffset ?? 0, indicesBufferView.byteLength / 4)
        }

        return {
            name: node.name,
            posBuffer,
            indicesBuffer,
        };
    })
}

// 自定义设置

// lsso.attributes = {
//     position: {
//         typedArray: r[0].posBuffer,
//         componentsPerAttribute: 3
//     }
// }

// lsso.indexTypedArray = r[0].indicesBuffer

// @ts-ignore
window.parseWaterGlb = parseWaterGlb;