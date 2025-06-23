document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from submitting the traditional way

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        // Check credentials
        if (username === 'brettmiller' && password === 'password') {
            // On success, redirect to the success page
            window.location.href = 'success.html';
        } else {
            // On failure, show an error message
            errorMessage.textContent = 'Invalid username or password.';
        }
    });
});
