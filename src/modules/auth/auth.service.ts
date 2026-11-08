import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmailVerification)
    private readonly otpRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
  ) {}

  // 1. REGISTER
  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      isEmailVerified: false,
    });

    await this.userRepository.save(newUser);

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpRepository.save(
      this.otpRepository.create({
        email: dto.email,
        otpCode,
        expiresAt,
      }),
    );

    return {
      message: 'Registrasi berhasil. Silakan cek kode OTP verifikasi',
      email: dto.email,
      debugOtp: otpCode,
    };
  }

  // 2. VERIFIKASI OTP
  async verifyOtp(dto: VerifyOtpDto) {
    const otpRecord = await this.otpRepository.findOne({
      where: {
        email: dto.email,
        otpCode: dto.otpCode,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Kode OTP salah atau sudah digunakan');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Kode OTP sudah kadaluwarsa');
    }

    otpRecord.isUsed = true;
    await this.otpRepository.save(otpRecord);

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    user.isEmailVerified = true;
    await this.userRepository.save(user);

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      message: 'Verifikasi akun berhasil!',
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }

  // 3. LOGIN
  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException(
        'Email belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.',
      );
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      message: 'Login berhasil',
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }
}