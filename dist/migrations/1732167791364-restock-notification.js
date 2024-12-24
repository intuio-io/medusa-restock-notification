"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockNotification1732167791364 = void 0;
// src/migrations/1700000000000-create-restock-subscription.ts
const typeorm_1 = require("typeorm");
class RestockNotification1732167791364 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "restock_subscription",
            columns: [
                {
                    name: "id",
                    type: "varchar",
                    isPrimary: true,
                },
                {
                    name: "email",
                    type: "varchar",
                },
                {
                    name: "variant_id",
                    type: "varchar",
                },
                {
                    name: "product_title",
                    type: "varchar",
                },
                {
                    name: "variant_title",
                    type: "varchar",
                },
                {
                    name: "notified",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "created_at",
                    type: "timestamp with time zone",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamp with time zone",
                    default: "now()",
                },
            ],
            foreignKeys: [
                {
                    name: "fk_restock_variant",
                    columnNames: ["variant_id"],
                    referencedTableName: "product_variant",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                }
            ]
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable("restock_subscription");
    }
}
exports.RestockNotification1732167791364 = RestockNotification1732167791364;
//# sourceMappingURL=1732167791364-restock-notification.js.map