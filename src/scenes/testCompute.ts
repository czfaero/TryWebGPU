/// <reference types="@webgpu/types" />

import cWGSL from '../shaders/test.comp.wgsl';


const init = async (canvasElement: HTMLCanvasElement) => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();


  // to-do: check limit
  console.log(adapter);
  const maxGPUThread = 256;

  const resultBufferGPU = device.createBuffer({
    size: 4000,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const cmdBufferGPU = device.createBuffer({
    size: 4000,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const readBufferGPU = device.createBuffer({
    size: 4000,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
  });

  const shaderModule = device.createShaderModule({
    code: cWGSL,
  })
  const computePipeline = device.createComputePipeline({
    layout: 'auto', // infer from shader code.
    compute: {
      module: shaderModule,
      entryPoint: "test"
    }
  });

  const bindGroupLayout = computePipeline.getBindGroupLayout(0);
  const buffers = [resultBufferGPU];
  const entries = buffers.map((b, i) => {
    return { binding: i, resource: { buffer: b } };
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: entries
  });
  const commandEncoder = device.createCommandEncoder();
  const computePassEncoder = commandEncoder.beginComputePass();
  computePassEncoder.setPipeline(computePipeline);
  computePassEncoder.setBindGroup(0, bindGroup);
  computePassEncoder.dispatchWorkgroups(256, 1);
  computePassEncoder.end();

  commandEncoder.copyBufferToBuffer(resultBufferGPU, 0, readBufferGPU, 0, 4000);


  const gpuCommands = commandEncoder.finish();
  device.queue.submit([gpuCommands]);
  await device.queue.onSubmittedWorkDone();
  await readBufferGPU.mapAsync(GPUMapMode.READ);
  const arrayBuffer = readBufferGPU.getMappedRange();
  const result = new Float32Array(arrayBuffer);
  console.log(result);
  result.forEach((x, i) => { if (x != 1) console.log(`[${i}]${x}`) });
};



export default init;