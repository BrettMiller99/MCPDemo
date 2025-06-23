document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const createAccountBtn = document.getElementById('create-account-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const formTitle = document.getElementById('form-title');
    const errorMessage = document.getElementById('error-message');
    const signupMessage = document.getElementById('signup-message');
    
    // Initialize local storage if needed
    if (!localStorage.getItem('users')) {
        // Add default user
        const defaultUsers = {
            'brettmiller': 'password'
        };
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    // Switch to signup form
    createAccountBtn.addEventListener('click', () => {
        loginForm.classList.remove('active-form');
        loginForm.classList.add('hidden-form');
        signupForm.classList.remove('hidden-form');
        signupForm.classList.add('active-form');
        formTitle.textContent = 'Create Account';
        errorMessage.textContent = '';
    });
    
    // Switch back to login form
    backToLoginBtn.addEventListener('click', () => {
        signupForm.classList.remove('active-form');
        signupForm.classList.add('hidden-form');
        loginForm.classList.remove('hidden-form');
        loginForm.classList.add('active-form');
        formTitle.textContent = 'Welcome Back';
        signupMessage.textContent = '';
    });

    // Handle login form submission
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        // Get users from local storage
        const users = JSON.parse(localStorage.getItem('users'));
        
        // Check if user exists and password matches
        if (users && users[username] === password) {
            // On success, redirect to the success page
            window.location.href = 'success.html';
        } else {
            // On failure, show error message
            errorMessage.textContent = 'Invalid username or password.';
        }
    });
    
    // Handle signup form submission
    signupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newUsername = signupForm['new-username'].value;
        const newPassword = signupForm['new-password'].value;
        const confirmPassword = signupForm['confirm-password'].value;
        
        // Get current users
        const users = JSON.parse(localStorage.getItem('users')) || {};
        
        // Validate input
        if (newPassword !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match.';
            signupMessage.style.color = 'var(--color-error)';
            return;
        }
        
        if (users[newUsername]) {
            signupMessage.textContent = 'Username already exists.';
            signupMessage.style.color = 'var(--color-error)';
            return;
        }
        
        // Add new user
        users[newUsername] = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        signupMessage.textContent = 'Account created successfully! You can now login.';
        signupMessage.style.color = 'var(--color-success)';
        
        // Clear form
        signupForm.reset();
        
        // Switch back to login after 2 seconds
        setTimeout(() => {
            backToLoginBtn.click();
        }, 2000);
    });
});
