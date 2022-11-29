
class Edge {
    constructor(
        i: number,
        j: number
    ) { }
}
export class SGDRunner {
    _lambda: number;
    eta_max: number;
    edgeBuffer: Uint32Array;
    edgeCount: number;
    vertexBuffer: Float32Array;
    vertexDimension: number;
    vertexCount: number;


    private *annealing(_lambda: number, eta_max: number) {
        let eta = eta_max;
        let e_lambda = Math.pow(Math.E, -_lambda)
        while (eta > 1e-10) {
            eta = eta * e_lambda;
            yield eta;
        }
    }

    private getEdge(i: number) {
        return new Edge(this.edgeBuffer[i], this.edgeBuffer[i + 1]);
    }
    private getVertex(i: number) {
        return this.vertexBuffer.slice(
            i * this.vertexDimension, (i + 1) * this.vertexDimension)
    }
    private setVertex(i: number, value: Float32Array) {
        if (value.length != this.vertexDimension) throw "setVertex length error";
        this.vertexBuffer.set(value, i * this.vertexDimension);
    }
    // vector plus
    // vector scale

    constructor(nodeBuffer: Float32Array, linkBuffer: Uint32Array, _lambda = 0.3, eta_max = 10) {
        this._lambda = _lambda;
        this.eta_max = eta_max;
        this.edgeBuffer = linkBuffer;
        this.edgeCount = linkBuffer.length / 2;
        this.vertexBuffer = nodeBuffer;
        this.vertexDimension = 3;
        this, this.vertexCount = this.vertexBuffer.length / this.vertexDimension;
    }
    Run() {
        const etaIter = this.annealing(this._lambda, this.eta_max);
        let etaCurr = etaIter.next();

        while (!etaCurr.done) {
            const eta = etaCurr.value as number;
            for (let index = 0; index < this.edgeCount; index++) {
                const edge = this.getEdge(index);
                const w = 1;// d[i,j]**2
                const mu = Math.min(1, w * eta);
                const p=1;//random matrix P[i] - P[j], vector
                const l=1;// np.linalg.norm(p)
                const r=1//(l-d[i,j])/2*p/l; vector

                const mur=mu*r;
                //this.setVertex(i,vi-mur);vj+mur
            }
            etaCurr = etaIter.next();
        }
    }
}