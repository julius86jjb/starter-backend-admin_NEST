import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthService } from '../auth.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {


  constructor(
    private jwtService: JwtService,
    private authService: AuthService
    ) {

  }

  async canActivate(context: ExecutionContext):  Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }


    try {

      const payload = await this.jwtService.verifyAsync<JwtPayload>( token, { secret: process.env.JWT_SEED });

      const user = await this.authService.findUserById(payload.id);

      if(!user.isActive) throw new ForbiddenException('User is not active'); 
      
      request['user'] = user;
      return true;
    } 
    catch(error){
      switch(error.name){

          case 'TokenExpiredError':{
            throw new UnauthorizedException('Token expired');
          }
          case 'JsonWebTokenError': {
            throw new UnauthorizedException('Not valid token');
          }
          case 'NotFoundException':{
            throw new NotFoundException(error.message);  
          }
          default:{
            throw new ForbiddenException(error.message); 
          }   
      }
    }

  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

