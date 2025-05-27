export class UserCreateData {
    surName: string;
    name: string;
    phone: string;
    password: string;
    otpCode?: string;
    constructor(surName: string, name: string, phone: string, password: string, otpCode?: string) {
        this.otpCode = otpCode;
        this.surName = surName;
        this.name = name;
        this.phone = phone;
        this.password = password;
    }
}