import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // Pastikan path import entity sesuai

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // <-- Wajib ada agar UserRepository tersedia
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export jika ingin digunakan di AuthModule
})
export class UsersModule {}