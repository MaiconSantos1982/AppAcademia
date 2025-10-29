// js/treinos-prontos.js

let academiaId = null;
let treinosProntos = [];
let letrasTreino = [];
let exerciciosGeral = [];
let exerciciosAcademia = [];

const modalTreinoPronto = new bootstrap.Modal(document.getElementById('modalTreinoPronto'));

async function getAcademiaId() {
  const { data: { user } } = await supabase.auth.getUser();
  academiaId = user?.id;
  if (!academiaId) window.location.href = 'login-academia.html';
}

async function carregarTreinosProntos() {
  const busca = document.getElementById('buscaTreino').value.trim().toLowerCase();
  const { data } = await supabase.from('treinos_prontos').select('*').eq('academia_id', academiaId).order('created_at', { ascending: false });
  treinosProntos = data || [];
  let filtrados = treinosProntos;
  if (busca) filtrados = treinosProntos.filter(t =>
    t.nome.toLowerCase().includes(busca) || (t.categoria && t.categoria.toLowerCase().includes(busca))
  );
  const tbody = document.getElementById('listaTreinosProntos');
  tbody.innerHTML = filtrados.map(t => `
    <tr>
      <td>${t.nome}</td>
      <td>${t.categoria}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="abrirEditarTreinoPronto('${t.id}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirTreinoPronto('${t.id}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

window.abrirCadastroTreinoPronto = function() {
  document.getElementById('formTreinoPronto').reset();
  document.getElementById('treinoProntoId').value = "";
  document.getElementById('tituloModalTreinoPronto').textContent = "Cadastrar Treino Pronto";
  letrasTreino = [];
  renderLetrasTreino();
  modalTreinoPronto.show();
};

window.abrirEditarTreinoPronto = async function(id) {
  letrasTreino = [];
  const { data: treino } = await supabase.from('treinos_prontos').select('*').eq('id', id).single();
  document.getElementById('treinoProntoId').value = id;
  document.getElementById('nomeTreinoPronto').value = treino.nome;
  document.getElementById('categoriaTreinoPronto').value = treino.categoria;
  document.getElementById('descricaoTreinoPronto').value = treino.descricao || '';
  // Busca letras/exercícios atuais
  const { data: itens } = await supabase.from('treinos_prontos_exercicios').select('*').eq('treino_pronto_id', id);
  if (itens && itens.length > 0) {
    for (const i of itens) {
      let letraObj = letrasTreino.find(l => l.letra === i.treino_letra);
      if (!letraObj) {
        letraObj = { letra: i.treino_letra, exercicios: [] };
        letrasTreino.push(letraObj);
      }
      letraObj.exercicios.push({
        id: i.exercicio_id,
        tipo: i.exercicio_tipo,
        series: i.series,
        repeticoes: i.repeticoes,
        nome: null // Preenchido depois
      });
    }
  }
  await carregarExerciciosTodos();
  renderLetrasTreino(true);
  document.getElementById('tituloModalTreinoPronto').textContent = "Editar Treino Pronto";
  modalTreinoPronto.show();
};

window.excluirTreinoPronto = async function(id) {
  if (!confirm("Excluir este treino pronto?")) return;
  await supabase.from('treinos_prontos').delete().eq('id', id);
  await supabase.from('treinos_prontos_exercicios').delete().eq('treino_pronto_id', id);
  carregarTreinosProntos();
};

function renderLetrasTreino(carregarNomes = false) {
  const div = document.getElementById('areaLetrasTreinoPronto');
  div.innerHTML = letrasTreino.map((t, idx) => {
    const exNames = t.exercicios.map((e, i) => {
      let desc = "";
      const lista = [...exerciciosGeral, ...exerciciosAcademia];
      if (carregarNomes && !e.nome) {
        const obj = lista.find(q => q.id === e.id);
        e.nome = obj ? obj.nome : "";
      }
      desc = e.nome || "";
      return `
        <div>
          ${desc} - Séries: ${e.series} - Rep: ${e.repeticoes}
          <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removerExercicioTreino(${idx},${i})">Remover</button>
        </div>
      `;
    }).join('');
    return `
      <div class="card mb-2">
        <div class="card-body">
          <h6>Treino ${t.letra}</h6>
          <div id="listaExerciciosLetra${idx}">${exNames}</div>
          <button type="button" class="btn btn-sm btn-outline-success mt-2" onclick="abrirAdicionarExercicioTreino(${idx})">Adicionar Exercício</button>
        </div>
      </div>
    `;
  }).join('');
}

window.removerExercicioTreino = function(tIndex, eIndex) {
  letrasTreino[tIndex].exercicios.splice(eIndex, 1);
  renderLetrasTreino();
};

window.abrirAdicionarExercicioTreino = function(tIndex) {
  const lista = [...exerciciosGeral.map(e => ({ ...e, tipo: 'geral' })), ...exerciciosAcademia.map(e => ({ ...e, tipo: 'academia' }))];
  const opts = lista.map(e => `<option value="${e.id},${e.tipo}">${e.nome} [${e.grupo_muscular}]</option>`).join('');
  const html = `
    <div class="mb-2">
      <label>Exercício:</label>
      <select id="exercicioAddTreino" class="form-select">${opts}</select>
    </div>
    <div class="mb-2">
      <label>Séries:</label>
      <input type="number" id="seriesAddTreino" class="form-control" min="1" required>
    </div>
    <div class="mb-2">
      <label>Repetições:</label>
      <input type="text" id="repeticoesAddTreino" class="form-control" required>
    </div>
    <button type="button" class="btn btn-primary" id="confirmAddExercicioTreino">Adicionar</button>
  `;
  const d = document.createElement('div');
  d.innerHTML = html;
  d.className = "p-3 bg-light border mb-3";
  const card = document.getElementById('areaLetrasTreinoPronto').children[tIndex].children[0];
  card.appendChild(d);
  d.querySelector('#confirmAddExercicioTreino').onclick = function() {
    const [id, tipo] = d.querySelector('#exercicioAddTreino').value.split(',');
    const nome = lista.find(e => e.id === id).nome;
    const series = d.querySelector('#seriesAddTreino').value;
    const repeticoes = d.querySelector('#repeticoesAddTreino').value;
    letrasTreino[tIndex].exercicios.push({ id, nome, tipo, series, repeticoes });
    renderLetrasTreino();
  };
};

document.getElementById('btnAdicionarLetraTreinoPronto').addEventListener('click', () => {
  const letra = String.fromCharCode(65 + letrasTreino.length); // A, B, ...
  letrasTreino.push({ letra, exercicios: [] });
  renderLetrasTreino();
});

// CRUD Salvar (create/update)
document.getElementById('formTreinoPronto').addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('treinoProntoId').value;
  const nome = document.getElementById('nomeTreinoPronto').value.trim();
  const categoria = document.getElementById('categoriaTreinoPronto').value;
  const descricao = document.getElementById('descricaoTreinoPronto').value.trim();

  let treinoId = id;
  if (!id) {
    const { data, error } = await supabase.from('treinos_prontos').insert([{
      nome, categoria, descricao,
      academia_id: academiaId
    }]).select().single();
    if (error) {
      document.getElementById('treinosProntosError').textContent = error.message;
      return;
    }
    treinoId = data.id;
  } else {
    await supabase.from('treinos_prontos').update({
      nome, categoria, descricao
    }).eq('id', id);
    await supabase.from('treinos_prontos_exercicios').delete().eq('treino_pronto_id', id);
  }
  // Insere exercícios
  for (let tInd = 0; tInd < letrasTreino.length; tInd++) {
    const letraObj = letrasTreino[tInd];
    for (let eInd = 0; eInd < letraObj.exercicios.length; eInd++) {
      const ex = letraObj.exercicios[eInd];
      await supabase.from('treinos_prontos_exercicios').insert([{
        treino_pronto_id: treinoId,
        treino_letra: letraObj.letra,
        exercicio_id: ex.id,
        exercicio_tipo: ex.tipo,
        ordem: eInd + 1,
        series: Number(ex.series),
        repeticoes: ex.repeticoes
      }]);
    }
  }
  modalTreinoPronto.hide();
  carregarTreinosProntos();
});

// Exercícios disponíveis (para selects)
async function carregarExerciciosTodos() {
  const { data: geral } = await supabase.from('exercicios_geral').select('*');
  exerciciosGeral = geral || [];
  const { data: academia } = await supabase.from('exercicios_academia').select('*').eq('academia_id', academiaId);
  exerciciosAcademia = academia || [];
}

document.getElementById('buscaTreino').addEventListener('input', carregarTreinosProntos);

window.addEventListener('DOMContentLoaded', async () => {
  await getAcademiaId();
  await carregarExerciciosTodos();
  carregarTreinosProntos();
});

// --- BUSCA E ATUALIZA O NOME DA ACADEMIA NO SIDEBAR ---
async function atualizarSidebarNomeAcademia() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    // Se tabela for 'academias', ajuste aqui
    const { data } = await supabase
      .from('academias')
      .select('nome')
      .eq('id', user.id)
      .single();
    if (data?.nome) {
      document.getElementById('nomeAcademiaSidebar').textContent = data.nome;
    }
  }
  
  window.addEventListener('DOMContentLoaded', atualizarSidebarNomeAcademia);
  