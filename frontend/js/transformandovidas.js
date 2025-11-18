document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const id_autor = usuario.id;
    const tipo_autor = usuario.tipo;

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
        try {
            const res = await fetch("http://localhost:3000/relatos");
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

                item.innerHTML = `
                    <div class="relato-texto">
                        <p><strong>${r.autor_nome || "Autor desconhecido"}</strong></p>
                        <p>${r.texto}</p>
                    </div>
                `;
                container.appendChild(item);
            });

        } catch (err) {
            console.error(err);
            container.innerHTML = "<p>Erro ao carregar relatos.</p>";
        }
    }

    listarRelatos();
});
