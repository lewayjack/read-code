export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export const createMsgInput = (inputdata: ArrayBuffer) => {
    const data = {
        type: "input",
        inputdata: arrayBufferToBase64(inputdata)
    }
    return JSON.stringify(data);
}

export function getContainer(container: string | HTMLDivElement | HTMLElement): HTMLDivElement {
    if (typeof container === 'string') {
        return document.getElementById(container) as HTMLDivElement;
    } else {
        return container as HTMLDivElement;
    }
}

