
export const onRequest = async (context, next) => {
    const response = await next();
    response.headers.set("Cross-Origin-Opener-Policy", "unsafe-none");
    response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
    return response;
};
