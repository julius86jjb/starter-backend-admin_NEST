import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../entities/user.entity';

@Injectable()
export class SuperAdminOrSameGuard implements CanActivate {

    constructor(
        private reflector: Reflector
    ) {

    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        const request = context.switchToHttp().getRequest();
        
        try {
            const user = request.user as User;
            
            if ((!roles.includes(user.role)) && user._id.toString() !== request.params.id)  {
                throw new ForbiddenException('You need privileges to perform this action')
            }
            return true
        } catch (error) {
            throw new ForbiddenException(error.message);
        }
    }
}
