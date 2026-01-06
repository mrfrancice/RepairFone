import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['repairerProfile'],
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    // Check if phone already exists
    if (data.phone) {
      const existingPhone = await this.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
    }

    // Check if email already exists
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(id, { passwordHash });
  }

  async verifyPhone(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isPhoneVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async incrementFailedAttempts(id: string, attempts: number): Promise<void> {
    await this.userRepository.update(id, { failedLoginAttempts: attempts });
  }

  async lockAccount(id: string, lockedUntil: Date, attempts: number): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: attempts,
      lockedUntil,
    });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined as unknown as Date,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
