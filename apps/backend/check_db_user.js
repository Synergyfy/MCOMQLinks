"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@mcomlinks.com' },
        });
        if (user) {
            console.log('✅ Admin user found:');
            console.log(`- Email: ${user.email}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Password: ${user.password}`);
        }
        else {
            console.log('❌ Admin user NOT found in database.');
            const allUsers = await prisma.user.findMany();
            console.log(`Total users in DB: ${allUsers.length}`);
            if (allUsers.length > 0) {
                console.log('Available users:', allUsers.map(u => u.email).join(', '));
            }
        }
    }
    catch (error) {
        console.error('❌ Database error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkUser();
//# sourceMappingURL=check_db_user.js.map