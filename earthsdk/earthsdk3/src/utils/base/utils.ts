/**
 * 判断是否为JSON字符串
 * @param str 字符串
 * @returns 
 */
export function isJSONString(str: string) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}
