// js/cadastro-academia.js

document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const telefone = document.getElementById('telefone').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const msgDiv = document.getElementById('cadastroMsg');
  
    msgDiv.textContent = '';
    msgDiv.className = '';
  
    // 1. Cadastro no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: senha
    });
  
    if (signUpError) {
      msgDiv.textContent = 'Erro ao cadastrar: ' + signUpError.message;
      msgDiv.className = 'text-danger';
      return;
    }
  
    // 2. Cadastro na tabela academias (usar id do auth)
    const usuarioID = signUpData?.user?.id;
    if (!usuarioID) {
      msgDiv.textContent = 'Erro ao obter ID do usuário.';
      msgDiv.className = 'text-danger';
      return;
    }
  
    const { error: insertError } = await supabase
      .from('academias')
      .insert([{
        id: usuarioID,
        email: email,
        senha_hash: '',
        nome: nome,
        telefone: telefone,
        endereco: endereco
      }]);
  
    if (insertError) {
      msgDiv.textContent = 'Erro ao salvar dados da academia: ' + insertError.message;
      msgDiv.className = 'text-danger';
      return;
    }
  
    msgDiv.textContent = 'Cadastro realizado com sucesso!';
    msgDiv.className = 'text-success';
  
    setTimeout(() => {
      window.location.href = 'login-academia.html';
    }, 1800);
  });
  