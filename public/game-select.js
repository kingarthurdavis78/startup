(async () => {
    const email = localStorage.getItem('email');
    if (email) {
      let loginItem = document.querySelector('#login');
      loginItem.innerText = 'Logout';
      loginItem.onClick = logOut();
    }
  })();


async function verifyLogin(game) {
    let email = localStorage.getItem('email');
    if (!email) {
        alert('Please log in to host a game');
        return;
    }
    let response = await fetch('/auth/' + email).then(res => res.json());
    if (response.success) {
        window.location.href = game
    } else {
        console.log(response);
        alert(response.message);
    }
}