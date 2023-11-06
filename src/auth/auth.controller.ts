import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Res, HttpStatus, UseInterceptors, UploadedFile, Put, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid'
import path = require('path');
import { join } from 'path';
import { Observable, of } from 'rxjs';

import { AuthService } from './auth.service';

import { CreateUserDto, UpdateAuthDto, LoginDto, RegisterDto } from './dto/index';

import { AuthGuard, RolesGuard, SuperAdminOrSameGuard } from './guards/index';

import { User } from './entities/user.entity';
import { LoginResponse, Role } from './interfaces/index';

import { Roles } from './decorators/roles/roles.decorator';

const fs = require('fs');


export const storage = {
  storage: diskStorage({
    destination: './uploads/users',
    filename: (req, file, cb, res) => {

      const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;

      cb(null, `${filename}${extension}`)
    }
  })
}


@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  
  // AUTH //

  @Post('/login')
  async login(@Res() res, @Body() loginDto: LoginDto) {
    try {
      return res.status(HttpStatus.OK).json(await this.authService.login(loginDto));
    } catch (error) {
      return res.status(error.status).json(error.response);

    }
  }


  @Post('/register')
  async register(@Res() res, @Body() registerDto: RegisterDto) {
    try {
      return res.status(HttpStatus.OK).json(await this.authService.register(registerDto))
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }




  // CRUD USERS

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.admin, Role.super_admin)
  @Get('/usuarios')
  async findAll(@Res() res, @Request() req: Request, @Query() { page, limit }) {
    // console.log(req);
    // const user = req['user'];
    // return user;
    try {
      const resp = await this.authService.findAll(page, limit);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }

  @UseGuards(AuthGuard, SuperAdminOrSameGuard)
  @Roles(Role.super_admin)
  @Get('/usuarios/:id')
  async findOne(@Res() res, @Param('id') id: string) {
    try {
      const resp = await this.authService.findUserById(id);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }


  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.super_admin)
  @Post('/usuarios')
  async create(@Res() res, @Body() createUserDto: CreateUserDto) {
    try {
      const resp = await this.authService.create(createUserDto);
      return res.status(HttpStatus.OK).json({ user: resp })
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }


  @UseGuards(AuthGuard, SuperAdminOrSameGuard)
  @Roles(Role.super_admin)
  @Patch('/usuarios/:id')
  async update(@Res() res, @Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    try {
      const resp = await this.authService.update(id, updateAuthDto);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }

  @UseGuards(AuthGuard, SuperAdminOrSameGuard)
  @Roles(Role.super_admin)
  @Patch('/usuarios/update-password/:id')
  async updatePassword(@Res() res, @Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    try {
      const resp = await this.authService.updatePassword(id, updateAuthDto);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.super_admin)
  @Delete('/usuarios/:id')
  async remove(@Res() res, @Param('id') id: string) {
    try {
      const resp = await this.authService.remove(id);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }



  // SEARCH //

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.super_admin, Role.admin)
  @Get('/usuarios/busqueda/:term')
  async findUsersbyTerm(@Res() res, @Param('term') term: string, @Query() { page, limit }) {
    try {
      const resp = await this.authService.findUsersByTerm(term, page, limit);
      return res.status(HttpStatus.OK).json(resp)
    } catch (error) {
      return res.status(error.status).json(error.response);
    }
  }

  // IMAGES //

  
  @Get('usuarios/profile-image/:imagename')
  profileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {

    const pathImg = join(process.cwd(), 'uploads/users/' + imagename);

    if (fs.existsSync(pathImg)) {
      return of(res.sendFile(pathImg));
    } else {
      const pathImg = join(process.cwd(), 'uploads/users/default-user.png');
      return of(res.sendFile(pathImg));
    }

  }

  @UseGuards(AuthGuard, SuperAdminOrSameGuard)
  @Roles(Role.super_admin)
  @Post('/usuarios/upload/:id')
  @UseInterceptors(FileInterceptor('avatar', storage))
  async uploadFile(@Param('id') id: string, @Res() res, @UploadedFile() file) {
    if (!file) {
      return res.status(400).json({
        statusCode: 400,
        message: 'File not found'
      });
    }

    
    const extensionesValidas = ['.png', '.jpg', '.jpeg', '.gif'];
    if (!extensionesValidas.includes(path.parse(file.originalname).ext)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid image format'
      });
    }

    try {
      return res.status(HttpStatus.OK).json({
        fileName: (await this.authService.updateAvatar(id, file.filename)).avatar,
        ok: true
      })
    } catch (error) {
      return res.status(error.status).json(error.response);

    }
  }


  // CHECKING


  @UseGuards(AuthGuard)
  @Get('check-token')
  checkToken(@Request() req: Request): LoginResponse {
    const user = req['user'] as User;
    return {
      token: this.authService.getJwtToken({ id: user._id }),
      user,
      menu: this.authService.getUserMenu(user.role)

    }
  }

  @UseGuards(AuthGuard, SuperAdminOrSameGuard)
  @Roles(Role.super_admin)
  @Post('check-credentials/:id')
  async checkCredentials(@Res() res, @Param('id') id: string, @Body() loginDto: LoginDto) {
    try {
      return res.status(HttpStatus.OK).json(await this.authService.checkCredentials(id, loginDto));
    } catch (error) {
      return res.status(error.status).json(error.response);

    }
  }

  @Get('check-email-exist/:email')
  async checkEmailExist(@Res() res,@Param('email') email: string) {
    try {
      const resp = await this.authService.findUserByEmail(email);
      return res.status(HttpStatus.OK).json(resp)
    }
     catch (error) {
      return res.status(error.status).json(error.response);
    }
  }
}