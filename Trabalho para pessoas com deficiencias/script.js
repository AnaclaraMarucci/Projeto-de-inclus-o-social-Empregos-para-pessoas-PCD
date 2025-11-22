// Acessando o container de cards pelo ID
const cardContainer = document.getElementById("cardContainer");
let dados = []; // Armazena os dados brutos do JSON

// Referências para os novos elementos de filtro
const caixaBusca = document.getElementById("caixaBusca");
const gruposFiltro = document.querySelectorAll(".filtro-grupo input[type='checkbox']");

// Mapeamento para nomes de exibição amigáveis (usado na função renderizarCards)
const mapaDeficiencia = {
    'fisica': 'Física',
    'auditiva': 'Auditiva',
    'visual': 'Visual',
    'intelectual': 'Intelectual',
    'mental': 'Mental/Psicossocial',
    'multipla': 'Múltipla',
    'todos': 'Todos'
};

// Função auxiliar para formatar o nome da deficiência
function formatarDeficiencia(tipo) {
    return mapaDeficiencia[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

// ----------------------------------------------------
// Função de Inicialização e Carregamento de Dados
// ----------------------------------------------------
async function iniciarBusca() {
    try {
        console.log("Tentando carregar dados de data.json...");
        
        const resposta = await fetch("data.json"); 
        
        if (!resposta.ok) {
            throw new Error(`Erro ao carregar data.json: Status ${resposta.status}`);
        }
        
        dados = await resposta.json();
        console.log(`Sucesso! ${dados.length} vagas carregadas.`);
        
        // 1. Renderiza todos os cards ao carregar
        renderizarCards(dados);

        // 2. Adiciona Listeners de eventos
        caixaBusca.addEventListener("input", filtrarDados);
        gruposFiltro.forEach(input => input.addEventListener("change", filtrarDados));

    } catch (error) {
        console.error("❌ ERRO GRAVE na inicialização. Verifique se 'data.json' existe e está formatado corretamente.", error);
        // Exibe uma mensagem de erro na interface, caso a falha persista
        cardContainer.innerHTML = "<p class='mensagem-erro'>Não foi possível carregar as vagas. Verifique o arquivo **data.json** no seu projeto.</p>";
        document.getElementById("contadorVagas").textContent = "Erro ao carregar vagas.";
    }
}

// ----------------------------------------------------
// Função Central de Filtragem (Lógica Múltipla Otimizada)
// ----------------------------------------------------
function filtrarDados() {
    const termoBuscado = caixaBusca.value.toLowerCase().trim();
    
    // 1. Coleta os filtros ativos
    const filtrosAtivos = {
        tipoDeficiencia: [],
        modalidade: []
    };

    gruposFiltro.forEach(input => {
        if (input.checked) {
            const grupo = input.name;
            filtrosAtivos[grupo].push(input.value);
        }
    });

    const dadosFiltrados = dados.filter(dado => {
        // A. FILTRO DE TEXTO (Busca Unificada)
        const textoParaBusca = `${dado.nome} ${dado.empresa} ${dado.descricao} ${dado.tags.join(' ')}`.toLowerCase();
        const correspondeTexto = !termoBuscado || textoParaBusca.includes(termoBuscado);

        // B. FILTRO DE DEFICIÊNCIA
        const tiposSelecionados = filtrosAtivos.tipoDeficiencia;
        let correspondeDeficiencia = false;
        
        // Se nenhum filtro foi marcado OU o filtro 'todos' foi marcado, aceita tudo.
        if (tiposSelecionados.length === 0 || tiposSelecionados.includes('todos')) {
            correspondeDeficiencia = true;
        } 
        // Se filtros específicos foram marcados, verifica se o tipo da vaga corresponde.
        else {
            correspondeDeficiencia = tiposSelecionados.includes(dado.tipo_deficiencia);
        }
        
        // C. FILTRO DE MODALIDADE
        const modalidadesSelecionadas = filtrosAtivos.modalidade;
        let correspondeModalidade = false;

        // Se nenhum filtro de modalidade for ativo, aceita tudo.
        if (modalidadesSelecionadas.length === 0) {
            correspondeModalidade = true;
        } 
        // Se filtros específicos foram marcados, verifica se a modalidade corresponde.
        else {
            correspondeModalidade = modalidadesSelecionadas.includes(dado.modalidade);
        }

        // Retorna verdadeiro apenas se TODOS os critérios forem atendidos
        return correspondeTexto && correspondeDeficiencia && correspondeModalidade;
    });

    renderizarCards(dadosFiltrados);
}

// ----------------------------------------------------
// Função para Adicionar Tag Clicada à Busca
// ----------------------------------------------------
function clicarTag(termo) {
    caixaBusca.value = termo;
    filtrarDados();
}

// ----------------------------------------------------
// Função de Renderização
// ----------------------------------------------------
function renderizarCards(dados) {
    const contadorElement = document.getElementById("contadorVagas");
    cardContainer.innerHTML = ""; // Limpa os cards existentes
    
    if (dados.length === 0) {
        cardContainer.innerHTML = "<p class='mensagem-vazia'>Nenhuma vaga encontrada com esses filtros. Tente refinar a busca.</p>";
        contadorElement.textContent = "0 vagas encontradas.";
        return;
    }

    // Atualiza o contador de vagas
    contadorElement.textContent = `${dados.length} vagas encontradas.`;

    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        
        const nomeDeficienciaFormatado = formatarDeficiencia(dado.tipo_deficiencia);
        
        // Cria o HTML das tags para Tags Interativas
        const tagsHtml = dado.tags.map(tag => 
            // Adiciona onclick para chamar a nova função com a tag como argumento
            `<span class="tag-item" onclick="clicarTag('${tag}')">#${tag}</span>`
        ).join('');

        article.innerHTML = `
            <h2>${dado.nome}</h2>
            
            <p class="empresa"><strong>Empresa:</strong> ${dado.empresa || "Confidencial"}</p>
            
            <div class="info-meta">
                <span>🏢 <strong>${dado.modalidade}</strong></span>
                <span>♿ <strong>${nomeDeficienciaFormatado}</strong></span>
            </div>

            <p class="data">⭐ Criado em: <strong>${dado.ano_historico || "Não informado"}</strong></p>
            
            <p>${dado.descricao}</p>
            
            <a href="${dado.link}" target="_blank">Saiba mais</a>
            
            <div class="tag-container">
                ${tagsHtml}
            </div>
        `;   
        cardContainer.appendChild(article);
    }
}

// Inicia a aplicação
iniciarBusca();