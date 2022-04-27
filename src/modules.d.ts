declare module '*.html' {
    const content: string;
    export default content;
}

declare module '*.wasm' {
    const content: WebAssembly.Module;
    export default content;
}
