import * as Cesium from 'cesium';

export function capture(scene: Cesium.Scene, width: number = 128, height: number = 128, format: 'image/jpeg' | 'image/png' = 'image/jpeg') {
    let captureScreenCanvas: HTMLCanvasElement | undefined = undefined;
    return new Promise<string>((resolve, reject) => {
        // @ts-ignore
        var removeEventListenFunc = scene._postRender.addEventListener(() => {

            let sceneCanvas = scene.canvas;
            let sceneWidth = sceneCanvas.width;
            let sceneHeight = sceneCanvas.height;

            if (!captureScreenCanvas) {
                captureScreenCanvas = document.createElement('canvas');
            }
            captureScreenCanvas.setAttribute('width', `${width}`);
            captureScreenCanvas.setAttribute('height', `${height}`);

            let sx, sy, sw, sh;
            //裁剪范围 判定按 w  或者 h 缩放
            if (sceneWidth / width < sceneHeight / height) {
                sx = 0;
                sw = sceneWidth;
                sh = height * sceneWidth / width;
                sy = (sceneHeight - sh) * 0.5;
            }
            else {
                sy = 0;
                sh = sceneHeight;
                sw = width * sceneHeight / height;
                sx = (sceneWidth - sw) * 0.5;
            }

            let ctx = captureScreenCanvas.getContext('2d');
            if (!ctx) {
                removeEventListenFunc();
                reject(new Error(`captureScreenCanvas.getContext('2d') error!`));
                return;
            }
            ctx.drawImage(sceneCanvas, sx, sy, sw, sh, 0, 0, width, height);
            let img64 = captureScreenCanvas.toDataURL(format);
            removeEventListenFunc();
            resolve(img64);
        }, null);
    });
}