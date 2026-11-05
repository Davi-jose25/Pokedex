/* =========================================================
   MINHA POKÉDEX — script.js
   Sistemas: dark mode, título interativo, busca, card flip,
   Pokédex (checkbox + carrinho + lista) e slideshow de destaque.
   ========================================================= */


/* =========================================================
   1) DADOS DO SLIDESHOW  <- EDITE AQUI
   Pra adicionar uma foto nova: copie a imagem para src/assets
   e acrescente uma linha na lista (mesmo jeito do site de jogos).
   Se o arquivo ainda não existir, aparece um espaço vago
   avisando o nome que você precisa colocar na pasta.
   ========================================================= */
const TEMPO = 3500; // tempo entre as trocas (em milissegundos)

const destaques = [
  { nome: 'Eevee',     tipo: 'Normal',        hp: '055', src: '../src/assets/eevee_art.png' },
  { nome: 'Pikachu',   tipo: 'Elétrico',      hp: '060', src: '../src/assets/pikachu.png'   },
  { nome: 'Charizard', tipo: 'Fogo/voador',   hp: '100', src: '../src/assets/charizard.png' },
  { nome: 'Gengar',    tipo: 'Fantasma',      hp: '110', src: '../src/assets/gengar.png'    },
  { nome: 'Greninja',  tipo: 'Água/Sombrio',  hp: '080', src: '../src/assets/greninja.png'  },
  { nome: 'Blaziken',  tipo: 'Fogo/Lutador',  hp: '080', src: '../src/assets/blaziken.png'  },
  // ---- vagas para as imagens novas (adicione os arquivos na pasta) ----
  { nome: 'Mewtwo',    tipo: 'Psíquico',      hp: '150', src: '../src/assets/mewtwo.png'    },
  { nome: 'Lucario',   tipo: 'Lutador/Aço',   hp: '090', src: '../src/assets/lucario.png'   },
  { nome: 'Snorlax',   tipo: 'Normal',        hp: '160', src: '../src/assets/snorlax.png'   },
  { nome: 'Bulbasaur', tipo: 'Planta/Veneno', hp: '045', src: '../src/assets/bulbasaur.png' },
];


/* =========================================================
   2) ATALHOS E ARMAZENAMENTO
   ========================================================= */
const $  = (seletor, base = document) => base.querySelector(seletor);
const $$ = (seletor, base = document) => [...base.querySelectorAll(seletor)];

// localStorage com try/catch (se o navegador bloquear, o site continua funcionando)
const guardar = {
  ler(chave, padrao) {
    try {
      const valor = localStorage.getItem(chave);
      return valor === null ? padrao : JSON.parse(valor);
    } catch {
      return padrao;
    }
  },
  salvar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
  },
  apagar(chave) {
    try { localStorage.removeItem(chave); } catch { /* sem armazenamento */ }
  },
};

// tira acentos e deixa minúsculo (pra "eletrico" achar "Elétrico")
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// vira true depois da primeira montagem da Pokédex (seção 8)
let pokedexPronta = false;

// reinicia uma animação CSS
function animar(elemento, classe) {
  elemento.classList.remove(classe);
  void elemento.offsetWidth; // força o navegador a "esquecer" a animação anterior
  elemento.classList.add(classe);
}


/* =========================================================
   3) IMAGEM VAGA
   Se a imagem de um card não carregar, troca por um espaço
   com o nome do arquivo que falta.
   ========================================================= */
function nomeDoArquivo(src) {
  return (src || '').split('/').pop();
}

function trocarPorEspacoVago(img) {
  const vazio = document.createElement('div');
  vazio.className = 'img-slot img-vazia';
  const texto = document.createElement('span');
  texto.textContent = 'Adicione ' + nomeDoArquivo(img.getAttribute('src'));
  vazio.appendChild(texto);
  img.replaceWith(vazio);
  if (pokedexPronta) atualizarPokedex(); // as miniaturas da lista dependem dessas imagens
}

$$('.flip-card-front img.img-slot').forEach((img) => {
  img.addEventListener('error', () => trocarPorEspacoVago(img));
  // se o erro aconteceu antes do script carregar
  if (img.complete && img.naturalWidth === 0) trocarPorEspacoVago(img);
});


/* =========================================================
   4) DARK MODE
   ========================================================= */
const btnTema = $('#btn-tema');

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  btnTema.textContent = tema === 'escuro' ? '☀' : '☾';
  btnTema.setAttribute('aria-label', tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro');
}

const temaSalvo = guardar.ler('pokedex-tema', null);
const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
aplicarTema(temaSalvo ?? (prefereEscuro ? 'escuro' : 'claro'));

btnTema.addEventListener('click', () => {
  const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  aplicarTema(novo);
  guardar.salvar('pokedex-tema', novo);
});


/* =========================================================
   5) TÍTULO INTERATIVO
   ========================================================= */
const TITULO_PADRAO = 'Minha coleção';
const ABA_PADRAO = document.title; // "Meu Pokédex"

const titulo = $('#titulo-principal');
const btnPersonalizar = $('#btn-personalizar');
const painelTitulo = $('#painel-titulo');
const formTitulo = $('#form-titulo');
const campoTitulo = $('#campo-titulo');
const msgTitulo = $('#msg-titulo');

function definirTitulo(texto) {
  titulo.textContent = texto;
  document.title = texto === TITULO_PADRAO ? ABA_PADRAO : texto;
  animar(titulo, 'animar');
}

// abre e fecha o painel
function alternarPainel(abrir) {
  painelTitulo.classList.toggle('aberto', abrir);
  painelTitulo.inert = !abrir; // quando fechado, o teclado não entra nele
  btnPersonalizar.setAttribute('aria-expanded', String(abrir));
  btnPersonalizar.textContent = abrir ? 'Fechar personalização' : 'Personalizar título';
  if (abrir) campoTitulo.focus();
}
btnPersonalizar.addEventListener('click', () => {
  alternarPainel(!painelTitulo.classList.contains('aberto'));
});

// atualizar título
formTitulo.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const novo = campoTitulo.value.trim();

  if (novo === '') {
    msgTitulo.textContent = 'Digite um título antes de atualizar.';
    campoTitulo.focus();
    return;
  }

  definirTitulo(novo);
  guardar.salvar('pokedex-titulo', novo);
  msgTitulo.textContent = `Título atualizado para "${novo}".`;
});

// restaurar padrão
$('#btn-restaurar').addEventListener('click', () => {
  definirTitulo(TITULO_PADRAO);
  guardar.apagar('pokedex-titulo');
  campoTitulo.value = '';
  msgTitulo.textContent = 'Título restaurado.';
});

// clicar no título expande as letras (no celular não existe hover)
titulo.addEventListener('click', () => titulo.classList.toggle('expandir'));

// título salvo na última visita
const tituloSalvo = guardar.ler('pokedex-titulo', null);
if (tituloSalvo) {
  titulo.textContent = tituloSalvo;
  document.title = tituloSalvo;
  campoTitulo.value = tituloSalvo;
}


/* =========================================================
   6) BUSCA
   ========================================================= */
const cards = $$('.pokemon');
const formBusca = $('#busca');
const campoBusca = $('#campo-busca');
const resultadoBusca = $('#resultado-busca');

function filtrar() {
  const termo = normalizar(campoBusca.value);
  let encontrados = 0;

  cards.forEach((card) => {
    const texto = normalizar(card.dataset.nome + ' ' + card.dataset.tipo);
    const mostra = texto.includes(termo);
    card.hidden = !mostra;
    if (mostra) encontrados++;
  });

  const digitado = campoBusca.value.trim();
  if (termo === '') {
    resultadoBusca.textContent = '';
  } else if (encontrados === 0) {
    resultadoBusca.textContent = `Nenhum pokémon encontrado para "${digitado}".`;
  } else {
    resultadoBusca.textContent =
      `${encontrados} ${encontrados === 1 ? 'pokémon encontrado' : 'pokémon encontrados'} para "${digitado}".`;
  }
}

campoBusca.addEventListener('input', filtrar);
formBusca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  filtrar();
  $('#cards').scrollIntoView({ behavior: 'smooth' });
});
campoBusca.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    campoBusca.value = '';
    filtrar();
  }
});


/* =========================================================
   7) CARD FLIP (botões)
   ========================================================= */
function virar(card, virado) {
  const flip = $('.flip-card', card);
  const botao = $('.btn-virar', card);
  const novoEstado = virado ?? !flip.classList.contains('virado');
  flip.classList.toggle('virado', novoEstado);
  botao.textContent = novoEstado ? 'Ver frente' : 'Virar card';
}

cards.forEach((card) => {
  $('.btn-virar', card).addEventListener('click', () => virar(card));
});

const btnVirarTodos = $('#btn-virar-todos');
let todosVirados = false;
btnVirarTodos.addEventListener('click', () => {
  todosVirados = !todosVirados;
  cards.forEach((card) => virar(card, todosVirados));
  btnVirarTodos.textContent = todosVirados ? 'Desvirar todos' : 'Virar todos';
});


/* =========================================================
   8) POKÉDEX (checkbox + carrinho + lista de obtidos)
   Só guardamos os ids. O resto é lido direto dos cards,
   então um card novo no HTML já funciona sozinho.
   ========================================================= */
const cardPorId = new Map(cards.map((card) => [card.dataset.id, card]));
const idsSalvos = guardar.ler('pokedex-obtidos', []);
const pokedex = new Set(idsSalvos.filter((id) => cardPorId.has(id)));

const contador = $('#contador-pokedex');
const listaObtidos = $('#lista-obtidos');
const listaGaveta = $('#lista-gaveta');
const vazioObtidos = $('#vazio-obtidos');
const vazioGaveta = $('#vazio-gaveta');
const progressoTexto = $('#progresso-texto');
const barra = $('.barra');
const barraPreenchida = $('#barra-preenchida');
const gavetaResumo = $('#gaveta-resumo');
const btnEsvaziar = $('#btn-esvaziar');
const btnEsvaziarGaveta = $('#btn-esvaziar-gaveta');

// monta a lista (usada na seção da página e na gaveta)
function desenharLista(ul) {
  ul.replaceChildren();

  pokedex.forEach((id) => {
    const card = cardPorId.get(id);
    const nome = card.dataset.nome;
    const imagem = $('img.img-slot', card);

    const li = document.createElement('li');

    // miniatura (ou uma pokébola se a imagem ainda não existe)
    let mini;
    if (imagem) {
      mini = document.createElement('img');
      mini.className = 'mini';
      mini.src = imagem.getAttribute('src');
      mini.alt = '';
    } else {
      mini = document.createElement('div');
      mini.className = 'mini mini-vazia';
      const bola = document.createElement('div');
      bola.className = 'ball';
      mini.appendChild(bola);
    }

    const info = document.createElement('div');
    info.className = 'info-obtido';
    const strong = document.createElement('strong');
    strong.textContent = nome;
    const small = document.createElement('small');
    small.textContent = card.dataset.tipo;
    info.append(strong, small);

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'remover';
    remover.textContent = '✕';
    remover.setAttribute('aria-label', `Remover ${nome} da Pokédex`);
    remover.addEventListener('click', () => {
      pokedex.delete(id);
      atualizarPokedex();
    });

    li.append(mini, info, remover);
    ul.appendChild(li);
  });
}

function atualizarPokedex() {
  const total = cards.length;
  const qtd = pokedex.size;

  // contador do topo
  contador.textContent = qtd;

  // checkboxes e destaque dos cards
  cards.forEach((card) => {
    const marcado = pokedex.has(card.dataset.id);
    $('.check-input', card).checked = marcado;
    $('.check-texto', card).textContent = marcado ? 'Na sua Pokédex' : 'Adicionar à Pokédex';
    card.classList.toggle('capturado', marcado);
  });

  // progresso
  progressoTexto.textContent = `${qtd} de ${total} na sua Pokédex.`;
  gavetaResumo.textContent = `${qtd} de ${total} pokémon capturados.`;
  barra.setAttribute('aria-valuemax', total);
  barra.setAttribute('aria-valuenow', qtd);
  barraPreenchida.style.width = total ? `${(qtd / total) * 100}%` : '0%';

  // listas
  desenharLista(listaObtidos);
  desenharLista(listaGaveta);
  vazioObtidos.hidden = qtd > 0;
  vazioGaveta.hidden = qtd > 0;
  btnEsvaziar.disabled = qtd === 0;
  btnEsvaziarGaveta.disabled = qtd === 0;

  guardar.salvar('pokedex-obtidos', [...pokedex]);
}

// marcar / desmarcar pelo checkbox
cards.forEach((card) => {
  $('.check-input', card).addEventListener('change', (evento) => {
    const id = card.dataset.id;
    if (evento.target.checked) {
      pokedex.add(id);
      animar(contador, 'pulo');
    } else {
      pokedex.delete(id);
    }
    atualizarPokedex();
  });
});

// esvaziar (pede confirmação, igual ao carrinho do site de livros)
function esvaziarPokedex() {
  if (pokedex.size === 0) return;
  const confirmou = confirm(`Você tem ${pokedex.size} pokémon na Pokédex. Deseja esvaziar?`);
  if (confirmou) {
    pokedex.clear();
    atualizarPokedex();
  }
}
btnEsvaziar.addEventListener('click', esvaziarPokedex);
btnEsvaziarGaveta.addEventListener('click', esvaziarPokedex);

atualizarPokedex();
pokedexPronta = true;


/* =========================================================
   9) GAVETA DO CARRINHO
   ========================================================= */
const gaveta = $('#gaveta');
const fundoGaveta = $('#fundo-gaveta');
const btnPokedex = $('#btn-pokedex');
const btnFechar = $('#fechar-gaveta');

function abrirGaveta() {
  fundoGaveta.hidden = false;
  gaveta.inert = false;
  gaveta.setAttribute('aria-hidden', 'false');
  gaveta.classList.add('aberta');
  btnFechar.focus();
}

function fecharGaveta(devolverFoco = true) {
  gaveta.classList.remove('aberta');
  gaveta.inert = true;
  gaveta.setAttribute('aria-hidden', 'true');
  fundoGaveta.hidden = true;
  if (devolverFoco) btnPokedex.focus();
}

btnPokedex.addEventListener('click', abrirGaveta);
btnFechar.addEventListener('click', () => fecharGaveta());
fundoGaveta.addEventListener('click', () => fecharGaveta());
$('#ver-lista').addEventListener('click', () => fecharGaveta(false));

document.addEventListener('keydown', (evento) => {
  if (!gaveta.classList.contains('aberta')) return;

  if (evento.key === 'Escape') {
    fecharGaveta();
    return;
  }

  // mantém o Tab dentro da gaveta enquanto ela está aberta
  if (evento.key === 'Tab') {
    const focaveis = $$('button:not(:disabled), a[href]', gaveta);
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }
});


/* =========================================================
   10) SLIDESHOW DE DESTAQUE (card que troca a foto)
   Mesma ideia do site de jogos: um índice, uma função que
   troca a imagem e um setTimeout que chama ela de novo.
   ========================================================= */
const imgDestaque = $('#imgDestaque');
const vazioDestaque = $('#destaque-vazio');
const vazioDestaqueTexto = $('#destaque-vazio-texto');
const nomeDestaque = $('#destaque-nome');
const hpDestaque = $('#destaque-hp');
const tipoDestaque = $('#destaque-tipo');
const caixaDestaque = $('.destaque-box');
const pontos = $('#destaque-pontos');
const btnPausa = $('#destaque-pausa');

let indice = 0;
let temporizador = null;
let pausado = false;      // botão Pausar
let seguraMouse = false;  // mouse ou foco em cima do slideshow

// cria as bolinhas
destaques.forEach((d, i) => {
  const ponto = document.createElement('button');
  ponto.type = 'button';
  ponto.className = 'ponto';
  ponto.setAttribute('aria-label', `Ir para ${d.nome}`);
  ponto.addEventListener('click', () => mostrarDestaque(i));
  pontos.appendChild(ponto);
});

function agendarProximo() {
  clearTimeout(temporizador);
  if (!pausado && !seguraMouse) {
    temporizador = setTimeout(() => mostrarDestaque(indice + 1), TEMPO);
  }
}

function mostrarDestaque(novoIndice) {
  indice = (novoIndice + destaques.length) % destaques.length;
  const d = destaques[indice];

  nomeDestaque.textContent = d.nome;
  hpDestaque.textContent = 'HP ' + d.hp;
  tipoDestaque.textContent = d.tipo;

  vazioDestaque.hidden = true;
  imgDestaque.hidden = false;
  imgDestaque.alt = d.nome;
  imgDestaque.src = d.src;
  animar(imgDestaque, 'trocando');

  $$('.ponto', pontos).forEach((ponto, i) => {
    ponto.setAttribute('aria-current', i === indice ? 'true' : 'false');
  });

  agendarProximo();
}

// imagem que ainda não existe -> espaço vago
imgDestaque.addEventListener('error', () => {
  imgDestaque.hidden = true;
  vazioDestaqueTexto.textContent = 'Adicione ' + nomeDoArquivo(destaques[indice].src);
  vazioDestaque.hidden = false;
});

$('#destaque-anterior').addEventListener('click', () => mostrarDestaque(indice - 1));
$('#destaque-proximo').addEventListener('click', () => mostrarDestaque(indice + 1));

btnPausa.addEventListener('click', () => {
  pausado = !pausado;
  btnPausa.textContent = pausado ? 'Continuar' : 'Pausar';
  agendarProximo();
});

// pausa enquanto o mouse ou o teclado estão no slideshow
caixaDestaque.addEventListener('mouseenter', () => { seguraMouse = true; agendarProximo(); });
caixaDestaque.addEventListener('mouseleave', () => { seguraMouse = false; agendarProximo(); });
caixaDestaque.addEventListener('focusin',    () => { seguraMouse = true; agendarProximo(); });
caixaDestaque.addEventListener('focusout',   () => { seguraMouse = false; agendarProximo(); });

// EXECUTANDO A FUNÇÃO
mostrarDestaque(0);