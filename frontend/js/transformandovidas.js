document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const id_autor = usuario.id;
    // Converter tipo para o formato correto do banco (voluntarios/comunidades com 's')
    const tipo_autor = usuario.tipo === 'voluntario' ? 'voluntarios' : 'comunidades';

    const btnAbrirModal = document.getElementById("btnAbrirModal");
    const modal = document.getElementById("modalRelato");
    const btnFecharModal = modal.querySelector(".btnFecharModal");
    const btnSalvarRelato = document.getElementById("btnSalvarRelato");
    const container = document.getElementById("relatos-container");

    btnAbrirModal.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.remove("hidden");
    });

    btnFecharModal.addEventListener("click", () => modal.classList.add("hidden"));

    btnSalvarRelato.addEventListener("click", async () => {
    const texto = document.getElementById("relatoTexto").value.trim();

    if (!texto) return alert("Digite o texto do relato.");

    try {
        const res = await fetch("http://localhost:3000/relatos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_autor, tipo_autor, texto })
        });

        const result = await res.json();

        if (res.ok) {
            alert("Relato publicado!");
            modal.classList.add("hidden");

            document.getElementById("relatoTexto").value = ""; // limpa campo

            listarRelatos();
        } else {
            alert(result.message || "Erro ao salvar relato.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    }
});


    // ===============================
    //      LISTAR RELATOS
    // ===============================
    async function listarRelatos() {
        if (!container) {
            console.error("Container de relatos não encontrado no DOM!");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/relatos");
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const json = await res.json();

            container.innerHTML = "";
            if (!json.success || json.data.length === 0) {
                container.innerHTML = "<p>Nenhum relato encontrado.</p>";
                return;
            }

            json.data.forEach((r, index) => {
                const item = document.createElement("div");
                item.classList.add("relato-item");
                if ((index + 1) % 2 === 0) item.classList.add("reverse");

                // Verifica se o relato pertence ao usuário logado
                const tipo_relato = r.tipo_autor;
                const id_relato_autor = r.id_autor;
                const ehMeuRelato = (tipo_relato === tipo_autor && id_relato_autor === id_autor);

                item.innerHTML = `
                    <div class="relato-texto">
                        <p><strong>${r.autor_nome || "Autor desconhecido"}</strong></p>
                        <p>${r.texto}</p>
                        ${ehMeuRelato ? `
                            <div class="relato-acoes">
                                <button class="btn-editar-relato" data-id="${r.id}">Editar</button>
                                <button class="btn-excluir-relato" data-id="${r.id}">Excluir</button>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Adicionar eventos aos botões se for do usuário
                if (ehMeuRelato) {
                    const btnEditar = item.querySelector('.btn-editar-relato');
                    const btnExcluir = item.querySelector('.btn-excluir-relato');
                    
                    if (btnEditar) {
                        btnEditar.addEventListener('click', () => editarRelato(r.id, r.texto));
                    }
                    
                    if (btnExcluir) {
                        btnExcluir.addEventListener('click', () => excluirRelato(r.id));
                    }
                }
                
                container.appendChild(item);
            });

        } catch (err) {
            console.error("Erro ao carregar relatos:", err);
            if (container) {
                container.innerHTML = "<p>Erro ao carregar relatos. A tabela pode não existir no banco de dados.</p>";
            }
        }
    }

    listarRelatos();

    // ===============================
    //      CONFIGURAR NAVEGAÇÃO
    // ===============================
    configurarNavegacao();
    configurarLogout();
});

// Configurar links dinâmicos baseado no tipo de usuário
function configurarNavegacao() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) return;

    const linkMinhasInfos = document.getElementById("link-minhas-infos");
    const linkPainel = document.getElementById("link-painel");

    if (usuario.tipo === "voluntario") {
        if (linkMinhasInfos) linkMinhasInfos.href = "minhasinfos.html";
        if (linkPainel) linkPainel.href = "voluntario.html";
        if (linkPainel) linkPainel.textContent = "Painel do Voluntário";
    } else if (usuario.tipo === "comunidade") {
        if (linkMinhasInfos) linkMinhasInfos.href = "minhasinfoscomunidade.html";
        if (linkPainel) linkPainel.href = "comunidade.html";
        if (linkPainel) linkPainel.textContent = "Painel da Comunidade";
    }
}

// Configurar logout
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

// Editar relato
function editarRelato(relatoId, textoAtual) {
    const novoTexto = prompt('Edite seu relato:', textoAtual);
    
    if (novoTexto === null || novoTexto.trim() === '') {
        return; // Cancelou ou deixou vazio
    }
    
    if (novoTexto.trim() === textoAtual) {
        return; // Não houve alteração
    }
    
    fetch(`http://localhost:3000/relatos/${relatoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: novoTexto.trim() })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Relato atualizado com sucesso!');
            location.reload(); // Recarrega a página para mostrar a atualização
        } else {
            alert('Erro ao atualizar relato: ' + (data.message || 'Erro desconhecido'));
        }
    })
    .catch(err => {
        console.error('Erro ao editar relato:', err);
        alert('Erro de conexão ao editar relato.');
    });
}

// Excluir relato
function excluirRelato(relatoId) {
    const confirmacao = confirm('Tem certeza que deseja excluir este relato?\n\nEsta ação não pode ser desfeita.');
    
    if (!confirmacao) {
        return;
    }
    
    fetch(`http://localhost:3000/relatos/${relatoId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Relato excluído com sucesso!');
            location.reload(); // Recarrega a página para remover o relato
        } else {
            alert('Erro ao excluir relato: ' + (data.message || 'Erro desconhecido'));
        }
    })
    .catch(err => {
        console.error('Erro ao excluir relato:', err);
        alert('Erro de conexão ao excluir relato.');
    });
}
