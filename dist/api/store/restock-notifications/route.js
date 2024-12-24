"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.POST = void 0;
// Subscribe to restock notifications
async function POST(req, res) {
    const restockService = req.scope.resolve("restockService");
    try {
        const { variant_id, email } = req.body;
        if (!variant_id || !email) {
            res.status(400).json({
                message: "variant_id and email are required"
            });
            return;
        }
        const subscription = await restockService.subscribe(variant_id, email);
        res.status(200).json({
            subscription
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}
exports.POST = POST;
// Get user's subscriptions
async function GET(req, res) {
    const restockService = req.scope.resolve("restockService");
    const { email } = req.query;
    try {
        if (!email) {
            res.status(400).json({
                message: "email is required"
            });
            return;
        }
        const subscriptions = await restockService.listSubscriptions(email);
        res.status(200).json({
            subscriptions
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