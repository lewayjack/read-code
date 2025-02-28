// 图片转base64
export type ImageBaseInfo = { width: number, height: number, url: string, base64: string };

export function imgUrlToBase64(imgUrl: string): Promise<ImageBaseInfo | undefined> {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = imgUrl + "?v=" + Math.random(); // 处理缓存
        image.crossOrigin = "*"; // 支持跨域图片
        image.onload = function () {
            resolve({
                width: image.width,
                height: image.height,
                base64: getBase64Image(image),
                url: imgUrl
            }); //调用函数并将其转为base64图片
        };
        image.onerror = function () {
            resolve(undefined);
        }
    })
    function getBase64Image(img: HTMLImageElement) {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
        let dataURL = canvas.toDataURL("image/" + ext);
        return dataURL;
    }
}