// https://math.nist.gov/MatrixMarket/formats.html
class Link {
    constructor(
        i: number,
        j: number,
        v: number
    ) { }
}
let rawData: string = null;
let links: Array<Link> = [];
let size = 0;
async function LoadData() {
    if (rawData) return;
    let r = await fetch("/1138_bus.mtx");
    rawData = await r.text();
    const lines = rawData.split("\n");
    for (const line of lines) {
        if (line.length == 0) continue;
        if (line[0] == '%') continue;
        const parts = line.split(' ');
        if (size == 0) {
            const pn = parts.map(x => parseInt(x));
            if (pn[0] != pn[1] || pn[0] == 0) throw "Read .mtx error";
            size = pn[0];
        } else {
            if (parts.length != 3) throw "Read .mtx error";
            const m = parseInt(parts[0]), n = parseInt(parts[1]), v = parseFloat(parts[2]);

            links.push({ m: m - 1, n: n - 1, v: v });
        }
    }
}

export const GetNodes = async function () {
    await LoadData();

    const iterable = (function* () {
        for (let i = 0; i < size; i++) {
            yield 0;
            yield 0;
            yield 0;
        }
    })();
    const nodes = new Float32Array(iterable);
    console.log(nodes.length);
    return nodes;
}
export const GetLinks = async function () {
    await LoadData();
    const itr = links[Symbol.iterator]();
    const iterable = (function* () {
        let i: any;
        while ((i = itr.next()) && !i.done) {
            if (i.value.i >= i.value.j) throw "i>=j";
            yield i.value.m;
            yield i.value.n;
        }
    })();

    const _links = new Uint32Array(iterable);
    console.log(_links.length);
    return _links;
}

export const GetLinkWeights = async function () {
    await LoadData();
    const itr = links[Symbol.iterator]();
    const iterable = (function* () {
        let i: any;
        while ((i = itr.next()) && !i.done) {
            if (i.value.i >= i.value.j) throw "i>=j";
            yield i.value.v;
        }
    })();

    const _links = new Float32Array(iterable);
    console.log(_links.length);
    return _links;
}

export const GetNodeColors = async function () {
    await LoadData();
    const iterable = (function* () {
        for (let i = 0; i < size; i++) {
            yield 0;
            yield 0;
            yield 0;
        }
    })();
    const nodes = new Float32Array(iterable);
    console.log(nodes.length);
    return nodes;
}