import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
    @IsString()
    fullName: string;

    @IsEmail({}, { message: 'Format email tidak valid' })
    email: string;

    @MinLength(6, { message: 'Password minimal 6 karakter' })
    password: string;
}