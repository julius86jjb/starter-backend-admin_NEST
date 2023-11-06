import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from "bcryptjs";
const fs = require('fs');

import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponse } from './interfaces/login-response';

import { CreateUserDto, UpdateAuthDto, LoginDto, RegisterDto } from './dto/index';
import { INavData } from './interfaces/side-menu.interface';
import { RegisterResponse } from './interfaces/register-response.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) { }



  async register(registerDto: RegisterDto): Promise<RegisterResponse> {

    try {
      //Encriptar contraseña
      const { password, ...userData } = registerDto
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      await newUser.save();

      const { password: _, ...user } = newUser.toJSON()
      return {
        token: this.getJwtToken({ id: user._id }),
        user: user,
      }


    } catch (error) {
      if (error.code === 11000) { // error.code 11000 -> llave duplicada
        throw new BadRequestException(`${registerDto.email} already exists`)
      }
      throw new InternalServerErrorException('Something bad happened!')
    }


  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email: email });

    if (!user) {
      throw new UnauthorizedException('Wrong credentials')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is not active')
    }


    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Wrong credentials')
    }



    user.last_login = new Date();
    await user.save();
    const { password: _, ...restUser } = user.toJSON();
    return {
      token: this.getJwtToken({ id: user.id }),
      user: restUser,
      menu: this.getUserMenu(user.role)
    }
  }

  async checkCredentials(id: string, loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new UnauthorizedException('Wrong credentials')
    }

    if (user.email !== email) {
      throw new UnauthorizedException('Wrong credentials')
    }

    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Wrong credentials')
    }

    const { password: _, ...restUser } = user.toJSON();
    return {
      user: restUser,
    }
  }



  async findAll(page = 1, limit = 5) {

    const total = await this.userModel.countDocuments({}).exec();
    const page_total = Math.floor((total - 1) / limit) + 1;
    const users = await this.userModel.find().sort({ updatedAt: -1 }).limit(limit).skip((page - 1) * limit).exec();
    return {
      page: page,
      per_page: limit,
      total,
      page_total,
      users,
    }
  }

  async findUserById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id);
      const { password, ...rest } = user.toJSON();
      return rest;
    } catch (error) {
      throw new NotFoundException('User not found')
    }

  }

  async findUsersByTerm(term: string, page = 1, limit = 5) {
    try {
      const regex = new RegExp(term, 'i');
      const search = [{ name: regex }, { email: regex }, { role: regex }, { "country.name": regex }]
      const total = await this.userModel.find().or(search).countDocuments({}).exec();
      const page_total = Math.floor((total - 1) / limit) + 1;
      const users = await this.userModel.find().sort({ updatedAt: -1 }).or(search)
        .limit(limit).skip((page - 1) * limit).exec();
      return {
        page: page,
        per_page: limit,
        total,
        page_total,
        users,
      }
    } catch (error) {
      throw new NotFoundException('Nothing found')
    }

  }

  async findUserByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email: email });
    return !!user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      //Encriptar contraseña
      const { password, ...userData } = createUserDto
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      await newUser.save();

      const { password: _, ...user } = newUser.toJSON()
      return user;



    } catch (error) {
      if (error.code === 11000) { // error.code 11000 -> llave duplicada
        throw new BadRequestException(`${createUserDto.email} already exists`)
      }
      throw new InternalServerErrorException('Something bad happened!')
    }

  }


  async update(id: string, updateAuthDto: UpdateAuthDto): Promise<User> {

    try {
      const userUpdate = await this.userModel.findByIdAndUpdate(id, updateAuthDto, { returnDocument: 'after' })
      const user = userUpdate.toJSON();
      const userUpdateWithId = {
        _id: id,
        ...user
      }
      return userUpdateWithId;
    }
    catch (error) {
      if (error.code === 11000) { // error.code 11000 -> llave duplicada
        throw new BadRequestException(`${updateAuthDto.email} ya existe`)
      }
      throw new InternalServerErrorException('Something bad happened!')
    }
  }

  async updateAvatar(id: string, filename: string): Promise<User> {

    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found')

    const oldPath = `./uploads/users/${user.avatar}`
    if (oldPath !== './uploads/users/default-user.jpg') {
      this.deleteImg(oldPath)
    }
    user.avatar = filename;
    await user.save();
    return user;

  }

  deleteImg(path) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }

  async updatePassword(id: string, updateAuthDto: UpdateAuthDto): Promise<User> {

    try {
      const { password } = updateAuthDto
      const updatedUser = {
        password: bcryptjs.hashSync(password, 10)
      }
      const userUpdate = await this.userModel.findByIdAndUpdate(id, updatedUser, { returnDocument: 'after' })
      const user = userUpdate.toJSON();
      const userUpdateWithId = {
        _id: id,
        ...user
      }
      return userUpdateWithId;
    }
    catch (error) {
      if (error.code === 11000) { // error.code 11000 -> llave duplicada
        throw new BadRequestException(`${updateAuthDto.email} already exists`)
      }
      throw new InternalServerErrorException('Something bad happened!')
    }
  }

  async remove(id: string): Promise<User> {

    try {
      const user = await this.userModel.findByIdAndDelete(id)
      const { password, ...rest } = user.toJSON();
      return rest;
    }
    catch (error) {
      throw new InternalServerErrorException('Something bad happened!')
    }
  }

  getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  getUserMenu(role: string = 'user'): INavData[] {
    const menu = [
      {
        name: 'Dashboard',
        url: '/dashboard',
        iconComponent: { name: 'cil-speedometer' },
        badge: {
          color: 'info',
          text: 'NEW'
        }
      },

      {
        name: 'Main',
        title: true
      },
      {
        name: 'Users',
        iconComponent: { name: 'cilUser' },
        children: [
          {
            name: 'User List',
            url: '/admin/usuarios/'
          },
          {
            name: 'New User',
            url: '/admin/usuarios/nuevo'
          },

        ]
      },
    ];

    if (role === 'user') {
      menu.pop()
      menu.pop()
    }

    if (role === 'admin') {
      menu[2].children.pop()
    }

    return menu;

  }



}
