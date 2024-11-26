// src/api/store/restock-notifications/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

// Subscribe to restock notifications
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")

    try {
        const { variant_id, email }: any = req.body

        if (!variant_id || !email) {
            res.status(400).json({
                message: "variant_id and email are required"
            })
            return
        }

        const subscription = await restockService.subscribe(
            variant_id,
            email
        )

        res.status(200).json({
            subscription
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

// Get user's subscriptions
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")
    const { email, limit, offset } = req.query

    try {
        if (!email) {
            res.status(400).json({
                message: "email is required"
            })
            return
        }

        const subscriptions = await restockService.listSubscriptions(
            email as string,
            limit,
            offset
        )

        res.status(200).json({
            subscriptions
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}