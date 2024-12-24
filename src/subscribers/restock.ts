// src/subscribers/restock.ts
import {
    type SubscriberConfig,
    type SubscriberArgs,
    ProductVariantService,
} from "@medusajs/medusa"

export default async function handleRestockNotification({
    data,
    container,
}: SubscriberArgs<{ id: string }>) {
    const restockService = container.resolve("restockService")
    const productVariantService = container.resolve("productVariantService")
    const sendgridService = container.resolve("sendgridService")

    if (!data?.id) return

    try {
        // Get variant details
        const variant = await productVariantService.retrieve(data.id, {
            relations: ["product"],
            select: ["id", "title", "inventory_quantity", "product_id"]
        })

        // Only proceed if variant is back in stock
        if (!variant || variant.inventory_quantity <= 0) return

        // Get subscribers
        const subscribers = await restockService.getSubscribers(variant.id)
        if (subscribers.length === 0) return

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
        })

        // Mark subscribers as notified
        await restockService.markNotified(subscribers.map(sub => sub.id))
    } catch (error) {
        console.error("Failed to send restock notifications:", error)
        throw error
    }
}

export const config: SubscriberConfig = {
    event: "product-variant.updated",
    context: {
        subscriberId: "restock-handler",
    },
}