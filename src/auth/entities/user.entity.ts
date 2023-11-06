import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Role } from "../interfaces/role.interfaces";


class Country {
    name: string;
    cca2: string;
}

@Schema({ timestamps: true })
export class User {

    _id?: string   // "lo crea mongo por nosotros"

    @Prop({ unique: true, required: true })
    email: string;


    @Prop({ required: true })
    name: string

    @Prop({ minlength: 6, required: true })
    password?: string;

    @Prop({ default: 'user' })
    role: Role;

    @Prop()
    country: Country;

    @Prop({ default: 'default-user.jpg' })
    avatar: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    last_login: Date;

    @Prop()
    createdAt?: Date

    @Prop()
    updatedAt?: Date

    @Prop({ select: false })
    __v: number
}






export const UserSchema = SchemaFactory.createForClass(User);



