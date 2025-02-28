/**
 * 判断是否可用，若图片是相对路径会转换为绝对路径
 * @param relativeUrl 图片地址 
 * @param callback 回调函数
 * @example
 * const relativeUrl: string = 'images/picture.jpg';
 * checkAndConvertImage(relativeUrl, (absoluteUrl: string, isAvailable: boolean) => {
 * if (isAvailable) {
 *      console.log('图片地址可用: ' + absoluteUrl);
 *  } else {
 *      console.log('图片地址不可用: ' + absoluteUrl);
 *    }
 * });
 */
export function checkAndConvertImage(relativeUrl: string, callback: (absoluteUrl: string, isAvailable: boolean) => void): void {
    // 创建一个临时的 <a> 元素
    const a = document.createElement('a');
    // 将相对路径赋值给 <a> 元素的 href 属性，浏览器会解析并转换为绝对路径
    a.href = relativeUrl;
    const absoluteUrl = a.href;

    const img = new Image();

    img.onload = () => {
        // 图片加载成功，调用回调函数，传入绝对路径和 true
        callback(absoluteUrl, true);
        // 移除创建的 <a> 标签
        a.remove();
        // 解除对 Image 对象的引用，以便垃圾回收
        img.onload = img.onerror = null;
    };

    img.onerror = () => {
        // 图片加载失败，调用回调函数，传入绝对路径和 false
        callback(absoluteUrl, false);
        // 移除创建的 <a> 标签
        a.remove();
        // 解除对 Image 对象的引用，以便垃圾回收
        img.onload = img.onerror = null;
    };

    // 设置图片的 src 属性，触发加载
    img.src = absoluteUrl;
}
/**
 * 相对地址转绝对地址，以'./'或者'../'或者'/'开头的路径，其他url则返回原值
 * @param url 相对路径，
 * @returns 
 */
export function rpToap(url: string) {
    if (!(url.startsWith('./') || url.startsWith('../') || url.startsWith('/'))) return url;
    const a = document.createElement('a');
    a.href = url;
    const absoluteUrl = a.href;
    a.remove();
    return absoluteUrl;
}
