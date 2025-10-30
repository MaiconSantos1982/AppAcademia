let academiaId = null;
let alunoId = null;
let aluno = null;
let exerciciosDisponiveis = [];
let gruposMusculares = [];
let treinosPersonalizados = [];
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
  
  selectGrupo.addEventListener('change', filtrarExerciciosPorGrupo);
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

// Adicionar novo treino
document.getElementById('btnAdicionarLetra').addEventListener('click', () => {
  const novoNome = prompt('Digite o nome do treino:', `Treino ${String.fromCharCode(65 + treinosPersonalizados.length)}`);
  if (!novoNome) return;
  
  treinosPersonalizados.push({
    nome: novoNome,
    exercicios: []
  });
  renderTreinosPersonalizados();
});

// Renderizar treinos e exercícios
function renderTreinosPersonalizados() {
  const div = document.getElementById('listarTreinosLetras');
  div.innerHTML = treinosPersonalizados.map((t, idx) => {
    return `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <input type="text" class="form-control" value="${t.nome}" 
              onchange="atualizarNomeTreino(${idx}, this.value)" 
              placeholder="Nome do treino">
            <button type="button" class="btn btn-sm btn-danger ms-2" onclick="removerTreino(${idx})">
              <i class="bi bi-trash"></i> Remover
            </button>
          </div>
          <div id="listaExercicios${idx}">
            ${t.exercicios.map((e, i) =>
              `<div class="d-flex align-items-center mb-2 p-2 bg-light rounded">
                <span class="flex-grow-1">
                  <strong>${e.nome}</strong><br>
                  <small>Séries: ${e.series} | Repetições: ${e.repeticoes.join(', ')}</small>
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
  treinosPersonalizados[idx].nome = novoNome;
};

// Remover treino
window.removerTreino = function(idx) {
  if (confirm('Deseja remover este treino e todos os seus exercícios?')) {
    treinosPersonalizados.splice(idx, 1);
    renderTreinosPersonalizados();
  }
};

// Remover exercício do treino
window.removerExercicio = function(tIndex, eIndex) {
  treinosPersonalizados[tIndex].exercicios.splice(eIndex, 1);
  renderTreinosPersonalizados();
};

// Abrir modal para adicionar exercício
window.abrirModalExercicio = function(tIndex) {
  document.getElementById('treinoIndexAtual').value = tIndex;
  
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

// Fechar modal
window.fecharModalExercicio = function() {
  if (modalBootstrap) {
    modalBootstrap.hide();
    setTimeout(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
    }, 200);
  }
};

// Adicionar exercício ao treino
window.adicionarExercicioAoTreino = function() {
  const tIndex = Number(document.getElementById('treinoIndexAtual').value);
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
  
  treinosPersonalizados[tIndex].exercicios.push({
    id: exercicioId,
    nome: exercicio.nome,
    series: repeticoes.length,
    repeticoes: repeticoes
  });
  
  renderTreinosPersonalizados();
  fecharModalExercicio();
};

// Salvar treino para aluno
document.getElementById('btnSalvarTreino').addEventListener('click', async () => {
  const dataExpiracao = document.getElementById('dataValidadeTreino').value || null;

  if (treinosPersonalizados.length === 0) {
    document.getElementById('cadastroTreinoError').textContent = 'Adicione pelo menos um treino com exercício.';
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

  if (error) {
    document.getElementById('cadastroTreinoError').textContent = error.message;
    return;
  }
  
  const alunoTreinoId = data.id;

  // Cadastra os exercícios com nomes personalizados
  for (let tInd = 0; tInd < treinosPersonalizados.length; tInd++) {
    const treinoObj = treinosPersonalizados[tInd];
    
    for (let eInd = 0; eInd < treinoObj.exercicios.length; eInd++) {
      const ex = treinoObj.exercicios[eInd];
      
      const { error: errEx } = await supabase.from('alunos_treinos_exercicios').insert([{
        aluno_treino_id: alunoTreinoId,
        treino_letra: treinoObj.nome,
        exercicio_id: ex.id,
        exercicio_tipo: 'geral',
        ordem: eInd + 1,
        series: ex.series,
        repeticoes: ex.repeticoes
      }]);
      
      if (errEx) console.error('Erro ao salvar exercício:', errEx);
    }
  }

  window.location.href = `aluno-detalhes.html?id=${alunoId}`;
});

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await getAcademiaId();
  getAlunoIdFromUrl();
  await carregarAluno();
  await carregarExercicios();
});
