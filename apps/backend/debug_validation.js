"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const create_offer_dto_1 = require("./src/dashboard/offers/dto/create-offer.dto");
const class_transformer_1 = require("class-transformer");
async function test() {
    const payload = {
        businessName: "Test",
        headline: "Test",
        description: "Test",
        imageUrl: "https://example.com/img.jpg",
        endDate: new Date().toISOString(),
        visibility: "hyperlocal",
        targetPostcode: "E1 6AN",
        isPremium: true
    };
    const instance = (0, class_transformer_1.plainToInstance)(create_offer_dto_1.CreateOfferDto, payload);
    const errors = await (0, class_validator_1.validate)(instance, { whitelist: true, forbidNonWhitelisted: true });
    console.log('Errors:', JSON.stringify(errors, null, 2));
    console.log('Instance:', JSON.stringify(instance, null, 2));
}
test();
//# sourceMappingURL=debug_validation.js.map