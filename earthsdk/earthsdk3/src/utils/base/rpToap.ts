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
