import {  IsBoolean, IsDateString, IsDefined, IsEmail, IsEnum, IsLowercase, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Role } from "../interfaces/role.interfaces";
import { Type } from "class-transformer";


class Country {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsLowercase()
    @IsNotEmpty()
    cca2: string;
}
export class CreateUserDto {

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsEnum(Role)
    role: Role;

    @IsDefined()
    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Country)
    country: Country;

    @IsOptional()
    @IsString()
    avatar: string;

    @IsOptional()
    @IsBoolean()
    isActive: boolean;

    @IsOptional()
    @IsDateString()
    last_login: Date;

    @IsOptional()
    createdAt: Date;

    @IsOptional()
    updatedAt: Date;






}
