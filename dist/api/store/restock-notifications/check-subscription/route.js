"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
async function GET(req, res) {
    const restockService = req.scope.resolve("restockService");
    const { email, variant_id } = req.query;
    try {
        // Validate required parameters
        if (!email || !variant_id) {
            res.status(400).json({
                message: "email and variant_id are required query parameters"
            });
            return;
        }
        const result = await restockService.isSubscribed(email, variant_id);
        res.status(200).json({
            variant_id,
            email,
            ...result
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}
exports.GET = GET;
//# sourceMappingURL=route.js.map