import { User } from "../entities/user.entity";
import { INavData } from "./side-menu.interface";

export interface LoginResponse {
    user: User;
    token: string;  
    menu:  INavData[];
}