// src/api/store/restock-notifications/check-subscription/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")
    const { email, variant_id } = req.query

    try {
        // Validate required parameters
        if (!email || !variant_id) {
            res.status(400).json({
                message: "email and variant_id are required query parameters"
            })
            return
        }


        const result = await restockService.isSubscribed(
            email as string,
            variant_id as string
        )

        res.status(200).json({
            variant_id,
            email,
            ...result
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}