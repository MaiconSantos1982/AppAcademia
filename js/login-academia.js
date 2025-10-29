// js/login-academia.js

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgDiv = document.getElementById('loginError');
  
    msgDiv.textContent = '';
    const { error, data } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      msgDiv.textContent = 'E-mail ou senha inválidos!';
      msgDiv.className = 'text-danger mt-2';
    } else {
      window.location.href = 'dashboard-academia.html';
    }
  });
  
  