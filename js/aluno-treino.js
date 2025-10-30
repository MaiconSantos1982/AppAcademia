let academiaId = null;
let alunoId = null;
let aluno = null;
let treinosProntos = [];
let exerciciosDisponiveis = [];
let gruposMusculares = [];
let letrasPersonalizadas = [];
let modalBootstrap = null;

// Pega academia e aluno logado
async function getAcademiaId() {
  const { data: { user } } = await supabase.auth.getUser();
  academiaId = user?.id;
  if (!academiaId) window.location.href = 'login-academia.html';
}

function getAlunoIdFromUrl() {
  const p = new URLSearchParams(location.search);
  alunoId = p.get('id');
  document.getElementById('voltarAluno').href = `aluno-detalhes.html?id=${alunoId}`;
}

async function carregarAluno() {
  const { data } = await supabase
    .from('alunos')
    .select('*')
    .eq('academia_id', academiaId)
    .eq('id', alunoId)
    .single();
  aluno = data;
  document.getElementById('alunoInfo').innerHTML = `<strong>Aluno:</strong> ${aluno.nome} (${aluno.email})`;
}

async function carregarTreinosProntos() {
  const { data } = await supabase
    .from('treinos_prontos')
    .select('*')
    .eq('academia_id', academiaId);
  treinosProntos = data || [];
  const select = document.getElementById('selectTreinoPronto');
  select.innerHTML = treinosProntos.map(t =>
    `<option value="${t.id}">${t.nome} [${t.categoria}]</option>`
  ).join('');
}

// Carrega exercícios apenas de exercicios_geral
async function carregarExercicios() {
  const { data, error } = await supabase
    .from('exercicios_geral')
    .select('id, nome, grupo_muscular')
    .order('nome');
  
  if (error) {
    console.error('Erro ao carregar exercícios:', error);
    return;
  }
  
  exerciciosDisponiveis = data || [];
  carregarGruposMusculares();
}

// Carrega grupos musculares únicos
function carregarGruposMusculares() {
  gruposMusculares = [...new Set(exerciciosDisponiveis.map(e => e.grupo_muscular))].filter(Boolean).sort();
  
  const selectGrupo = document.getElementById('selectGrupoMuscular');
  selectGrupo.innerHTML = '<option value="todos">Todos</option>';
  gruposMusculares.forEach(grupo => {
    selectGrupo.innerHTML += `<option value="${grupo}">${grupo}</option>`;
  });
  
  // Adiciona listener de mudança
  selectGrupo.addEventListener('change', filtrarExerciciosPorGrupo);
  
  // Renderiza inicialmente com "Todos"
  filtrarExerciciosPorGrupo();
}

// Filtra exercícios baseado no grupo selecionado
function filtrarExerciciosPorGrupo() {
  const grupoSelecionado = document.getElementById('selectGrupoMuscular').value;
  const selectExercicio = document.getElementById('selectExercicio');
  
  let exerciciosFiltrados = exerciciosDisponiveis;
  
  if (grupoSelecionado !== 'todos') {
    exerciciosFiltrados = exerciciosDisponiveis.filter(e => e.grupo_muscular === grupoSelecionado);
  }
  
  selectExercicio.innerHTML = '<option value="">Selecione um exercício</option>';
  exerciciosFiltrados.forEach(ex => {
    selectExercicio.innerHTML += `<option value="${ex.id}">${ex.nome} [${ex.grupo_muscular}]</option>`;
  });
}

// Alternância tipo de treino
document.getElementById('formTipoTreino').addEventListener('change', () => {
  const tipo = document.querySelector('input[name="tipoTreino"]:checked').value;
  document.getElementById('areaTreinoPronto').style.display = tipo === 'pronto' ? 'block' : 'none';
  document.getElementById('areaPersonalizado').style.display = tipo === 'personalizado' ? 'block' : 'none';
});

// Adicionar letra (A, B, ...)
document.getElementById('btnAdicionarLetra').addEventListener('click', () => {
  const letra = String.fromCharCode(65 + letrasPersonalizadas.length);
  letrasPersonalizadas.push({ 
    letra, 
    nome: `Treino ${letra}`,
    exercicios: [] 
  });
  renderLetrasPersonalizadas();
});

// Renderizar letras e exercícios
function renderLetrasPersonalizadas() {
  const div = document.getElementById('listarTreinosLetras');
  div.innerHTML = letrasPersonalizadas.map((t, idx) => {
    return `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <input type="text" class="form-control" value="${t.nome}" 
              onchange="atualizarNomeTreino(${idx}, this.value)" 
              placeholder="Nome do treino">
          </div>
          <div id="listaExercicios${idx}">
            ${t.exercicios.map((e, i) =>
              `<div class="d-flex align-items-center mb-2 p-2 bg-light rounded">
                <span class="flex-grow-1">
                  <strong>${e.nome}</strong><br>
                  <small>Séries: ${e.repeticoes.length} | Repetições: ${e.repeticoes.join(', ')}</small>
                </span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removerExercicio(${idx},${i})">
                  <i class="bi bi-trash"></i> Remover
                </button>
              </div>`
            ).join('')}
          </div>
          <button type="button" class="btn btn-success mt-2" onclick="abrirModalExercicio(${idx})">
            <i class="bi bi-plus-circle"></i> Adicionar Exercício
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Atualizar nome do treino
window.atualizarNomeTreino = function(idx, novoNome) {
  letrasPersonalizadas[idx].nome = novoNome;
};

// Remover exercício do treino/letra
window.removerExercicio = function(tIndex, eIndex) {
  letrasPersonalizadas[tIndex].exercicios.splice(eIndex, 1);
  renderLetrasPersonalizadas();
};

// Abrir modal para adicionar exercício
window.abrirModalExercicio = function(tIndex) {
  document.getElementById('treinoLetraAtual').value = tIndex;
  
  const nomeTreino = letrasPersonalizadas[tIndex].nome;
  document.getElementById('inputNomeTreino').value = nomeTreino;
  
  document.getElementById('selectGrupoMuscular').value = 'todos';
  document.getElementById('selectExercicio').value = '';
  document.getElementById('inputSeries').value = '';
  filtrarExerciciosPorGrupo();
  
  const modalElement = document.getElementById('modalAdicionarExercicio');
  
  if (!modalBootstrap) {
    modalBootstrap = new bootstrap.Modal(modalElement, {
      backdrop: 'static',
      keyboard: false
    });
  }
  modalBootstrap.show();
};

// Adicionar exercício ao treino
window.adicionarExercicioAoTreino = function() {
  const tIndex = Number(document.getElementById('treinoLetraAtual').value);
  const nomeTreino = document.getElementById('inputNomeTreino').value.trim();
  const exercicioId = document.getElementById('selectExercicio').value;
  const seriesInput = document.getElementById('inputSeries').value.trim();
  
  if (!exercicioId) {
    alert('Selecione um exercício!');
    return;
  }
  
  if (!seriesInput) {
    alert('Digite as séries (ex: 12,10,8,8)');
    return;
  }
  
  if (nomeTreino) {
    letrasPersonalizadas[tIndex].nome = nomeTreino;
  }
  
  const repeticoes = seriesInput.split(',').map(s => s.trim()).filter(Boolean);
  
  if (repeticoes.length === 0) {
    alert('Formato inválido de séries. Use: 12,10,8,8');
    return;
  }
  
  const exercicio = exerciciosDisponiveis.find(e => e.id === exercicioId);
  
  if (!exercicio) {
    alert('Exercício não encontrado!');
    return;
  }
  
  letrasPersonalizadas[tIndex].exercicios.push({
    id: exercicioId,
    nome: exercicio.nome,
    tipo: 'geral',
    repeticoes: repeticoes
  });
  
  renderLetrasPersonalizadas();
  
  // ✅ Fecha sem erros
  if (modalBootstrap) {
    modalBootstrap.hide();
    
    // Aguarda um pouco e depois limpa
    setTimeout(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
    }, 200);
  }
};

// Salvar treino para aluno
document.getElementById('btnSalvarTreino').addEventListener('click', async () => {
  const tipo = document.querySelector('input[name="tipoTreino"]:checked').value;
  const dataExpiracao = document.getElementById('dataValidadeTreino').value || null;

  if (tipo === 'pronto') {
    const treinoProntoId = document.getElementById('selectTreinoPronto').value;
    const { error } = await supabase.from('alunos_treinos').insert([{
      aluno_id: alunoId,
      academia_id: academiaId,
      tipo_treino: 'pronto',
      treino_pronto_id: treinoProntoId,
      ativo: true,
      data_expiracao: dataExpiracao
    }]);
    if (error) {
      document.getElementById('cadastroTreinoError').textContent = error.message;
      return;
    }
    window.location.href = `aluno-detalhes.html?id=${alunoId}`;
    return;
  }

  // Personalizado
  console.log('Letras personalizadas:', letrasPersonalizadas);
  
  if (letrasPersonalizadas.length === 0) {
    document.getElementById('cadastroTreinoError').textContent = 'Adicione pelo menos um treino/letra e exercício.';
    return;
  }

  // Desativa treinos anteriores
  await supabase
    .from('alunos_treinos')
    .update({ ativo: false })
    .eq('aluno_id', alunoId)
    .eq('ativo', true);

  // Cadastra treino personalizado
  const { data, error } = await supabase.from('alunos_treinos').insert([{
    aluno_id: alunoId,
    academia_id: academiaId,
    tipo_treino: 'personalizado',
    nome_personalizado: `Treino personalizado - ${aluno.nome}`,
    ativo: true,
    data_expiracao: dataExpiracao
  }]).select().single();

  console.log('Treino criado:', data, 'Erro:', error);

  if (error) {
    document.getElementById('cadastroTreinoError').textContent = error.message;
    return;
  }
  
  const alunoTreinoId = data.id;

  // Cadastra os exercícios
  for (let tInd = 0; tInd < letrasPersonalizadas.length; tInd++) {
    const letraObj = letrasPersonalizadas[tInd];
    console.log('Salvando letra:', letraObj);
    
    for (let eInd = 0; eInd < letraObj.exercicios.length; eInd++) {
      const ex = letraObj.exercicios[eInd];
      console.log('Salvando exercício:', ex);
      
const { error: errEx } = await supabase.from('alunos_treinos_exercicios').insert([{
  aluno_treino_id: alunoTreinoId,
  treino_letra: letraObj.letra,
  exercicio_id: ex.id,
  exercicio_tipo: 'geral',
  ordem: eInd + 1,
  series: eInd + 1,  // Número de séries
  repeticoes: ex.repeticoes  // Array de repetições
}]);
      
      if (errEx) console.error('Erro ao salvar exercício:', errEx);
    }
  }

  console.log('Treino salvo com sucesso!');
  window.location.href = `aluno-detalhes.html?id=${alunoId}`;
});

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await getAcademiaId();
  getAlunoIdFromUrl();
  await carregarAluno();
  await carregarTreinosProntos();
  await carregarExercicios();
});
