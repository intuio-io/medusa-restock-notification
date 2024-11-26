"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = void 0;
async function DELETE(req, res) {
    const restockService = req.scope.resolve("restockService");
    const { id } = req.params;
    const { email } = req.body;
    try {
        if (!email) {
            res.status(400).json({
                message: "email is required"
            });
            return;
        }
        await restockService.removeSubscription(id, email);
        res.status(200).json({
            id,
            object: "restock_subscription",
            deleted: true
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}
exports.DELETE = DELETE;
//# sourceMappingURL=route.js.map