import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    private async getPostalData(postcode: string): Promise<{ city: string; region: string } | null> {
        if (!postcode) return null;
        try {
            // Using postcodes.io (free, no API key needed for UK postcodes)
            const response = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
            if (response.data?.status === 200 && response.data?.result) {
                const res = response.data.result;
                return {
                    city: res.admin_district || res.parish || '',
                    region: res.region || res.european_electoral_region || res.nuts || '',
                };
            }
        } catch (error) {
            this.logger.warn(`Failed to fetch postal data for ${postcode}: ${error.message}`);
        }
        return null;
    }

    async validateUser(loginDto: LoginDto): Promise<any> {
        const { email, password } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (user && user.password === password) {
            const { password, ...result } = user;
            return result;
        }

        throw new UnauthorizedException('Invalid credentials');
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto);
        const payload = { email: user.email, sub: user.id, role: user.role };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                postalCode: user.postalCode,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const { name, email, password, role, postalCode } = registerDto;

        const existing = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            throw new UnauthorizedException('User already exists with this email');
        }

        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password,
                    role: role || 'BUSINESS',
                    postalCode,
                },
            });

            // If user is a business owner, create a default profile
            if (newUser.role === 'BUSINESS') {
                const postalInfo = await this.getPostalData(postalCode || '');
                const derivedAddress = postalInfo 
                    ? `${postalInfo.city}${postalInfo.region ? ', ' + postalInfo.region : ''}, ${postalCode}`
                    : postalCode || '';

                await tx.businessProfile.create({
                    data: {
                        userId: newUser.id,
                        name: newUser.name || 'My Business',
                        description: 'Business description',
                        contactEmail: newUser.email,
                        address: derivedAddress,
                    },
                });
            }

            return newUser;
        });

        return this.login({ email, password });
    }
}
