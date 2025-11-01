const API_URL = "https://n9zm9obpx9.execute-api.us-east-1.amazonaws.com/v1";

const reportModal = new bootstrap.Modal(document.getElementById('report-modal'));

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

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
                            <p class="card-text">${recipe.descricao ? recipe.descricao.substring(0, 100) + '...' : 'Sem descrição'}</p>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">Preparo: <strong>${recipe.tempo_preparo_min || 'N/A'} min</strong></li>
                            <li class="list-group-item">Porções: <strong>${recipe.porcoes || 'N/A'}</strong></li>
                        </ul>
                        <div class="card-footer d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${recipe.id})">
                                <i class="fas fa-pencil-alt"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteRecipe(${recipe.id})">
                                <i class="fas fa-trash"></i> Deletar
                            </button>
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
            showToast('Receita adicionada com sucesso!', 'success');
            document.getElementById('recipe-form').reset();
            new bootstrap.Collapse(document.getElementById('recipe-form-area')).hide(); 
            fetchRecipes(); 
        } else {
            const errorData = await response.json();
            showToast(`Erro ao adicionar: ${errorData.erro || response.statusText}`, 'danger');
        }
    } catch (error) {
        showToast('Falha ao conectar com a API para criar receita.', 'danger');
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
            showToast(`Receita ID ${id} deletada com sucesso!`, 'success');
            fetchRecipes(); 
        } else if (response.status === 404) {
            showToast(`Erro: Receita ID ${id} não encontrada.`, 'danger');
        } else {
            showToast(`Erro ao deletar: Status ${response.status}`, 'danger');
        }
    } catch (error) {
        showToast('Falha ao conectar com a API para deletar receita.', 'danger');
    }
}

async function openEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/receitas/${id}`);
        
        if (!response.ok) {
            showToast('Erro ao carregar dados da receita', 'danger');
            return;
        }

        const recipe = await response.json();

        document.getElementById('edit-id').value = recipe.id;
        document.getElementById('edit-titulo').value = recipe.titulo;
        document.getElementById('edit-descricao').value = recipe.descricao || '';
        document.getElementById('edit-tempo_preparo_min').value = recipe.tempo_preparo_min || '';
        document.getElementById('edit-porcoes').value = recipe.porcoes || '';
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();

    } catch (error) {
        showToast('Erro ao carregar dados para edição', 'danger');
    }
}

async function updateRecipe() {
    const id = document.getElementById('edit-id').value;
    const updatedRecipe = {
        titulo: document.getElementById('edit-titulo').value,
        descricao: document.getElementById('edit-descricao').value,
        tempo_preparo_min: parseInt(document.getElementById('edit-tempo_preparo_min').value) || null,
        porcoes: parseInt(document.getElementById('edit-porcoes').value) || null
    };

    try {
        const response = await fetch(`${API_URL}/receitas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedRecipe),
        });

        if (response.status === 200) {
            showToast('Receita atualizada com sucesso!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            modal.hide();
            fetchRecipes();
        } else {
            const errorData = await response.json();
            showToast(`Erro ao atualizar: ${errorData.erro || response.statusText}`, 'danger');
        }
    } catch (error) {
        showToast('Falha ao conectar com a API para atualizar receita.', 'danger');
    }
}

async function fetchReport() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = '<p class="text-center">Gerando relatório...</p>';
    reportModal.show();

    try {
        const response = await fetch(`${API_URL}/report`);

        if (response.ok) {
            const reportData = await response.json();
            
            let htmlContent = '<div class="p-3">';

            if (reportData.total_receitas !== undefined) {
                htmlContent += `
                    <div class="mb-3">
                        <strong>Total de Receitas:</strong> ${reportData.total_receitas}
                    </div>
                `;
            }

            if (reportData.tempo_medio_preparo !== undefined && reportData.tempo_medio_preparo !== null) {
                htmlContent += `
                    <div class="mb-3">
                        <strong>Tempo Médio:</strong> ${reportData.tempo_medio_preparo} minutos
                    </div>
                `;
            }

            if (reportData.receita_mais_rapida && reportData.receita_mais_rapida.titulo) {
                const tempo = reportData.receita_mais_rapida.tempo_preparo_min || 'N/A';
                htmlContent += `
                    <div class="mb-3">
                        <strong>Receita Mais Rápida:</strong><br>
                        ${reportData.receita_mais_rapida.titulo} (${tempo} min)
                    </div>
                `;
            }

            if (reportData.receita_mais_demorada && reportData.receita_mais_demorada.titulo) {
                const tempo = reportData.receita_mais_demorada.tempo_preparo_min || 'N/A';
                htmlContent += `
                    <div class="mb-3">
                        <strong>Receita Mais Demorada:</strong><br>
                        ${reportData.receita_mais_demorada.titulo} (${tempo} min)
                    </div>
                `;
            }

            // Distribuição por porções
            if (reportData.distribuicao_porcoes && Object.keys(reportData.distribuicao_porcoes).length > 0) {
                htmlContent += `<div class="mb-3"><strong>Distribuição por Porções:</strong>`;
                
                Object.entries(reportData.distribuicao_porcoes).forEach(([porcoes, quantidade]) => {
                    htmlContent += `<br>• ${porcoes} porção${porcoes != 1 ? 'es' : ''}: ${quantidade}`;
                });
                
                htmlContent += `</div>`;
            }

            htmlContent += '</div>';

            reportContent.innerHTML = htmlContent;

        } else {
            reportContent.innerHTML = '<div class="alert alert-danger">Erro ao gerar relatório</div>';
        }
    } catch (error) {
        reportContent.innerHTML = '<div class="alert alert-danger">Falha de conexão</div>';
    }
}

document.addEventListener('DOMContentLoaded', fetchRecipes);