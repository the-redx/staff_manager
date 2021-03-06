import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { CreateUserDTO } from './interfaces/create-user.dto';
import { UpdatePasswordDTO } from './interfaces/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(userDto: CreateUserDTO): Promise<User> {
    const { email } = userDto;
    let user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    user = await this.userRepository.create(userDto);
    return await this.userRepository.save(user);
  }

  async getUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async updateUser(id: string, updatedUserData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    return await this.userRepository.save({ ...user, ...updatedUserData });
  }

  async changePassword(
    id: string,
    { prevPassword, nextPassword }: UpdatePasswordDTO,
  ) {
    const user = await this.findById(id);

    if (!(await user.comparePassword(prevPassword))) {
      throw new HttpException('Incorrect prev password', HttpStatus.FORBIDDEN);
    }
    const newHashPassword = await bcrypt.hash(nextPassword, 10);

    return await this.userRepository.save({
      ...user,
      password: newHashPassword,
    });
  }
}
