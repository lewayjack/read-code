export function inOrderRunning(func: Function) {
    const time = setTimeout(() => {
        func();
        clearTimeout(time);
    });
}