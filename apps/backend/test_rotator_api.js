"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testApi() {
    const baseUrl = 'http://localhost:3000';
    try {
        const loginRes = await axios_1.default.post(`${baseUrl}/auth/login`, {
            email: 'admin@mcomlinks.com',
            password: 'password123'
        });
        const token = loginRes.data.access_token;
        console.log('Got Auth Token');
        const locationId = '124c5e59-1cb8-4fb5-b34d-4a1e89252401';
        const payload = {
            type: "scarcity",
            offerSequence: "[\"efe232b4-ce83-4a4b-ba72-2dee29e9b52a\",\"1e9d65c2-c556-4523-b235-09e83d8780c7\"]",
            fallbackBehavior: "default",
            customLink: null,
            weights: "{}",
            scarcityLimits: "{\"efe232b4-ce83-4a4b-ba72-2dee29e9b52a\":10}"
        };
        console.log('Sending PATCH Request...');
        const patchRes = await axios_1.default.patch(`${baseUrl}/admin/locations/${locationId}/rotator`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response Scarcity Limits:', patchRes.data.scarcityLimits);
    }
    catch (e) {
        if (e.response) {
            console.error('Error:', e.response.status, e.response.data);
        }
        else {
            console.error('Error:', e.message);
        }
    }
}
testApi();
//# sourceMappingURL=test_rotator_api.js.map