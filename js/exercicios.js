// js/exercicios.js

let academiaId = null;
let exerciciosGeral = [];
let exerciciosAcademia = [];

const modalExercicio = new bootstrap.Modal(document.getElementById('modalExercicio'));

async function getAcademiaId() {
  const { data: { user } } = await supabase.auth.getUser();
  academiaId = user?.id;
  if (!academiaId) window.location.href = 'login-academia.html';
}

// Exercícios Geral (apenas leitura)
async function carregarExerciciosGeral() {
  const busca = document.getElementById('buscaExercicio').value.trim().toLowerCase();
  const { data } = await supabase.from('exercicios_geral').select('*').order('nome', { ascending: true });
  exerciciosGeral = data || [];
  let filtrados = exerciciosGeral;
  if (busca) filtrados = exerciciosGeral.filter(e =>
    e.nome.toLowerCase().includes(busca) ||
    (e.grupo_muscular && e.grupo_muscular.toLowerCase().includes(busca))
  );
  const tbody = document.getElementById('listaExerciciosGeral');
  tbody.innerHTML = filtrados.map(e => `
    <tr>
      <td>${e.nome}</td>
      <td>${e.grupo_muscular}</td>
      <td>${e.video_url ? `<a href="${e.video_url}" target="_blank" class="btn btn-sm btn-info">Vídeo</a>` : '-'}</td>
    </tr>
  `).join('');
}

// Exercícios da academia (CRUD)
async function carregarExerciciosAcademia() {
  const busca = document.getElementById('buscaExercicio').value.trim().toLowerCase();
  const { data } = await supabase
    .from('exercicios_academia')
    .select('*')
    .eq('academia_id', academiaId)
    .order('nome', { ascending: true });
  exerciciosAcademia = data || [];
  let filtrados = exerciciosAcademia;
  if (busca) filtrados = exerciciosAcademia.filter(e =>
    e.nome.toLowerCase().includes(busca) ||
    (e.grupo_muscular && e.grupo_muscular.toLowerCase().includes(busca))
  );
  const tbody = document.getElementById('listaExerciciosAcademia');
  tbody.innerHTML = filtrados.map(e => `
    <tr>
      <td>${e.nome}</td>
      <td>${e.grupo_muscular}</td>
      <td>${e.video_url ? `<a href="${e.video_url}" target="_blank" class="btn btn-sm btn-info">Vídeo</a>` : '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="abrirEditarExercicio('${e.id}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirExercicio('${e.id}')">Excluir</button>
      </td>
    </tr>
  `).join('');
}

window.abrirCadastroExercicio = function() {
  document.getElementById('formExercicio').reset();
  document.getElementById('exercicioId').value = "";
  modalExercicio.show();
  document.getElementById('tituloModalExercicio').textContent = "Cadastrar Exercício da academia";
};

window.abrirEditarExercicio = function(id) {
  const e = exerciciosAcademia.find(e => e.id === id);
  if (!e) return;
  document.getElementById('exercicioId').value = e.id;
  document.getElementById('nome').value = e.nome || "";
  document.getElementById('grupo_muscular').value = e.grupo_muscular || "";
  document.getElementById('video_url').value = e.video_url || "";
  document.getElementById('descricao').value = e.descricao || "";
  modalExercicio.show();
  document.getElementById('tituloModalExercicio').textContent = "Editar Exercício";
};

// CRUD submit
document.getElementById('formExercicio').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('exercicioId').value;
  const obj = {
    nome: document.getElementById('nome').value.trim(),
    grupo_muscular: document.getElementById('grupo_muscular').value.trim(),
    video_url: document.getElementById('video_url').value.trim(),
    descricao: document.getElementById('descricao').value.trim(),
    academia_id: academiaId
  };
  let resp;
  if (id) {
    resp = await supabase.from('exercicios_academia').update(obj).eq('id', id);
  } else {
    resp = await supabase.from('exercicios_academia').insert([obj]);
  }
  modalExercicio.hide();
  carregarExerciciosAcademia();
});

window.excluirExercicio = async function(id) {
  if (!confirm("Excluir este exercício?")) return;
  await supabase.from('exercicios_academia').delete().eq('id', id);
  carregarExerciciosAcademia();
};

document.getElementById('buscaExercicio').addEventListener('input', () => {
  carregarExerciciosGeral();
  carregarExerciciosAcademia();
});

window.addEventListener('DOMContentLoaded', async () => {
  await getAcademiaId();
  carregarExerciciosGeral();
  carregarExerciciosAcademia();
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
  