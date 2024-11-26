// src/api/admin/restock-notifications/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

// Get all subscriptions for a variant
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")
    const { variant_id } = req.query

    try {
        if (!variant_id) {
            res.status(400).json({
                message: "variant_id is required"
            })
            return
        }

        const subscribers = await restockService.getSubscribers(variant_id as string)

        res.status(200).json({
            subscribers
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

// Force send notifications for a variant
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")
    const productVariantService = req.scope.resolve("productVariantService")
    const sendgridService = req.scope.resolve("sendgridService")

    try {
        const { variant_id }: any = req.body

        if (!variant_id) {
            res.status(400).json({
                message: "variant_id is required"
            })
            return
        }

        const variant = await productVariantService.retrieve(variant_id, {
            relations: ["product"]
        })

        const subscribers = await restockService.getSubscribers(variant_id)

        if (subscribers.length === 0) {
            res.status(200).json({
                message: "No subscribers found"
            })
            return
        }

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
            }
        })

        await restockService.markNotified(subscribers.map(sub => sub.id))

        res.status(200).json({
            message: "Notifications sent successfully",
            count: subscribers.length
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}