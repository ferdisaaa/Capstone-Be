import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(4, 4, { message: 'Kode OTP harus 4 digit' })
    otpCode: string;
}