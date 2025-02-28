export function getStrFromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number, byteCount: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }
    
    const chars = new Array(byteCount);
    const dv = new DataView(buffer);
    for (let i = 0; i < byteCount; ++i) {
        const n = dv.getUint8(byteOffset + i);
        chars[i] = String.fromCharCode(n);
    }
    return chars.join('');
}

export function getUint32FromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }
    return new DataView(buffer).getUint32(byteOffset, true)
}

export function getUint8ArrayFromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number, length: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }
    if (byteOffset + length > buffer.byteLength) {
        console.error('byteOffset + length > buffer.byteLength');
        return undefined;
    }
    return new Uint8Array(buffer, byteOffset, length);
}

export function getUint16ArrayFromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number, length: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }

    if (byteOffset + length * 2 > buffer.byteLength) {
        console.error('byteOffset + length * 4 > buffer.byteLength');
        return undefined;
    }

    return new Uint16Array(buffer, byteOffset, length);
}

export function getUint32ArrayFromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number, length: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }

    if (byteOffset + length * 4 > buffer.byteLength) {
        console.error('byteOffset + length * 4 > buffer.byteLength');
        return undefined;
    }

    return new Uint32Array(buffer, byteOffset, length);
}

export function getFloat32ArrayFromBuffer(bufferOrView: ArrayBuffer | ArrayBufferView, byteOffset: number, length: number) {
    const isView = ('buffer' in bufferOrView);
    const buffer = isView ? bufferOrView.buffer : bufferOrView;
    if (isView) {
        byteOffset += bufferOrView.byteOffset;
    }

    if (byteOffset + length * 4 > buffer.byteLength) {
        console.error('byteOffset + length * 4 > buffer.byteLength');
        return undefined;
    }

    return new Float32Array(buffer, byteOffset, length);
}