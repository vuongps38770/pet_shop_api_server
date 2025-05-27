export class UserSignUpData {
    surName: string;
    name: string;
    phone: string;
    email: string;
    password: string;

    constructor(surName: string, name: string, phone: string, email: string, password: string) {
        this.surName = surName;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
}