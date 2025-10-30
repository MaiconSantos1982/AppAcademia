let academiaId = null;
let exerciciosGeral = [];
let exerciciosAcademia = [];
let modalExercicio = null;

// Pega academia logada
async function getAcademiaId() {
  const { data: { user } } = await supabase.auth.getUser();
  academiaId = user?.id;
  if (!academiaId) window.location.href = 'login-academia.html';
}

// Carregar exercícios de exercicios_geral
async function carregarExercicios() {
  const { data, error } = await supabase
    .from('exercicios_geral')
    .select('*')
    .order('nome');

  if (error) {
    document.getElementById('exerciciosError').textContent = 'Erro ao carregar exercícios: ' + error.message;
    return;
  }

  // Todos os exercícios vão para a lista geral (sem aba academia)
  exerciciosGeral = data || [];
  renderizarExercicios();
}

// Renderizar tabela de exercícios
function renderizarExercicios() {
  const tbodyGeral = document.getElementById('listaExerciciosGeral');
  const busca = document.getElementById('buscaExercicio').value.toLowerCase();
  
  const filtrados = exerciciosGeral.filter(e => 
    e.nome.toLowerCase().includes(busca) || 
    (e.grupo_muscular && e.grupo_muscular.toLowerCase().includes(busca))
  );

  // Renderiza na aba Geral
  tbodyGeral.innerHTML = filtrados.map(e => `
    <tr>
      <td><strong>${e.nome}</strong></td>
      <td>${e.grupo_muscular || '-'}</td>
      <td>
        ${e.video_url ? `<a href="${e.video_url}" target="_blank" class="btn btn-sm btn-info">Ver vídeo</a>` : '-'}
      </td>
    </tr>
  `).join('');
}

// Busca em tempo real
document.getElementById('buscaExercicio').addEventListener('input', renderizarExercicios);

// Abrir modal para cadastro
window.abrirCadastroExercicio = function() {
  document.getElementById('exercicioId').value = '';
  document.getElementById('formExercicio').reset();
  document.getElementById('tituloModalExercicio').textContent = 'Cadastrar Exercício';
  modalExercicio.show();
};

// Editar exercício (não implementado nas abas)
window.editarExercicio = async function(exercicioId) {
  const exercicio = exerciciosGeral.find(e => e.id === exercicioId);
  if (!exercicio) return;

  document.getElementById('exercicioId').value = exercicio.id;
  document.getElementById('nome').value = exercicio.nome;
  document.getElementById('grupo_muscular').value = exercicio.grupo_muscular || '';
  document.getElementById('video_url').value = exercicio.video_url || '';
  document.getElementById('descricao').value = exercicio.descricao || '';
  
  document.getElementById('tituloModalExercicio').textContent = 'Editar Exercício';
  modalExercicio.show();
};

// Salvar exercício (cadastro ou edição)
document.getElementById('formExercicio').addEventListener('submit', async (e) => {
  e.preventDefault();

  const exercicioId = document.getElementById('exercicioId').value;
  const nome = document.getElementById('nome').value.trim();
  const grupo_muscular = document.getElementById('grupo_muscular').value.trim();
  const video_url = document.getElementById('video_url').value.trim() || null;
  const descricao = document.getElementById('descricao').value.trim() || null;

  if (!nome || !grupo_muscular) {
    alert('Nome e Grupo muscular são obrigatórios!');
    return;
  }

  const dados = {
    nome,
    grupo_muscular,
    video_url,
    descricao
  };

  let error;

  if (exercicioId) {
    // Editar
    ({ error } = await supabase
      .from('exercicios_geral')
      .update(dados)
      .eq('id', exercicioId));
  } else {
    // Inserir (sempre em exercicios_geral)
    ({ error } = await supabase
      .from('exercicios_geral')
      .insert([dados]));
  }

  if (error) {
    document.getElementById('exerciciosError').textContent = 'Erro: ' + error.message;
    return;
  }

  modalExercicio.hide();
  document.getElementById('formExercicio').reset();
  await carregarExercicios();
});

// Nome da academia no sidebar
async function carregarNomeAcademia() {
  const { data } = await supabase
    .from('academias')
    .select('nome')
    .eq('id', academiaId)
    .single();
  if (data) {
    document.getElementById('nomeAcademiaSidebar').textContent = data.nome;
  }
}

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await getAcademiaId();
  await carregarNomeAcademia();
  modalExercicio = new bootstrap.Modal(document.getElementById('modalExercicio'));
  await carregarExercicios();
});
