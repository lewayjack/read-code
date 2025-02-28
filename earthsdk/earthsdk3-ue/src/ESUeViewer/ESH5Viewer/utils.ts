

export function resourcesDownload(url: string, responseType: XMLHttpRequestResponseType = 'blob', dlprogress?: (url: string, loaded: number, total: number, isDone: boolean) => void) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Cache-Control', 'max-age=86400');
        xhr.responseType = responseType;
        dlprogress && dlprogress(url, 0, 1, false);
        xhr.onload = function () {
            if (xhr.status == 0 || (xhr.status >= 200 && xhr.status < 300)) {
                var len = xhr.response.size || xhr.response.byteLength;
                dlprogress && dlprogress(url, len, len, true);
                resolve(xhr.response);
            } else {
                reject({ status: xhr.status, statusText: xhr.statusText });
            }
        };
        let contentLength = 1;
        xhr.onprogress = function (p) {
            dlprogress && dlprogress(url, p.loaded, (p.lengthComputable ? p.total : contentLength), false);
        };
        xhr.onerror = function (e) {
            reject({ status: xhr.status || 404, statusText: xhr.statusText });
        };
        xhr.onreadystatechange = function () {
            if (xhr.readyState == xhr.HEADERS_RECEIVED) {
                contentLength = Number(xhr.getResponseHeader('Content-Length')) || 1;
            }
        }
        xhr.send(null);
    });
}


export function addScriptToDom(scriptCode: Blob) {
    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        const blob = (scriptCode instanceof Blob) ? scriptCode : new Blob([scriptCode], { type: 'text/javascript' });
        const objectUrl = URL.createObjectURL(blob);
        script.src = objectUrl;
        script.onload = function () {
            script.onload = script.onerror = null; // 删除这些 onload 和 onerror 处理程序，因为这些捕获 Promise 的输入和输入函数，这会泄漏大量内存！
            URL.revokeObjectURL(objectUrl); // 释放 blob。请注意，出于调试目的，可以注释掉以便能够在调试器中读取源。
            resolve(script);
        }
        script.onerror = function (e) {
            script.onload = script.onerror = null; // 删除这些 onload 和 onerror 处理程序，因为这些捕获 Promise 的输入和输入函数，这会泄漏大量内存！
            URL.revokeObjectURL(objectUrl);
            console.error('脚本未能添加到 DOM:' + e);
            console.error(scriptCode);
            console.error(e);
            reject(objectUrl);
        }
        document.body.appendChild(script);
    });
}

export function formatBytes(bytes: number) {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}


const UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;


export const UTF8ArrayToString = (heapOrArray: any, idx = 0, maxBytesToRead = NaN) => {
    const endIdx = idx + maxBytesToRead;
    let endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    let str = '';
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
            if ((u0 & 0xF8) != 0xF0) {
                console.warn('Invalid UTF-8 leading byte ' + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
            }
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }

        if (u0 < 0x10000) {
            str += String.fromCharCode(u0);
        } else {
            var ch = u0 - 0x10000;
            str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
    }
    return str;
};


export const UTF8ToString = (ptr: any, maxBytesToRead?: any) => {
    //@ts-ignore
    return (ptr && window.HEAPU8) ? UTF8ArrayToString(window.HEAPU8, ptr, maxBytesToRead) : '';
};
