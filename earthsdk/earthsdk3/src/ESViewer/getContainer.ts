
export function getContainer(container: string | HTMLDivElement | HTMLElement) {
    if (typeof container === 'string') {
        return document.getElementById(container);
    } else {
        return container;
    }
}

export function clearContainer(container: HTMLDivElement) {
    if (!container) throw new Error('container is not defined');
    container.innerHTML = '';
    // 创建一个空的div容器
    const innerContainer = document.createElement('div');
    innerContainer.style.cssText = `width: 100%; height: 100%; margin: 0px; padding: 0px; border: none; overflow: hidden; position: relative; z-index: 0; background: rgba(0,0,0,0);`
    container.appendChild(innerContainer);
    return innerContainer;
}
