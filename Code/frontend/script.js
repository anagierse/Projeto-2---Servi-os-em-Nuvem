const API_URL = "https://n9zm9obpx9.execute-api.us-east-1.amazonaws.com/v1";



const reportModal = new bootstrap.Modal(document.getElementById('report-modal'));


async function fetchRecipes() {
    const listElement = document.getElementById('recipes-list');
    listElement.innerHTML = '<div class="col-12 text-center"><p>Carregando receitas...</p></div>';

    try {
        const response = await fetch(`${API_URL}/receitas`);
        const recipes = await response.json();

        if (response.status !== 200) {
             listElement.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">Erro ao carregar receitas: ${recipes.erro || 'Erro desconhecido'}</div></div>`;
             return;
        }

        listElement.innerHTML = '';
        if (recipes.length === 0) {
            listElement.innerHTML = '<div class="col-12"><div class="alert alert-info">Nenhuma receita cadastrada ainda.</div></div>';
            return;
        }

        recipes.forEach(recipe => {
            const cardHtml = `
                <div class="col">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${recipe.titulo}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">ID: ${recipe.id}</h6>
                            <p class="card-text">${recipe.descricao.substring(0, 100)}...</p>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">Preparo: <strong>${recipe.tempo_preparo_min || 'N/A'} min</strong></li>
                            <li class="list-group-item">Porções: <strong>${recipe.porcoes || 'N/A'}</strong></li>
                        </ul>
                        <div class="card-footer d-flex justify-content-end">
                            <button class="btn btn-sm btn-danger" onclick="deleteRecipe(${recipe.id})">Deletar</button>
                            </div>
                    </div>
                </div>
            `;
            listElement.innerHTML += cardHtml;
        });

    } catch (error) {
        console.error('Erro na requisição da API:', error);
        listElement.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">Falha ao conectar com o Backend: ${error.message}. Verifique a URL do API Gateway.</div></div>`;
    }
}

document.getElementById('recipe-form').addEventListener('submit', async (e) => {
 
    e.preventDefault();

    const newRecipe = {
        titulo: document.getElementById('titulo').value,
        descricao: document.getElementById('descricao').value,
        tempo_preparo_min: parseInt(document.getElementById('tempo_preparo_min').value) || null,
        porcoes: parseInt(document.getElementById('porcoes').value) || null
    };

    try {
        const response = await fetch(`${API_URL}/receitas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRecipe),
        });

        if (response.status === 201) {
            alert('Receita adicionada com sucesso!');
            document.getElementById('recipe-form').reset();
            new bootstrap.Collapse(document.getElementById('recipe-form-area')).hide(); 
            fetchRecipes(); 
        } else {
            const errorData = await response.json();
            alert(`Erro ao adicionar: ${errorData.erro || response.statusText}`);
        }
    } catch (error) {
        alert('Falha ao conectar com a API para criar receita.');
    }
});

async function deleteRecipe(id) {
    if (!confirm(`Tem certeza que deseja deletar a Receita ID: ${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/receitas/${id}`, {
            method: 'DELETE',
        });

        if (response.status === 204) {
            alert(`Receita ID ${id} deletada com sucesso!`);
            fetchRecipes(); 
        } else if (response.status === 404) {
            alert(`Erro: Receita ID ${id} não encontrada.`);
        } else {
            alert(`Erro ao deletar: Status ${response.status}`);
        }
    } catch (error) {
        alert('Falha ao conectar com a API para deletar receita.');
    }
}


async function fetchReport() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = '<p class="text-center">Aguardando resposta da AWS Lambda...</p>';
    reportModal.show();

    try {
        const response = await fetch(`${API_URL}/report`);

        if (response.ok) {
            const reportData = await response.json();
            reportContent.innerHTML = `
                <p><strong>Status:</strong> Sucesso (200)</p>
                <p>O Lambda consumiu a API e gerou as seguintes estatísticas:</p>
                <pre>${JSON.stringify(reportData, null, 2)}</pre>
            `;
        } else {
            const errorText = await response.text();
             reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <p>Falha no Lambda ou API Gateway (${response.status})</p>
                    <p>Verifique os logs do Lambda para detalhes.</p>
                    <pre>${errorText.substring(0, 200)}...</pre>
                </div>
            `;
        }
    } catch (error) {
        reportContent.innerHTML = `<div class="alert alert-danger">Falha de Rede: ${error.message}</div>`;
    }
}


document.addEventListener('DOMContentLoaded', fetchRecipes);