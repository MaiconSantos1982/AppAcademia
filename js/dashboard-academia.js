// js/dashboard-academia.js

async function getAcademiaId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.id;
  }
  
  async function exibeTotalAlunos(academiaId) {
    const { data, error } = await supabase
      .from('alunos')
      .select('id')
      .eq('academia_id', academiaId)
      .eq('ativo', true);
  
    const total = data ? data.length : 0;
    document.getElementById('totalAtivos').textContent = total;
    if (error) document.getElementById('dashboardError').textContent = error.message;
  }
  
  async function exibeGraficoCheckin(academiaId) {
    const { data, error } = await supabase
      .from('checkins')
      .select('data_checkin')
      .eq('academia_id', academiaId)
      .gte('data_checkin', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('data_checkin', { ascending: true });
  
    if (error) {
      document.getElementById('dashboardError').textContent = error.message;
      return;
    }
  
    async function exibeNomeAcademiaSidebar() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const academiaId = user.id;
        const { data: acad } = await supabase
          .from('academias')
          .select('nome')
          .eq('id', academiaId)
          .single();
        if (acad && acad.nome) {
          document.getElementById('nomeAcademiaSidebar').textContent = acad.nome;
        }
      }
      window.addEventListener('DOMContentLoaded', exibeNomeAcademiaSidebar);
      
    // Dias dos últimos 7
    const dias = Array(7).fill().map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
  
    // Count por dia
    const counts = dias.map((diaStr) =>
      data.filter((item) => {
        const itemDia = new Date(item.data_checkin).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
        return itemDia === diaStr;
      }).length
    );
  
    // Chart.js
    const ctx = document.getElementById('graficoCheckin').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dias,
        datasets: [{
          label: 'Check-ins por dia',
          data: counts,
          backgroundColor: '#007bff'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, maxTicksLimit:6 }},
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
  
  window.addEventListener('DOMContentLoaded', async () => {
    const academiaId = await getAcademiaId();
    if (!academiaId) {
      window.location.href = 'login-academia.html';
      return;
    }
    exibeTotalAlunos(academiaId);
    exibeGraficoCheckin(academiaId);
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
  