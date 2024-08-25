// Validação do email na primeira tela
var emailField = document.getElementById('email');
var btnProsseguir = document.getElementById('btn-prosseguir');
var errorMessage = document.getElementById('error-message');

emailField.addEventListener('input', function() {
    var validDomains = ["@grupofleury.com.br", "@grupopardini.com.br", "@genesys.com.br"];

    var isValidEmail = validDomains.some(function(domain) {
        return emailField.value.endsWith(domain);
    });

    btnProsseguir.disabled = !isValidEmail;

    if (isValidEmail) {
        errorMessage.style.display = 'none';
    }
});

var loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var isValidEmail = !btnProsseguir.disabled;

        if (!isValidEmail) {
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
            sessionStorage.setItem('userEmail', emailField.value);

            // Substitui o formulário inicial pelo componente de steps
            showSteps();
        }
    });
}

// Função principal para exibir os steps e gerenciar o fluxo
function showSteps() {
    var mainContainer = document.getElementById('main-container');
    var loginContainer = document.getElementById('login-container');
    var stepsContainer = document.getElementById('steps-container');

    // Esconde o contêiner de login e exibe o contêiner de steps
    loginContainer.style.display = 'none';
    stepsContainer.style.display = 'block';

    // Cria a estrutura dos steps
    var stepsContent = document.createElement('div');
    stepsContent.classList.add('steps-container');

    var steps = [
        { label: 'Cadastro', content: generateStepContent('Cadastro') },
        { label: 'Local', content: generateStepContent('Local') },
        { label: 'Exames', content: generateStepContent('Exames') }
    ];

    steps.forEach(function(step, index) {
        var stepElement = document.createElement('div');
        stepElement.classList.add('step');
        if (index === 0) stepElement.classList.add('active');
        stepElement.setAttribute('data-step', index + 1);

        var stepNumber = document.createElement('span');
        stepNumber.classList.add('step-number');
        stepNumber.textContent = index + 1;

        var stepLabel = document.createElement('span');
        stepLabel.classList.add('step-label');
        stepLabel.textContent = step.label;

        stepElement.appendChild(stepNumber);
        stepElement.appendChild(stepLabel);
        stepsContent.appendChild(stepElement);
    });

    stepsContainer.appendChild(stepsContent);

    var stepContentContainer = document.createElement('div');
    stepContentContainer.classList.add('step-content');
    stepsContainer.appendChild(stepContentContainer);

    var navigationButtons = document.createElement('div');
    navigationButtons.classList.add('navigation-buttons');

    var nextButton = document.createElement('button');
    nextButton.id = 'nextStep';
    nextButton.textContent = 'Avançar';
    nextButton.classList.add('btn-avancar');
    nextButton.disabled = true;  // Desabilitado por padrão até que todos os campos sejam preenchidos

    var prevButton = document.createElement('button');
    prevButton.id = 'prevStep';
    prevButton.textContent = 'Voltar';
    prevButton.classList.add('btn-voltar');
    prevButton.disabled = true;

    navigationButtons.appendChild(nextButton);
    navigationButtons.appendChild(prevButton);  // Invertendo a ordem dos botões
    stepsContainer.appendChild(navigationButtons);

    var currentStep = 1;
    updateStepContent(currentStep);

    prevButton.addEventListener('click', function() {
        if (currentStep > 1) {
            saveCurrentStepData(currentStep); // Salva os dados antes de voltar
            currentStep--;
            updateStepContent(currentStep);
            loadPreviousStepData(currentStep); // Carrega os dados ao voltar
        }
    });

    nextButton.addEventListener('click', function() {
        saveCurrentStepData(currentStep); // Salva os dados no sessionStorage antes de avançar

        if (currentStep < steps.length) {
            currentStep++;
            updateStepContent(currentStep);
        } else {
            if (validateStep3()) {
                submitAllData(); // Envia os dados para o Google Sheets
            }
        }
    });

    function updateStepContent(step) {
        steps.forEach(function(_, index) {
            var stepElement = document.querySelector(`.step[data-step="${index + 1}"]`);
            stepElement.classList.toggle('active', index + 1 === step);
        });

        stepContentContainer.innerHTML = steps[step - 1].content;

        prevButton.disabled = step === 1; // Desabilita o botão Voltar no primeiro step
        prevButton.style.display = step === 1 ? 'none' : 'inline-block'; // Esconde o botão Voltar no primeiro step
        nextButton.textContent = step === steps.length ? 'Enviar' : 'Avançar';

        if (step === 1) {
            // Validações para o Step de Cadastro

            var formFields = document.querySelectorAll('#form-step-cadastro input[required]');
            formFields.forEach(function(field) {
                field.addEventListener('input', function() {
                    validateFormFields(formFields, nextButton);
                });
            });

            var phoneField = document.getElementById('telefone');
            phoneField.addEventListener('input', function(e) {
                e.target.value = phoneMask(e.target.value);
                validatePhone(phoneField);
                validateFormFields(formFields, nextButton);
            });

            var cpfField = document.getElementById('cpf');
            cpfField.addEventListener('input', function(e) {
                e.target.value = cpfMask(e.target.value);
                validateCPF(cpfField);
                validateFormFields(formFields, nextButton);
            });

            var nomeField = document.getElementById('nomeCompleto');
            nomeField.addEventListener('input', function(e) {
                validateNome(nomeField);
                validateFormFields(formFields, nextButton);
            });

            var emailField = document.getElementById('emailContato');
            emailField.addEventListener('input', function() {
                validateEmail(emailField);
                validateFormFields(formFields, nextButton);
            });

            // Validações para os campos do colaborador
            var nomeColaboradorField = document.getElementById('nomeColaborador');
            nomeColaboradorField.addEventListener('input', function(e) {
                validateNome(nomeColaboradorField);
                validateFormFields(formFields, nextButton);
            });

            var emailColaboradorField = document.getElementById('emailColaborador');
            emailColaboradorField.addEventListener('input', function() {
                validateEmail(emailColaboradorField);
                validateFormFields(formFields, nextButton);
            });

            var celularColaboradorField = document.getElementById('celularColaborador');
            celularColaboradorField.addEventListener('input', function(e) {
                e.target.value = phoneMask(e.target.value);
                validatePhone(celularColaboradorField);
                validateFormFields(formFields, nextButton);
            });

        } else if (step === 2) {
            // Configurações para o Step de Local

            var estadoField = document.getElementById('estado');
            var cidadeField = document.getElementById('cidade');

            // Preencher os campos com os valores previamente salvos
            var savedEstado = sessionStorage.getItem('estado');
            if (savedEstado) {
                estadoField.value = savedEstado;
                populateCidades(savedEstado, cidadeField);
            }

            var savedCidade = sessionStorage.getItem('cidade');
            if (savedCidade) {
                cidadeField.value = savedCidade;
            }

            // Habilita o botão "Avançar" apenas quando ambos os campos forem selecionados
            function validateLocalFields() {
                var isEstadoSelected = estadoField.value !== '';
                var isCidadeSelected = cidadeField.value !== '';
                nextButton.disabled = !(isEstadoSelected && isCidadeSelected);
            }

            estadoField.addEventListener('change', function() {
                populateCidades(estadoField.value, cidadeField);
                validateLocalFields();
            });

            cidadeField.addEventListener('change', function() {
                validateLocalFields();
            });

            // Verifica se os campos já estão preenchidos ao carregar a página
            validateLocalFields();

        } else if (step === 3) {
            // Configurações para o Step de Seleção de Exames

            var fileInput = document.getElementById('pedidoMedico');
            loadImagesFromSession(); // Chama a função para carregar as imagens salvas

            if (fileInput) {
                fileInput.addEventListener('change', function() {
                    var files = this.files;
                    var currentImages = getImagesFromSession();
                    var currentImagesCount = currentImages.length;
                    var newImagesCount = files.length;

                    if (currentImagesCount + newImagesCount > 10) {
                        alert('Você pode enviar no máximo 10 imagens. Por favor, remova algumas antes de adicionar novas.');
                        return;
                    }

                    Array.from(files).forEach(function(file) {
                        convertFileToBase64(file, function(base64String) {
                            currentImages.push(base64String);
                            updateImagePreview(currentImages);
                            sessionStorage.setItem('pedidoMedico', JSON.stringify(currentImages));
                            validateStep3();
                        });
                    });
                });
            } else {
                console.error("Elemento fileInput não encontrado.");
            }

            var declarationCheckboxes = document.querySelectorAll('.legal-validations input[type="checkbox"]');
            declarationCheckboxes.forEach(function(checkbox) {
                checkbox.addEventListener('change', validateStep3);
            });

            validateStep3(); // Verifica o estado inicial ao carregar o passo 3
        }

        // Carrega os dados salvos
        loadPreviousStepData(step);
    }

    function saveCurrentStepData(step) {
        var form = document.querySelector(`#form-step-${steps[step - 1].label.toLowerCase()}`);
        var data = new FormData(form);
        data.forEach(function(value, key) {
            if (key !== 'pedidoMedico') { // Evita sobrescrever o pedidoMedico com [object File]
                sessionStorage.setItem(key, value);
            }
        });
    }

    function loadPreviousStepData(step) {
        var form = document.querySelector(`#form-step-${steps[step - 1].label.toLowerCase()}`);
        var data = new FormData(form);
        data.forEach(function(_, key) {
            var field = form.querySelector(`[name="${key}"]`);
            if (field) {
                var storedValue = sessionStorage.getItem(key);
                if (field.type === 'radio') {
                    if (field.value === storedValue) {
                        field.checked = true;
                    }
                } else if (field.type === 'checkbox') {
                    field.checked = storedValue !== null && storedValue === 'on';
                } else if (field.type !== 'file') {
                    field.value = storedValue || '';
                }
            }
        });
    }


    function submitAllData() {
        var allData = {};
        
        // Mostra o overlay de loading
        showLoading();
    
        // Coleta todos os dados do sessionStorage
        for (var i = 0; i < sessionStorage.length; i++) {
            var key = sessionStorage.key(i);
            allData[key] = sessionStorage.getItem(key);
        }
        
        // Certifique-se de que 'pedidoMedico' é convertido corretamente de string para array
        var pedidoMedico = JSON.parse(allData['pedidoMedico'] || '[]');
        
        // Mapear os campos pedidoMedico1, pedidoMedico2, etc.
        const formattedData = {
            userEmail: allData['userEmail'] || '',
            nomeCompleto: allData['nomeCompleto'] || '',
            cpf: allData['cpf'] || '',
            dataNascimento: allData['dataNascimento'] || '',
            telefone: allData['telefone'] || '',
            emailContato: allData['emailContato'] || '',
            estado: allData['estado'] || '',
            cidade: allData['cidade'] || '',
            exames: getExamesData(),
            pedidoMedico1: pedidoMedico[0] || '',
            pedidoMedico2: pedidoMedico[1] || '',
            pedidoMedico3: pedidoMedico[2] || '',
            pedidoMedico4: pedidoMedico[3] || '',
            pedidoMedico5: pedidoMedico[4] || '',
            pedidoMedico6: pedidoMedico[5] || '',
            pedidoMedico7: pedidoMedico[6] || '',
            pedidoMedico8: pedidoMedico[7] || '',
            pedidoMedico9: pedidoMedico[8] || '',
            pedidoMedico10: pedidoMedico[9] || '',
            declaracao1: allData['declaracao1'] || '',
            declaracao2: allData['declaracao2'] || '',
            declaracao3: allData['declaracao3'] || '',
            nomeColaborador: allData['nomeColaborador'] || '',
            emailColaborador: allData['emailColaborador'] || '',
            celularColaborador: allData['celularColaborador'] || ''
        };
        
        var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        var url = isLocal ? 'http://localhost:3000/proxy' : 'https://outubrorosa-8a58e5a8f458.herokuapp.com/proxy';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formattedData)
        })
        .then(response => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Formulário enviado com sucesso! Obrigado por participar.');
                showSummaryScreen(formattedData);
                var userEmail = sessionStorage.getItem('userEmail');
                sessionStorage.clear();
                if (userEmail) {
                    sessionStorage.setItem('userEmail', userEmail);
                }
            } else {
                throw new Error(data.message || 'Erro desconhecido');
            }
        })
        .catch((error) => {
            console.error('Erro ao enviar os dados:', error);
            alert('Ocorreu um erro ao enviar o formulário. Tente novamente mais tarde.');
        })
        .finally(() => {
            // Oculta o overlay de loading após o retorno do servidor
            hideLoading();
        });
    }
    
    function showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    function hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    
    
    function showSummaryScreen(data) {
        var stepsContainer = document.getElementById('steps-container');
        stepsContainer.innerHTML = ''; // Limpa o conteúdo anterior
    
        // Filtra os exames para exibir apenas os marcados como "Verdadeiro" e exclui as declarações
        var examesMarcados = Object.keys(data.exames).filter(exame => {
            return data.exames[exame] === "Verdadeiro" && !exame.startsWith("declaracao");
        });
    
        // Cria o conteúdo da tela de resumo
        var summaryContent = `
            <h1>Resumo do Cadastro</h1>
    
            <h2>Dados de quem irá fazer o exame</h2>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Nome Completo:</strong> ${data.nomeCompleto}</p>
            <p><strong>CPF:</strong> ${data.cpf}</p>
            <p><strong>Data de Nascimento:</strong> ${data.dataNascimento}</p>
            <p><strong>Telefone:</strong> ${data.telefone}</p>
            <p><strong>Email de Contato:</strong> ${data.emailContato}</p>
            <p><strong>Estado:</strong> ${data.estado}</p>
            <p><strong>Cidade:</strong> ${data.cidade}</p>
    
            <h2>Exames Selecionados</h2>
            <ul>
                ${examesMarcados.map(exame => `<li>${exame}</li>`).join('')}
            </ul>
    
            <h2>Imagens do Pedido Médico</h2>
            <div class="image-preview">
                ${[data.pedidoMedico1, data.pedidoMedico2, data.pedidoMedico3, data.pedidoMedico4, data.pedidoMedico5, 
                   data.pedidoMedico6, data.pedidoMedico7, data.pedidoMedico8, data.pedidoMedico9, data.pedidoMedico10]
                  .filter(img => img) // Filtra apenas as imagens que existem
                  .map((img, index) => `<img src="${img}" alt="Imagem ${index + 1}" class="summary-image">`).join('')}
            </div>
    
            <h2>Dados do colaborador que fez a indicação</h2>
            <p><strong>Nome:</strong> ${data.nomeColaborador}</p>
            <p><strong>Email:</strong> ${data.emailColaborador}</p>
            <p><strong>Celular:</strong> ${data.celularColaborador}</p>
    
            <button id="newEntryBtn" class="btn-avancar">Quero fazer outra indicação</button>
        `;
    
        stepsContainer.innerHTML = summaryContent;
    
        // Adiciona evento ao botão para recarregar a página
        document.getElementById('newEntryBtn').addEventListener('click', function() {
            location.reload(); // Recarrega a página
        });
    }
    
    
    
    
        


    function getExamesData() {
        var exames = {
            "Colesterol frações": "Falso",
            "Colesterol total": "Falso",
            "FSH": "Falso",
            "Glicemia": "Falso",
            "Hemograma": "Falso",
            "T3": "Falso",
            "T3L": "Falso",
            "T4": "Falso",
            "T4L": "Falso",
            "TSH": "Falso",
            "Mamografia": "Falso",
            "USG Abdome superior": "Falso",
            "USG Abdome total": "Falso",
            "USG Mamas": "Falso",
            "USG Trato urinário ou pelve": "Falso",
            "USG Transvaginal": "Falso",
            "USG Tireóide": "Falso"
        };

        var checkboxes = document.querySelectorAll('#form-step-exames input[type="checkbox"]');
        checkboxes.forEach(function(checkbox) {
            exames[checkbox.name] = checkbox.checked ? "Verdadeiro" : "Falso";
        });

        return exames;
    }

    function validateFormFields(fields, button) {
        var allValid = Array.from(fields).every(function(field) {
            if (field.id === 'telefone' || field.id === 'celularColaborador') {
                return validatePhone(field);
            } else if (field.id === 'cpf') {
                return validateCPF(field);
            } else if (field.id === 'nomeCompleto' || field.id === 'nomeColaborador') {
                return validateNome(field);
            } else if (field.id === 'emailContato' || field.id === 'emailColaborador') {
                return validateEmail(field);
            } else if (field.id === 'estado' || field.id === 'cidade') {
                return field.value !== '';
            }
            return field.checkValidity();
        });
        button.disabled = !allValid;
    }

    function validateCPF(field) {
        var cpf = field.value.replace(/\D/g, '');
        var valid = isValidCPF(cpf);
        displayValidationMessage(field, valid, "CPF inválido.");
        return valid;
    }

    function isValidCPF(cpf) {
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        var sum = 0, rest;
        for (var i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        if (rest !== parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (var j = 1; j <= 10; j++) sum += parseInt(cpf.substring(j - 1, j)) * (12 - j);
        rest = (sum * 10) % 11;
        if (rest === 10 || rest === 11) rest = 0;
        return rest === parseInt(cpf.substring(10, 11));
    }

    function phoneMask(value) {
        return value
            .replace(/\D/g, '') // Remove tudo que não é dígito
            .replace(/^(\d{2})(\d)/, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
            .replace(/(\d{5})(\d)/, '$1-$2'); // Coloca um hífen entre o quinto e o sexto dígitos
    }

    function cpfMask(value) {
        return value
            .replace(/\D/g, '') // Remove tudo que não é dígito
            .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o terceiro e quarto dígitos
            .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto entre o sexto e sétimo dígitos
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Coloca hífen entre o nono e décimo dígitos
    }

    function validatePhone(field) {
        var valid = /^[0-9\s()-]+$/.test(field.value) && field.value.length >= 14;
        displayValidationMessage(field, valid, "Telefone inválido.");
        return valid;
    }

    function validateNome(field) {
        var valid = /^[A-Za-z\s]{3,}$/.test(field.value);
        displayValidationMessage(field, valid, "Nome deve ter pelo menos 3 letras.");
        return valid;
    }

    function validateEmail(field) {
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        displayValidationMessage(field, valid, "Email inválido.");
        return valid;
    }

    function displayValidationMessage(field, isValid, message) {
        var messageElement = field.nextElementSibling;
        if (!isValid) {
            if (!messageElement || !messageElement.classList.contains('validation-message')) {
                messageElement = document.createElement('span');
                messageElement.classList.add('validation-message');
                messageElement.style.color = 'red';
                messageElement.style.fontSize = '12px';
                field.parentNode.insertBefore(messageElement, field.nextSibling);
            }
            messageElement.textContent = message;
        } else {
            if (messageElement && messageElement.classList.contains('validation-message')) {
                messageElement.remove();
            }
        }
    }

    function generateStepContent(stepTitle) {
        if (stepTitle === 'Cadastro') {
            return `
                <h1>Faça o cadastro</h1>
                <form id="form-step-cadastro">
                    <!-- Seção 1 - Informações de quem vai fazer exames -->
                    <div class="form-group">
                        <label>Quem vai fazer exames tem <strong>pedido médico</strong>?</label>
                        <div class="radio-group">
                            <label><input type="radio" name="pedidoMedico" value="sim" required> Sim</label>
                            <label><input type="radio" name="pedidoMedico" value="não" required> Não</label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="nomeCompleto">Conte mais sobre quem vai fazer exames <span style="color: red;">*</span></label>
                        <input type="text" id="nomeCompleto" name="nomeCompleto" placeholder="Nome completo" required>
                    </div>

                    <div class="form-group">
                        <label for="cpf">CPF de quem vai fazer o exame <span style="color: red;">*</span></label>
                        <input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" required>
                    </div>

                    <div class="form-group">
                        <label for="dataNascimento">Data de nascimento de quem vai fazer o exame <span style="color: red;">*</span></label>
                        <input type="date" id="dataNascimento" name="dataNascimento" required>
                    </div>

                    <div class="form-group">
                        <label for="telefone">Telefone de quem vai fazer o exame <span style="color: red;">*</span></label>
                        <input type="tel" id="telefone" name="telefone" placeholder="(DDD) 99999-9999" required>
                    </div>

                    <div class="form-group">
                        <label for="emailContato">E-mail de quem vai fazer o exame <span style="color: red;">*</span></label>
                        <input type="email" id="emailContato" name="emailContato" placeholder="nome@exemplo.com" required>
                    </div>

                    <!-- Efeito visual de quebra -->
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ccc;">

                    <!-- Seção 2 - Informações do colaborador que está indicando -->
                    <div class="form-group">
                        <label for="nomeColaborador">Nome completo do colaborador</label>
                        <input type="text" id="nomeColaborador" name="nomeColaborador" placeholder="Nome completo">
                    </div>

                    <div class="form-group">
                        <label for="emailColaborador">E-mail do colaborador</label>
                        <input type="email" id="emailColaborador" name="emailColaborador" placeholder="nome@exemplo.com">
                    </div>

                    <div class="form-group">
                        <label for="celularColaborador">Celular do colaborador</label>
                        <input type="tel" id="celularColaborador" name="celularColaborador" placeholder="(DDD) 99999-9999">
                    </div>
                </form>
            `;
        } else if (stepTitle === 'Local') {
            return `
                <h1>Selecione o Local</h1>
                <form id="form-step-local">
                    <div class="form-group">
                        <label for="estado">Selecione o Estado <span style="color: red;">*</span></label>
                        <select id="estado" name="estado" class="input-dropdown" required>
                            <option value="">Selecione o estado</option>
                            <option value="AC">Acre</option>
                            <option value="AL">Alagoas</option>
                            <option value="AP">Amapá</option>
                            <option value="AM">Amazonas</option>
                            <option value="BA">Bahia</option>
                            <option value="CE">Ceará</option>
                            <option value="DF">Distrito Federal</option>
                            <option value="ES">Espírito Santo</option>
                            <option value="GO">Goiás</option>
                            <option value="MA">Maranhão</option>
                            <option value="MT">Mato Grosso</option>
                            <option value="MS">Mato Grosso do Sul</option>
                            <option value="MG">Minas Gerais</option>
                            <option value="PA">Pará</option>
                            <option value="PB">Paraíba</option>
                            <option value="PR">Paraná</option>
                            <option value="PE">Pernambuco</option>
                            <option value="PI">Piauí</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="RN">Rio Grande do Norte</option>
                            <option value="RS">Rio Grande do Sul</option>
                            <option value="RO">Rondônia</option>
                            <option value="RR">Roraima</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="SP">São Paulo</option>
                            <option value="SE">Sergipe</option>
                            <option value="TO">Tocantins</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="cidade">Selecione a Cidade <span style="color: red;">*</span></label>
                        <select id="cidade" name="cidade" class="input-dropdown" required>
                            <option value="">Selecione a cidade</option>
                            <!-- Cidades serão populadas dinamicamente -->
                        </select>
                    </div>
                </form>
            `;
        } else if (stepTitle === 'Exames') {
            return `
                <h1>Escolher exames</h1>
                <p>Confira o pedido médico e selecione os exames</p>
                <form id="form-step-exames">
                    <fieldset>
                        <legend>Análises clínicas:</legend>
                        <div>
                            <input type="checkbox" id="exame1" name="Colesterol frações" value="Colesterol frações">
                            <label for="exame1">Colesterol frações (LDL, VLDL, HDL)</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame2" name="Colesterol total" value="Colesterol total">
                            <label for="exame2">Colesterol total</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame3" name="FSH" value="FSH">
                            <label for="exame3">FSH</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame4" name="Glicemia" value="Glicemia">
                            <label for="exame4">Glicemia</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame5" name="Hemograma" value="Hemograma">
                            <label for="exame5">Hemograma</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame6" name="T3" value="T3">
                            <label for="exame6">T3</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame7" name="T3L" value="T3L">
                            <label for="exame7">T3L</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame8" name="T4" value="T4">
                            <label for="exame8">T4</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame9" name="T4L" value="T4L">
                            <label for="exame9">T4L</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame10" name="TSH" value="TSH">
                            <label for="exame10">TSH</label>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                        <legend>Exames de imagem:</legend>
                        <div>
                            <input type="checkbox" id="exame11" name="Mamografia" value="Mamografia">
                            <label for="exame11">Mamografia</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame12" name="USG Abdome superior" value="USG Abdome superior">
                            <label for="exame12">USG Abdome superior</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame13" name="USG Abdome total" value="USG Abdome total">
                            <label for="exame13">USG Abdome total</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame14" name="USG Mamas" value="USG Mamas">
                            <label for="exame14">USG Mamas</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame15" name="USG Trato urinário ou pelve" value="USG Trato urinário ou pelve">
                            <label for="exame15">USG Trato urinário ou pelve</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame16" name="USG Transvaginal" value="USG Transvaginal">
                            <label for="exame16">USG Transvaginal</label>
                        </div>
                        <div>
                            <input type="checkbox" id="exame17" name="USG Tireóide" value="USG Tireóide">
                            <label for="exame17">USG Tireóide</label>
                        </div>
                    </fieldset>

                    <!-- Bloco de upload de imagem -->
                    <fieldset class="upload-container">
                        <legend>Pedido médico</legend>
                        <div class="form-group">
                            <label for="pedidoMedico">Envie o pedido médico (PNG, JPG, PDF)</label>
                            <input type="file" id="pedidoMedico" name="pedidoMedico[]" accept=".png, .jpg, .jpeg, .pdf" multiple>
                            <small>Formatos aceitos: PNG, JPG, PDF.</small>
                        </div>
                        <div id="image-preview" class="image-preview"></div>
                    </fieldset>

                    <!-- Validações legais -->
                    <fieldset class="legal-validations">
                        <legend>Declarações</legend>
                        <div>
                            <input type="checkbox" id="declaracao1" name="declaracao1" required>
                            <label for="declaracao1">Você declara que a pessoa que vai fazer o exame não possui nenhum tipo de cobertura ou assistência por planos de saúde e não faz uso de clínicas particulares para consultas e exames.</label>
                        </div>
                        <div>
                            <input type="checkbox" id="declaracao2" name="declaracao2" required>
                            <label for="declaracao2">Você declara que a pessoa que vai fazer os exames não possui nenhum tipo de cobertura ou assistência por planos de saúde e não faz uso de clínicas particulares para consultas e exames.</label>
                        </div>
                        <div>
                            <input type="checkbox" id="declaracao3" name="declaracao3" required>
                            <label for="declaracao3">Declaro que a pessoa indicada a fazer o exame necessita do Domingo Rosa para ter acesso aos exames.</label>
                        </div>
                    </fieldset>
                </form>
            `;
        }
        return `
            <h1>${stepTitle}</h1>
            <form id="form-step-${stepTitle.toLowerCase()}">
                <!-- Estrutura para outros steps -->
            </form>
        `;
    }

    function populateCidades(estado, cidadeField) {
        var cidadesPorEstado = {
            AC: ['Rio Branco'],
            AL: ['Maceió', 'Arapiraca'],
            AP: ['Macapá'],
            AM: ['Manaus', 'Parintins'],
            BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
            CE: ['Fortaleza', 'Juazeiro do Norte', 'Sobral'],
            DF: ['Brasília'],
            ES: ['Vitória', 'Vila Velha', 'Serra'],
            GO: ['Goiânia', 'Anápolis', 'Aparecida de Goiânia'],
            MA: ['São Luís', 'Imperatriz', 'Caxias'],
            MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
            MS: ['Campo Grande', 'Dourados', 'Três Lagoas'],
            MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
            PA: ['Belém', 'Santarém', 'Ananindeua'],
            PB: ['João Pessoa', 'Campina Grande', 'Patos'],
            PR: ['Curitiba', 'Londrina', 'Maringá'],
            PE: ['Recife', 'Olinda', 'Caruaru'],
            PI: ['Teresina', 'Parnaíba', 'Picos'],
            RJ: ['Rio de Janeiro', 'Niterói', 'Petrópolis'],
            RN: ['Natal', 'Mossoró', 'Parnamirim'],
            RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
            RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes'],
            RR: ['Boa Vista'],
            SC: ['Florianópolis', 'Joinville', 'Blumenau'],
            SP: ['São Paulo', 'Campinas', 'Santos'],
            SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto'],
            TO: ['Palmas', 'Araguaína', 'Gurupi']
        };

        cidadeField.innerHTML = '<option value="">Selecione a cidade</option>'; // Reseta as opções

        if (estado && cidadesPorEstado[estado]) {
            cidadesPorEstado[estado].forEach(function(cidade) {
                var option = document.createElement('option');
                option.value = cidade;
                option.textContent = cidade;
                cidadeField.appendChild(option);
            });

            // Selecionar a cidade previamente escolhida se disponível
            var selectedCidade = sessionStorage.getItem('cidade');
            if (selectedCidade) {
                cidadeField.value = selectedCidade;
            }
        }
    }

    function convertFileToBase64(file, callback) {
        var reader = new FileReader();
        reader.onloadend = function() {
            callback(reader.result);
        };
        reader.readAsDataURL(file);
    }

    function getImagesFromSession() {
        var storedImages = sessionStorage.getItem('pedidoMedico');
        return storedImages ? JSON.parse(storedImages) : [];
    }

    function updateImagePreview(images) {
        var imagePreview = document.getElementById('image-preview');
        imagePreview.innerHTML = '';

        images.forEach(function(base64String, index) {
            var imgContainer = document.createElement('div');
            imgContainer.classList.add('image-container');

            var img = document.createElement('img');
            img.src = base64String;
            img.alt = `Imagem ${index + 1}`;

            var removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remover';
            removeBtn.classList.add('remove-btn');

            removeBtn.addEventListener('click', function() {
                images.splice(index, 1);
                updateImagePreview(images);
                sessionStorage.setItem('pedidoMedico', JSON.stringify(images));
                validateStep3();
            });

            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            imagePreview.appendChild(imgContainer);
        });

        updateImageCount();
    }

    function updateImageCount() {
        var currentImagesCount = getImagesFromSession().length;
        var fileInput = document.getElementById('pedidoMedico');
        fileInput.disabled = currentImagesCount >= 10;
    }

    function loadImagesFromSession() {
        var storedImages = getImagesFromSession();
        if (storedImages.length > 0) {
            updateImagePreview(storedImages);
        }
    }

    function validateStep3() {
        var checkboxes = document.querySelectorAll('#form-step-exames input[type="checkbox"]');
        var fileInput = document.getElementById('pedidoMedico');
        var declarations = document.querySelectorAll('.legal-validations input[type="checkbox"]');
        var allChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
        var fileUploaded = getImagesFromSession().length > 0;
        var allDeclarationsChecked = Array.from(declarations).every(declaration => declaration.checked);

        var valid = true;

        if (!allChecked) {
            displayValidationMessage(document.getElementById('form-step-exames'), false, "Selecione pelo menos um exame.");
            valid = false;
        } else {
            removeValidationMessage(document.getElementById('form-step-exames'));
        }

        if (!fileUploaded) {
            displayValidationMessage(fileInput, false, "Por favor, envie o pedido médico.");
            valid = false;
        } else {
            removeValidationMessage(fileInput);
        }

        if (!allDeclarationsChecked) {
            displayValidationMessage(document.querySelector('.legal-validations'), false, "Você deve aceitar todas as declarações.");
            valid = false;
        } else {
            removeValidationMessage(document.querySelector('.legal-validations'));
        }

        nextButton.disabled = !valid;
        return valid;
    }

    function removeValidationMessage(field) {
        var messageElement = field.nextElementSibling;
        if (messageElement && messageElement.classList.contains('validation-message')) {
            messageElement.remove();
        }
    }
}
