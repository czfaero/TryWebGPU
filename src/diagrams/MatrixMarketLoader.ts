// https://math.nist.gov/MatrixMarket/formats.html

let rawData: string = null;
async function LoadData() {
    if (rawData) return;
    let r = await fetch("/1138_bus.mtx");

}

export const GetNodes = function () {
    let x = 0, y = 0, z = 0;
    const iterable = (function* () {

    })();
    const nodes = new Float32Array(iterable);
    console.log(nodes.length);
    return nodes;
}
export const GetLinks = function () {
    const links = new Uint32Array([

    ]);

    return links;
}
export const GetNodeColors = function () {
    let r = 1, g = 0, b = 0, t;
    const iterable = (function* () {

    })();
    const colors = new Float32Array(iterable);
    console.log(colors.length);
    return colors;
}