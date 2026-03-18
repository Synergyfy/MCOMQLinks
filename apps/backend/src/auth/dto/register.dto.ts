import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'The Coffee Shop', description: 'Business Name or Full Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'hello@business.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ example: 'BUSINESS', enum: ['BUSINESS', 'AGENT', 'ADMIN'] })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ example: 'SW1A 1AA', description: 'Postal code for location targeting' })
    @IsOptional()
    @IsString()
    postalCode?: string;
}
