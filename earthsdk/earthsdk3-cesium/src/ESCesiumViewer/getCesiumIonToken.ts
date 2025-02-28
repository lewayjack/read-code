export function getCesiumIonToken() {
    const ionTokenUriFromGitee = `https://gitee.com/mirrors/CesiumJS/blob/main/packages/engine/Source/Core/Ion.js#L7`;
    const ionTokenUriFromGithub = `https://github.com/CesiumGS/cesium/blob/main/packages/engine/Source/Core/Ion.js#L7`;
    const info = `\
    因浏览器同源策略限制，需要用户自行打开网址获取最新的token，点击确定自动打开网址，请不要拦截！
    github地址：${ionTokenUriFromGithub}
    gitee地址：${ionTokenUriFromGitee}
    `
    console.log(info);
    const choosedIonUri = window.prompt(info, ionTokenUriFromGitee);
    if (choosedIonUri) {
        window.open(choosedIonUri, '_blank');
    }
}
