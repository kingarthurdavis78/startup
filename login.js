class User {
    constructor(name, email, password) {
        this.id = Math.floor(Math.random() * 1000000);
        this.name = name;
        this.email = email;
        this.password = password;
    }
}


function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    
}

function createAccount() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirm_password = document.getElementById("confirm-password").value;
    if (password !== confirm_password) {
        alert("Passwords do not match");
        return;
    }
    let user = new User(name, email, password);
}