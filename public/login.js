// Account creation and login


class User {
    constructor(name, email, password) {
        this.id = Math.floor(Math.random() * 1000000);
        this.name = name;
        this.email = email;
        this.password = password;
    }
}

async function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let res = await fetch('/user/' + email + '/' + password).then(response => response.json());
    alert(res.message);
    if (res.success) {
        window.location.href = '/game-select.html';
    }
}

async function createAccount() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirm_password = document.getElementById("confirm-password").value;
    console.log(name, email, password, confirm_password);
    if (password !== confirm_password) {
        alert("Passwords do not match");
        return;
    }
    let user = { name: name, email: email, password: password };
    let res = await fetch('/user/' + user.name, { method: 'POST', body: JSON.stringify(user), headers: { 'Content-Type': 'application/json' } }).then(response => response.json());
    alert(res.message);
    if (res.success) {
        window.location.href = '/game-select.html';
    }
}