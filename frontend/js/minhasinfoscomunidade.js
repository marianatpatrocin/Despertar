document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    const params = new URLSearchParams(window.location.search);
    const comunidadeId = params.get("id");

    if (!usuario) {
        alert("Nenhum usuário logado.");
        window.location.href = "login.html";
        return;
    }

    // Se tiver id na URL, é um voluntário acessando
    if (comunidadeId) {
        carregarDadosComunidadeVoluntario(comunidadeId);
    } else {
        // Caso contrário, é a própria comunidade logada
        configurarModal();
        carregarDadosComunidade(usuario);
    }
});

// --- Carrega dados da própria comunidade (logada) ---
function carregarDadosComunidade(user) {
    document.getElementById("nome-comunidade").innerText = user.nome_comunidade;
    document.getElementById("email-comunidade").innerText = user.email;
    document.getElementById("responsavel").innerText = user.nome_responsavel;
    document.getElementById("telefone").innerText = user.telefone || "Não informado";
    document.getElementById("endereco").innerText = user.endereco || "Não informado";
    document.getElementById("num-jovens").innerText = user.num_criancas_jovens ?? "Não informado";
    document.getElementById("faixa-etaria").innerText = user.faixa_etaria_aprox;
    document.getElementById("estrutura").innerText = user.possui_estrutura ? "Sim" : "Não";
    document.getElementById("descricao").innerText = user.descricao || "Sem descrição";

    preencherModal(user);
    configurarModal();
}




// --- Modal e edição (mantidos igual ao seu código original) ---
function preencherModal(user) {
    document.getElementById("edit-nome").value = user.nome_comunidade;
    document.getElementById("edit-responsavel").value = user.nome_responsavel;
    document.getElementById("edit-email").value = user.email;
    document.getElementById("edit-telefone").value = user.telefone || "";
    document.getElementById("edit-endereco").value = user.endereco || "";
    document.getElementById("edit-descricao").value = user.descricao || "";
    document.getElementById("edit-num-jovens").value = user.num_criancas_jovens ?? "";
    document.getElementById("edit-faixa-etaria").value = user.faixa_etaria_aprox;
    document.getElementById("edit-estrutura").value = user.possui_estrutura ? "1" : "0";
}

function configurarModal() {
    const modal = document.getElementById("modal-editar");
    const btnEdit = document.getElementById("editarPerfil");
    const fechar = document.getElementById("fechar-modal");

    btnEdit.onclick = () => { modal.style.display = "block"; };
    fechar.onclick = () => { modal.style.display = "none"; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

    document.getElementById("form-editar").addEventListener("submit", salvarEdicao);
}

function salvarEdicao(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("usuarioLogado"));

    const dadosAtualizados = {
        nome_comunidade: document.getElementById("edit-nome").value,
        nome_responsavel: document.getElementById("edit-responsavel").value,
        email: document.getElementById("edit-email").value,
        telefone: document.getElementById("edit-telefone").value || null,
        endereco: document.getElementById("edit-endereco").value || null,
        descricao: document.getElementById("edit-descricao").value || null,
        num_criancas_jovens: parseInt(document.getElementById("edit-num-jovens").value) || null,
        faixa_etaria_aprox: document.getElementById("edit-faixa-etaria").value,
        possui_estrutura: parseInt(document.getElementById("edit-estrutura").value),
        senha: document.getElementById("edit-senha").value || user.senha
    };

    fetch(`http://localhost:3000/comunidades/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados)
    })
    .then(res => res.json())
    .then(response => {
        if (!response.success) {
            alert("Erro ao salvar: " + response.message);
            return;
        }

        const novoUser = { ...user, ...dadosAtualizados };
        localStorage.setItem("usuarioLogado", JSON.stringify(novoUser));
        carregarDadosComunidade(novoUser);
        document.getElementById("modal-editar").style.display = "none";
        alert("Informações atualizadas!");
    })
    .catch(err => {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    });
}
