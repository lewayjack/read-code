export function getContainer(container: string | HTMLDivElement | HTMLElement): HTMLDivElement {
    if (typeof container === 'string') {
        return document.getElementById(container) as HTMLDivElement;
    } else {
        return container as HTMLDivElement;
    }
}

