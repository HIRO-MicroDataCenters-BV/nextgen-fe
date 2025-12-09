export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    return await checkoutService.processCheckout(body.datasets);
});
