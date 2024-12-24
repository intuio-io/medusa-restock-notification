"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/subscribers/restock.ts
const medusa_1 = require("@medusajs/medusa");
async function handleRestockNotification({ data, container, }) {
    const restockService = container.resolve("restockService");
    const productVariantService = container.resolve("productVariantService");
    const sendgridService = container.resolve("sendgridService");
    if (!data?.id)
        return;
    try {
        // Get variant details
        const variant = await productVariantService.retrieve(data.id, {
            relations: ["product"],
            select: ["id", "title", "inventory_quantity", "product_id"]
        });
        // Only proceed if variant is back in stock
        if (!variant || variant.inventory_quantity <= 0)
            return;
        // Get subscribers
        const subscribers = await restockService.getSubscribers(variant.id);
        if (subscribers.length === 0)
            return;
        console.log('thjis is from kris plese work');
        console.log(subscribers);
        // Send restock notification
        await sendgridService.sendEmail({
            template_id: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
            from: {
                email: process.env.SENDGRID_FROM,
                name: process.env.STORE_NAME || "Your Store"
            },
            to: subscribers.map(sub => sub.email),
            dynamic_template_data: {
                product_title: variant.product.title,
                variant_title: variant.title,
                current_stock: variant.inventory_quantity,
                // store_name: process.env.STORE_NAME || "Your Store",
                // product_url: `${process.env.STORE_URL}/products/${variant.product.handle}`
            }
        });
        // Mark subscribers as notified
        await restockService.markNotified(subscribers.map(sub => sub.id));
    }
    catch (error) {
        console.error("Failed to send restock notifications:", error);
        throw error;
    }
}
exports.default = handleRestockNotification;
exports.config = {
    event: medusa_1.ProductVariantService.Events.UPDATED,
    context: {
        subscriberId: "restock-handler",
    },
};
//# sourceMappingURL=restock.js.map