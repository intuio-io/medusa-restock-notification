// src/api/store/restock-notifications/[id]/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function DELETE(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const restockService = req.scope.resolve("restockService")
    const { id } = req.params
    const { email }: any = req.body

    try {
        if (!email) {
            res.status(400).json({
                message: "email is required"
            })
            return
        }

        await restockService.removeSubscription(id, email)

        res.status(200).json({
            id,
            object: "restock_subscription",
            deleted: true
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}