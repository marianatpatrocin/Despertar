const API_BASE = 'http://localhost:3000';

function showTemporaryMessage(message, isError = false) {
    console.log(message);
    
    const msgBox = document.createElement('div');
    msgBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        background-color: ${isError ? '#ef4444' : '#10b981'}; /* bg-red-500 ou bg-emerald-500 */
        color: white;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-family: 'Inter', sans-serif;
        transition: opacity 0.3s ease-in-out;
        opacity: 1;
    `;
    msgBox.innerText = message;
    document.body.appendChild(msgBox);

    setTimeout(() => {
        msgBox.style.opacity = '0';
        setTimeout(() => document.body.removeChild(msgBox), 300);
    }, 4000); 
}

document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || usuario.tipo !== 'comunidade') { 
        window.location.href = "login.html";
        return;
    }

    const id_comunidade = usuario.id;

    const btnOpenModal = document.getElementById("btnNovaOficina");
    const modal = document.getElementById("modalNovaOficina");
    const btnCloseModal = document.querySelector("#modalNovaOficina .btnFecharModal");
    const btnSalvar = document.getElementById("salvarOficina");

    const searchInput = document.getElementById("voluntario-search");
    const searchButton = document.getElementById("btnBuscarVoluntario");
    const filters = document.querySelectorAll(".filter-option");
    const resultsContainer = document.getElementById("volunteers-list-container");

    let areaSelecionada = "";

    if (!btnOpenModal) { console.error("Elemento 'btnNovaOficina' (Botão de abrir modal) não encontrado. Verifique o ID no HTML."); }
    if (!modal) { console.error("Elemento 'modalNovaOficina' (Container do Modal) não encontrado. Verifique o ID no HTML."); }
    
    if (btnOpenModal && modal) {
       
        btnOpenModal.addEventListener("click", () => modal.classList.remove("hidden"));
    }
    if (btnCloseModal && modal) {
        btnCloseModal.addEventListener("click", () => modal.classList.add("hidden"));
    }

    if (btnSalvar) {
        btnSalvar.addEventListener("click", async () => {
            const novaOficina = {
                id_comunidade,
                titulo: document.getElementById("oficinaTitulo").value,
                data_oficina: document.getElementById("oficinaData").value,
                horario: document.getElementById("oficinaHorario").value,
                local: document.getElementById("oficinaLocal").value,
            };

            const response = await fetch(`${API_BASE}/oficinas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novaOficina)
            });

            const result = await response.json();

            if (response.ok) {
                if (modal) modal.classList.add("hidden");
                showTemporaryMessage("Oficina salva com sucesso!");
                listarOficinas(id_comunidade);
            } else {
                showTemporaryMessage("Erro ao salvar oficina: " + (result.message || 'Erro desconhecido'), true);
                console.error(result);
            }
        });
    }

    filters.forEach(btn => {
        btn.addEventListener("click", () => {
            filters.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            areaSelecionada = btn.textContent === "Todas" ? "" : btn.textContent;
            if (searchInput) searchInput.value = areaSelecionada;
            
            // Buscar automaticamente ao clicar no filtro
            buscarVoluntarios();
        });
    });

    if (searchButton) {
        searchButton.addEventListener("click", () => buscarVoluntarios());
    }

    // Buscar voluntários ao carregar a página
    buscarVoluntarios();

    // ------- ENVIAR CONVITE -------
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-convidar")) return;

        const idVoluntario = e.target.getAttribute("data-id");
        const idComunidade = usuario.id; 

        const resposta = await fetch(`${API_BASE}/convites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_comunidade: idComunidade,
                id_voluntario: idVoluntario
            })
        });

        const data = await resposta.json();
        
        showTemporaryMessage(data.message, !resposta.ok);
    });

    listarOficinas(id_comunidade);
    setupEditDeleteModal(id_comunidade);
    configurarLogout();
}); 

// Função para buscar voluntários
async function buscarVoluntarios() {
    const searchInput = document.getElementById("voluntario-search");
    const resultsContainer = document.getElementById("volunteers-list-container");
    
    const area = searchInput ? searchInput.value.trim() : "";
    
    try {
        const url = area ? `${API_BASE}/voluntarios?area=${encodeURIComponent(area)}` : `${API_BASE}/voluntarios`;
        const res = await fetch(url);
        const json = await res.json();

        if (resultsContainer) resultsContainer.innerHTML = "<h3 class='text-lg font-semibold mb-3'>Resultados da Busca</h3>";

        if (!json.success || json.data.length === 0) {
            if (resultsContainer) resultsContainer.innerHTML += "<p>Nenhum voluntário encontrado.</p>";
            return;
        }

        json.data.forEach(v => {
            const card = document.createElement("div");
            card.classList.add("voluntario-card", "p-3", "bg-gray-50", "rounded-lg", "shadow-sm", "mb-2", "flex", "justify-between", "items-center");
            card.innerHTML = `
                <div>
                    <p class="font-medium">${v.nome}</p>
                    <p class="text-sm text-gray-600">${v.area_atuacao || 'Área não especificada'}</p>
                    ${v.descricao ? `<p class="text-xs text-gray-500 mt-1">${v.descricao}</p>` : ''}
                </div>
                <button class="btn-convidar px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition duration-150" data-id="${v.id}">Convidar</button>
            `;
            if (resultsContainer) resultsContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Erro ao buscar voluntários:", err);
        showTemporaryMessage("Erro ao buscar voluntários. Verifique a conexão com o servidor.", true);
    }
}


// ---------- Helpers ----------
function toDateInputValue(datetimeStr) {
    if (!datetimeStr) return "";
    if (datetimeStr.includes("T")) {
        return datetimeStr.split("T")[0];
    }
    return datetimeStr.split(" ")[0];
}

async function safeJson(res) {
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return txt || {}; }
}

function formatarData(dataISO) {
    if (!dataISO) return "";

    const data = new Date(dataISO);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

// ---------- LISTAR OFICINAS ----------
async function listarOficinas(id_comunidade) {
    const listaOficinas = document.getElementById("lista-atividades-admin");
    if (!listaOficinas) return;

    try {
        const response = await fetch(`${API_BASE}/oficinas/comunidade/${id_comunidade}`);
        const json = await response.json();

        if (!response.ok || !json.success) {
            listaOficinas.innerHTML = '<p class="text-red-500">Erro ao carregar oficinas ou resposta inválida.</p>';
            return;
        }
        
        listaOficinas.innerHTML = "";

        if (json.data.length === 0) {
            listaOficinas.innerHTML = '<p class="text-gray-500 italic">Nenhuma oficina cadastrada. Clique em "+ Nova Oficina" para começar.</p>';
            return;
        }

        json.data.forEach(ofc => {
            const div = document.createElement("div");
            div.classList.add("oficinaItem", "p-4", "border", "border-gray-200", "rounded-lg", "shadow-sm", "hover:shadow-md", "transition", "duration-200", "bg-white");
            div.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">${ofc.titulo}</h3>
                <p class="text-sm text-gray-600"><strong>Data:</strong> ${formatarData(ofc.data_oficina)}</p>
                <p class="text-sm text-gray-600"><strong>Horário:</strong> ${ofc.horario}</p>
                <p class="text-sm text-gray-600"><strong>Local:</strong> ${ofc.local}</p>
                <p class="text-sm font-semibold text-green-600 mt-2">👥 Participantes confirmados: ${ofc.total_confirmados || 0}</p>
                <div class="oficina-actions mt-3">
                    <button class="btnEditar px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition duration-150" data-id="${ofc.id}">Editar</button>
                </div>
            `;
            listaOficinas.appendChild(div);
        });
    } catch (error) {
        console.error("Erro na comunicação com a API de oficinas:", error);
        listaOficinas.innerHTML = '<p class="text-red-500">Não foi possível conectar ao servidor da API.</p>';
    }
}

// ------- MODAL DE EDIÇÃO E EXCLUSÃO (Implementação Corrigida) -------
function setupEditDeleteModal(id_comunidade) {
    const modalEditar = document.getElementById('modalEditarOficina');
    const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
    const btnFecharModalEditar = document.querySelector("#modalEditarOficina .btnFecharModal");
    const btnExcluirOficinaModal = document.getElementById('btnExcluirOficinaModal'); // botão de excluir no modal

    const editId = document.getElementById('editId');
    const editTitulo = document.getElementById('editTitulo');
    const editData = document.getElementById('editData');
    const editHorario = document.getElementById('editHorario');
    const editLocal = document.getElementById('editLocal');

    // Fechar modal de edição
    if (btnFecharModalEditar) {
        btnFecharModalEditar.addEventListener('click', () => {
            if (modalEditar) modalEditar.classList.add('hidden');
        });
    }

    // Ação de clique nos botões "Editar" (lista)
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btnEditar')) {
            const oficinaId = e.target.getAttribute('data-id');
            
            try {
                const response = await fetch(`${API_BASE}/oficinas/${oficinaId}`);
                const json = await response.json();

                if (response.ok && json.success) {
                    const ofc = json.data;
                    editId.value = ofc.id;
                    editTitulo.value = ofc.titulo || '';
                    editData.value = toDateInputValue(ofc.data_oficina || '');
                    editHorario.value = ofc.horario || '';
                    editLocal.value = ofc.local || '';

                    if (modalEditar) modalEditar.classList.remove('hidden');
                } else {
                    showTemporaryMessage("Não foi possível carregar os dados da oficina.", true);
                }
            } catch (error) {
                console.error("Erro ao buscar oficina para edição:", error);
                showTemporaryMessage("Erro de conexão ao buscar oficina.", true);
            }
        }
    });

    // Ação de salvar edição
    if (btnSalvarEdicao) {
        btnSalvarEdicao.addEventListener('click', async () => {
            const oficinaId = editId.value;
            const oficinaAtualizada = {
                titulo: editTitulo.value,
                data_oficina: editData.value,
                horario: editHorario.value,
                local: editLocal.value,
            };

            try {
                const response = await fetch(`${API_BASE}/oficinas/${oficinaId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(oficinaAtualizada)
                });

                const result = await response.json();

                if (response.ok) {
                    if (modalEditar) modalEditar.classList.add('hidden');
                    showTemporaryMessage("Oficina atualizada com sucesso!");
                    listarOficinas(id_comunidade); // Recarrega a lista
                } else {
                    showTemporaryMessage("Erro ao salvar alterações: " + (result.message || 'Erro desconhecido'), true);
                }
            } catch (error) {
                console.error("Erro ao salvar edição:", error);
                showTemporaryMessage("Erro de conexão ao salvar edição.", true);
            }
        });
    }

    // Ação de excluir oficina (agora dentro da função, com escopo correto)
    if (btnExcluirOficinaModal) {
        btnExcluirOficinaModal.addEventListener('click', async () => {
            const oficinaId = editId.value;
            if (!oficinaId) return showTemporaryMessage("ID da oficina inválido.", true);

            // Confirmação simples (pode trocar por modal de confirmação)
            if (!confirm("Deseja realmente excluir esta oficina? Esta ação não pode ser desfeita.")) return;

            try {
                const response = await fetch(`${API_BASE}/oficinas/${oficinaId}`, {
                    method: 'DELETE'
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok) {
                    if (modalEditar) modalEditar.classList.add('hidden');
                    showTemporaryMessage(result.message || "Oficina excluída com sucesso.");
                    listarOficinas(id_comunidade);
                } else {
                    showTemporaryMessage("Erro ao excluir oficina: " + (result.message || 'Erro desconhecido'), true);
                    console.error("Resposta exclusão:", result);
                }
            } catch (error) {
                console.error("Erro ao excluir oficina:", error);
                showTemporaryMessage("Erro de conexão ao excluir oficina.", true);
            }
        });
    }
}

// --- LOGOUT ---
function configurarLogout() {
  const btnSair = document.getElementById('btn-sair');
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('usuarioLogado');
      alert('Logout realizado com sucesso!');
      window.location.href = 'inicio.html';
    });
  }
}
