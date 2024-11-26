"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
async function handleRestockNotification({ data, container, }) {
    const restockService = container.resolve("restockService");
    const productVariantService = container.resolve("productVariantService");
    if (!data?.id)
        return;
    try {
        const variant = await productVariantService.retrieve(data.id, {
            relations: ["product"]
        });
        // Only proceed if variant is back in stock
        if (!variant || variant.inventory_quantity <= 0)
            return;
        // Send notifications using the service
        await restockService.sendNotification(variant);
    }
    catch (error) {
        console.error("Failed to send restock notifications:", error);
        throw error;
    }
}
exports.default = handleRestockNotification;
exports.config = {
    event: "product-variant.updated",
    context: {
        subscriberId: "restock-handler",
    },
};
//# sourceMappingURL=restock.js.map