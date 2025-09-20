// 📁 mathMode/modules/numaEssentialOps.js
//
// Este archivo define el módulo principal "NUMA" encargado de la
// configuración y orquestación de ejercicios aritméticos y de Poker
// Numbs.  Se construye la interfaz de usuario con botones para
// seleccionar operaciones básicas, modos de presentación, niveles de
// dificultad de Poker Numbs y rangos personalizables mediante
// spinners.  Al pulsar el botón «Comenzar» se calcula la lista
// combinada de ejercicios (NUMA + Poker Numbs) y se inicia la sesión
// mediante `runSession`, separada en otro módulo.

import { createSpinner } from './numaSpinners.js';
import { generateCombinedExpressions } from './numaEssentialOps2.js';
import { runSession } from './numaEssentialOps3.js';

// -----------------------------------------------------------------------------
// Datos predefinidos para Poker Numbs.  Los niveles 1–4 corresponden a
// dificultades Basic, Med, High y Advance.  Cada nivel agrupa
// expresiones categorizadas por operación.  Estas expresiones se
// importan sin el signo igual al combinarlas en generatePokerExpressions.
export const pokerOps = {
  1: {
    '×': ['2×2=4','2×3=6','2×4=8','2×5=10','3×2=6','3×3=9','4×3=12','5×2=10','5×3=15','5×4=20','6×2=12','6×3=18','10×10=100'],
    '+': ['1.5+1.5=3','2+2.5=4.5','2.5+2.5=5','3+3=6','5+5=10','6+6=12','10+15=25','25+25=50'],
    '-': ['10-2.5=7.5','15-5=10','25-15=10','50-25=25'],
    '÷': ['2÷2=1','4÷2=2','6÷2=3','10÷2=5','10÷5=2','20÷4=5','60÷10=6','100÷10=10']
  },
  2: {
    '×': ['2×1.5=3','2×2.5=5','3×1.5=4.5','3×2.5=7.5','4×2.5=10','4×3.5=14','5×2=10','6×1.5=9','7.5×2=15','10×1.5=15','1.25×4=5','1.25×8=10','1.5×10=15'],
    '+': ['1+1.5=2.5','2.5+1.5=4','2.5+3=5.5','3.5+1.5=5','4.5+1.5=6','4.5+4.5=9','7.5+7.5=15'],
    '-': ['7.5-2.5=5','10-1.5=8.5','20-7.5=12.5','25-7.5=17.5','30-7.5=22.5','50-15=35'],
    '÷': ['1÷2=0.5','1÷4=0.25','1÷5=0.2','2÷1.5=1.33','3÷1.25=2.4','3÷4=0.75','4÷4=1','5÷1.5=3.33','5÷5=1','6÷3=2']
  },
  3: {
    '×': ['2.5×2=5','2.5×3=7.5','2.5×4=10','2.5×6=15','2.5×10=25','3.5×2=7','3.5×3=10.5','3.5×4=14','4.5×2=9','4.5×3=13.5','4.5×4=18'],
    '+': ['3+4.5=7.5','12.5+25=37.5','25+50=75','75+75=150'],
    '-': ['10-1.25=8.75','10-1.75=8.25','25-12.5=12.5','30-12.5=17.5','100-75=25'],
    '÷': ['1÷3=0.33','1÷1.25=0.8','1÷1.75=0.57','1÷2.25=0.44','2÷1.75=1.14','2.5÷1.25=2','3.5÷1.25=2.8','4.5÷1.5=3','7.5÷2.5=3','10÷3=3.33','15÷2.5=6','27÷18.5=1.46']
  },
  4: {
    '×': ['1.25×6=7.5','1.25×12=15','1.5×12=18','1.5×15=22.5','1.5×20=30','1.75×4=7','1.75×6=10.5','1.75×8=14','1.75×10=17.5','2.25×4=9','2.25×6=13.5','2.25×10=22.5','2.75×6=16.5','2.75×10=27.5'],
    '+': ['7.5+10=17.5','15+15=30'],
    '-': ['100-37.5=62.5'],
    '÷': ['3÷7=0.43','4÷1.75=2.29','5÷6=0.83','6÷2.5=2.4','9÷4.5=2','10÷2.5=4','15÷1.5=10','20÷5=4','25÷5.5=4.54','30÷6=5','30÷7.5=4','35÷8.5=4.11','40÷9.5=4.21','45÷12.5=3.6','70÷10=7','75÷7.5=10','80÷10=8','100÷8=12.5']
  }
};

// Variables de estado globales para la interfaz.  Se inicializan en
// `init` y se reutilizan en las funciones internas.
let leftCol;             // contenedor de operaciones (suma, resta, multiplicación, división)
let scroll;              // contenedor de números (1–100)
let speedButtons = [];   // botones de velocidad del modo Fugues
let randomBtn;           // botón Random
let surgesBtn;           // botón Surges
let mirrorBtn;           // botón Mirror
let fuguesBtn;           // botón Fugues
let runBtn;              // botón Comenzar
let statsEl;             // elemento donde se escriben las estadísticas
let btnRow;              // fila de botones (contiene runBtn)
let selectedPokerLevels = new Set(); // conjunto de niveles seleccionados (1–4)

// --- Estado para Pot Odds ---------------------------------------------------
let potOddsData = null;               // cache de preguntas cargadas desde JSON
let potOddsDataPromise = null;        // promesa para evitar múltiples fetch
const selectedPotOddsOuts = new Set();// outs activos (1..20)
const selectedPotOddsDomains = new Set(); // dominios activos (raw_percent/raw_odds)
const selectedPotOddsStreets = new Set(); // calles seleccionadas
let potOddsConversionActive = false;  // flag para conversiones
const potOddsDomainButtons = [];      // referencias a botones N % / N : N
const potOddsStreetButtons = [];      // referencias a botones de calle
let potOddsConversionButton = null;   // botón de conversiones

// Velocidades disponibles para el modo Fugues (para referencia)
const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};
let currentSpeed = '1H';

// -----------------------------------------------------------------------------
// Carga y filtrado de preguntas de Pot Odds

function loadPotOddsData() {
  if (!potOddsDataPromise) {
    potOddsDataPromise = fetch('./potOddsPreguntas.json')
      .then(resp => resp.json())
      .then(data => {
        potOddsData = Array.isArray(data?.potOddsOps) ? data.potOddsOps : [];
      })
      .catch(() => {
        potOddsData = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return potOddsDataPromise;
}

function setButtonDisabled(btn, disabled) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.classList.toggle('disabled', disabled);
  if (disabled) {
    btn.classList.remove('active');
  }
}

function clearPotOddsSelections() {
  if (selectedPotOddsDomains.size === 0 && !potOddsConversionActive && selectedPotOddsStreets.size === 0) return;
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.forEach(btn => btn.classList.remove('active'));
  potOddsStreetButtons.forEach(btn => btn.classList.remove('active'));
  if (potOddsConversionButton) potOddsConversionButton.classList.remove('active');
}

function updatePotOddsGating() {
  const hasOuts = selectedPotOddsOuts.size > 0;
  potOddsDomainButtons.forEach(btn => {
    setButtonDisabled(btn, !hasOuts);
    if (!hasOuts) selectedPotOddsDomains.delete(btn.dataset.domain);
  });

  const hasDomain = selectedPotOddsDomains.size > 0;
  potOddsStreetButtons.forEach(btn => {
    setButtonDisabled(btn, !hasDomain);
    if (!hasDomain) selectedPotOddsStreets.delete(btn.dataset.street);
  });
  if (potOddsConversionButton) {
    setButtonDisabled(potOddsConversionButton, !hasDomain);
    if (!hasDomain) potOddsConversionActive = false;
  }

  if (!hasOuts) {
    clearPotOddsSelections();
  }

  updateRunButtonState();
}

export function computePotOddsSelection() {
  if (!potOddsData || potOddsData.length === 0) return [];
  if (selectedPotOddsOuts.size === 0) return [];
  if (selectedPotOddsDomains.size === 0 && !potOddsConversionActive) return [];
  if (selectedPotOddsStreets.size === 0) return [];

  const hasPercent = selectedPotOddsDomains.has('raw_percent');
  const hasOdds = selectedPotOddsDomains.has('raw_odds');
  const includePercentToOdds = potOddsConversionActive && hasPercent;
  const includeOddsToPercent = potOddsConversionActive && hasOdds;

  return potOddsData
    .filter(item => {
      if (!selectedPotOddsOuts.has(item.outs)) return false;
      if (!selectedPotOddsStreets.has(item.street)) return false;
      if (item.domain === 'raw_percent') return hasPercent;
      if (item.domain === 'raw_odds') return hasOdds;
      if (item.domain === 'conversion') {
        if (item.format === 'percent_to_odds') return includePercentToOdds;
        if (item.format === 'odds_to_percent') return includeOddsToPercent;
        return false;
      }
      return false;
    })
    .map(({ question, answer }) => ({ question, answer }));
}

/**
 * Crea un grupo de spinner con etiqueta abreviada y envoltura de
 * corchetes.  El contenido resultante tiene la forma «< INI: [input] >».
 * Se utiliza la función createSpinner proporcionada por `numaSpinners.js` y se
 * añaden elementos de texto para los símbolos «<» y «>».  El spinner se
 * devuelve listo para insertarse en un contenedor.
 *
 * @param {string} label - Etiqueta abreviada (INI, END o CHN).
 * @param {string} inputId - ID único para el input del spinner.
 * @param {number} initialValue - Valor inicial del spinner.
 * @returns {HTMLElement} - Elemento contenedor con los símbolos y el spinner.
 */
function createBracketedSpinner(label, inputId, initialValue) {
  const group = document.createElement('div');
  group.className = 'numa-bracket-group';

  const spinnerGroup = createSpinner(`${label}:`, inputId, initialValue);
  const input = spinnerGroup.querySelector('input[type="number"]');

  const btnLeft = document.createElement('button');
  btnLeft.className = 'angle-btn';
  btnLeft.type = 'button';
  btnLeft.textContent = '<';
  btnLeft.addEventListener('click', () => {
    input.stepDown();
    input.dispatchEvent(new Event('input'));
  });

  const btnRight = document.createElement('button');
  btnRight.className = 'angle-btn';
  btnRight.type = 'button';
  btnRight.textContent = '>';
  btnRight.addEventListener('click', () => {
    input.stepUp();
    input.dispatchEvent(new Event('input'));
  });

  group.appendChild(btnLeft);
  group.appendChild(spinnerGroup);
  group.appendChild(btnRight);
  return group;
}



/**
 * Restablece todos los botones de operación y número a su estado inicial
 * desactivado.  Además, vacía la selección de niveles de Poker Numbs y
 * desmarca sus botones.  Se utiliza al iniciar una nueva configuración.
 */
function resetSelections() {
  // Reiniciar botones de operaciones
  if (leftCol) {
    leftCol.querySelectorAll('button.numa-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  // Reiniciar botones de números
  if (scroll) {
    scroll.querySelectorAll('button.numa-num-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  // Reiniciar niveles de Poker
  selectedPokerLevels.clear();
  const pokerButtons = document.querySelectorAll('#poker-numbs-bar button.numa-btn');
  pokerButtons.forEach(btn => {
    btn.classList.remove('active');
    const name = btn.dataset.name;
    btn.textContent = `○ ${name}`;
  });

  // Reiniciar Pot Odds
  selectedPotOddsOuts.clear();
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.forEach(btn => btn.classList.remove('active'));
  potOddsStreetButtons.forEach(btn => btn.classList.remove('active'));
  if (potOddsConversionButton) potOddsConversionButton.classList.remove('active');
  updatePotOddsGating();
}

/**
 * Calcula si el botón «Comenzar» debe estar habilitado en función de
 * las selecciones actuales.  Debe haber al menos una operación
 * seleccionada y al menos una de las siguientes: números activos para
 * ejercicios NUMA o niveles de Poker Numbs seleccionados.  Además
 * actualiza la clase «disabled» del botón.
 */
function updateRunButtonState() {
  if (!runBtn || !leftCol || !scroll) return;
  const opSelected = leftCol.querySelectorAll('button.numa-btn.active').length > 0;
  const numSelected = scroll.querySelectorAll('button.numa-num-btn.active').length > 0;
  const pokerSelected = selectedPokerLevels.size > 0;
  const potOddsAvailable = computePotOddsSelection().length > 0;
  const hasMathOrPoker = opSelected && (numSelected || pokerSelected);
  if (hasMathOrPoker || potOddsAvailable) {
    runBtn.disabled = false;
    runBtn.classList.remove('disabled');
  } else {
    runBtn.disabled = true;
    runBtn.classList.add('disabled');
  }
}

/**
 * Fuerza la activación del modo Random y desactiva Surges cuando el
 * valor de cadena (chain) es mayor o igual a 3.  Este comportamiento
 * mantiene la coherencia con la versión anterior del módulo.
 */
function forceActivateRandom() {
  if (!randomBtn || !surgesBtn) return;
  if (!randomBtn.classList.contains('active')) {
    randomBtn.classList.add('active');
  }
  randomBtn.disabled = true;
  randomBtn.classList.add('disabled');
  surgesBtn.classList.remove('active');
  surgesBtn.disabled = true;
  surgesBtn.classList.add('disabled');
  updateRunButtonState();
}

/**
 * Valida y ajusta los valores de los spinners (inicio, fin, cadena) y
 * aplica las restricciones de los modos Random y Surges según el
 * valor de cadena.  Esta función se dispara al modificar algún
 * spinner o al iniciar el módulo.  También llama a
 * updateRunButtonState para reflejar posibles cambios.
 */
function validateSpinners() {
  const startInput = document.getElementById('numa-start');
  const endInput = document.getElementById('numa-end');
  const chainInput = document.getElementById('numa-chain');
  if (!startInput || !endInput || !chainInput) return;
  // Normalizar valores
  let startVal = parseInt(startInput.value, 10);
  let endVal = parseInt(endInput.value, 10);
  let chainVal = parseInt(chainInput.value, 10);
  if (isNaN(startVal) || startVal < 1) startVal = 1;
  if (isNaN(endVal) || endVal < 1) endVal = 1;
  if (startVal > endVal) {
    startVal = endVal;
  }
  if (isNaN(chainVal) || chainVal < 2) chainVal = 2;
  startInput.value = String(startVal);
  endInput.value = String(endVal);
  chainInput.value = String(chainVal);
  // Restricciones para Random y Surges dependiendo de la cadena
  if (chainVal >= 3) {
    forceActivateRandom();
  } else {
    // Rehabilitar ambos
    if (randomBtn) {
      randomBtn.disabled = false;
      randomBtn.classList.remove('disabled');
      randomBtn.classList.remove('active');
    }
    if (surgesBtn) {
      surgesBtn.disabled = false;
      surgesBtn.classList.remove('disabled');
      surgesBtn.classList.remove('active');
    }
  }
  updateRunButtonState();
}

/**
 * Inicializa el módulo NUMA dentro del contenedor proporcionado.  Se
 * construye toda la interfaz de configuración: operaciones, modos,
 * velocidades, selección de números, niveles de Poker Numbs y
 * spinners.  También se define la lógica del botón de inicio y se
 * establecen los oyentes necesarios para mantener el estado.
 *
 * @param {HTMLElement} container - Contenedor donde se montará la interfaz.
 */
export function init(container) {
  // Limpiar y preparar variables de estado
  speedButtons.length = 0;
  selectedPokerLevels.clear();
  selectedPotOddsOuts.clear();
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.length = 0;
  potOddsStreetButtons.length = 0;
  potOddsConversionButton = null;
  container.innerHTML = '';

  loadPotOddsData();

  // Crear la pantalla tipo terminal que envolverá la configuración y
  // posteriormente los ejercicios
  const term = document.createElement('div');
  term.id = 'numa-terminal';
  term.className = 'numa-terminal';
  container.appendChild(term);

  // Contenedor principal de configuración con dos columnas
  const cfgContainer = document.createElement('div');
  cfgContainer.className = 'numa-cfg-container';
  term.appendChild(cfgContainer);

  // ----- COLUMNA IZQUIERDA: operaciones básicas -----
  leftCol = document.createElement('div');
  leftCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(leftCol);
  // Fila superior: suma y resta
  const leftTopRow = document.createElement('div');
  leftTopRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftTopRow);
  ['+','-'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'numa-btn';
    btn.onclick = () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    };
    leftTopRow.appendChild(btn);
  });
  // Fila inferior: multiplicación y división
  const leftBottomRow = document.createElement('div');
  leftBottomRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftBottomRow);
  ['×','÷'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'numa-btn';
    btn.onclick = () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    };
    leftBottomRow.appendChild(btn);
  });

  // ----- COLUMNA DERECHA: modos de presentación -----
  const rightCol = document.createElement('div');
  rightCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(rightCol);

  // Fila superior de la derecha: Random, Mirror, Surges, Fugues
  const rightTopRow = document.createElement('div');
  rightTopRow.className = 'numa-cfg-row';
  rightCol.appendChild(rightTopRow);
  const modeLabels = { Random: 'RND', Mirror: 'MRR', Surges: 'SRG', Fugues: 'FGS' };
  ['Random','Mirror','Surges','Fugues'].forEach(mode => {
    const btn = document.createElement('button');
    btn.textContent = modeLabels[mode] || mode;
    btn.className = 'numa-btn';
    btn.dataset.mode = mode;
    rightTopRow.appendChild(btn);
  });
  // Obtener referencias a los botones de modo
  const modeButtons = Array.from(rightTopRow.querySelectorAll('button.numa-btn'));
  randomBtn = modeButtons.find(b => b.dataset.mode === 'Random');
  surgesBtn = modeButtons.find(b => b.dataset.mode === 'Surges');
  mirrorBtn = modeButtons.find(b => b.dataset.mode === 'Mirror');
  fuguesBtn = modeButtons.find(b => b.dataset.mode === 'Fugues');

  // Añadir oyentes a los botones de modo (excepto Random/Surges que se gestionan aparte)
  modeButtons.forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === 'Random' || mode === 'Surges') return; // se gestionan abajo
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const isActive = btn.classList.toggle('active');
      if (mode === 'Fugues') {
        // Activar/desactivar botones de velocidad
        speedButtons.forEach(sb => {
          sb.disabled = !isActive;
          sb.classList.toggle('disabled', !isActive);
          sb.classList.remove('active');
        });
        // Seleccionar velocidad por defecto
        if (isActive && speedButtons.length > 0) {
          const defaultSpeed = speedButtons[0];
          defaultSpeed.classList.add('active');
          currentSpeed = defaultSpeed.dataset.spinSpeed;
        }
      }
      updateRunButtonState();
    });
  });

  // Oyentes específicos para Random y Surges (mutuamente excluyentes)
  if (randomBtn && surgesBtn) {
    randomBtn.addEventListener('click', () => {
      if (randomBtn.disabled) return;
      const nowActive = !randomBtn.classList.contains('active');
      randomBtn.classList.toggle('active', nowActive);
      if (nowActive) surgesBtn.classList.remove('active');
      updateRunButtonState();
    });
    surgesBtn.addEventListener('click', () => {
      if (surgesBtn.disabled) return;
      const nowActive = !surgesBtn.classList.contains('active');
      surgesBtn.classList.toggle('active', nowActive);
      if (nowActive) randomBtn.classList.remove('active');
      updateRunButtonState();
    });
  }

  // ----- Fila de velocidades para Fugues -----
  const speedRow = document.createElement('div');
  speedRow.className = 'numa-cfg-row speed-row';
  rightCol.appendChild(speedRow);
  ['1H','2H','3H','4H','5H','6H'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.spinSpeed = label;
    btn.className = 'numa-btn';
    btn.disabled = true;
    btn.onclick = () => {
      if (btn.disabled) return;
      // Desactivar otros
      speedButtons.forEach(sb => sb.classList.remove('active'));
      btn.classList.add('active');
      currentSpeed = label;
      localStorage.setItem('fuguesSpeed', currentSpeed);
    };
    speedButtons.push(btn);
    speedRow.appendChild(btn);
  });

  // ----- Selector de números (1–100) -----
  scroll = document.createElement('div');
  scroll.className = 'numa-scroll';
  for (let i = 1; i <= 100; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'numa-num-btn';
    btn.onclick = () => {
      btn.classList.toggle('active');
      updateRunButtonState();
    };
    scroll.appendChild(btn);
  }
  term.appendChild(scroll);

  // ----- Barra de Poker Numbs (se inserta sobre la fila de spinners) -----
  const pokerBar = document.createElement('div');
  pokerBar.id = 'poker-numbs-bar';
  pokerBar.className = 'numa-bottom'; // reutiliza estilo de barra inferior
  // Etiqueta fija
  const pokerLabel = document.createElement('span');
  
  pokerLabel.style.color = '#28a746';
  pokerLabel.style.fontSize = '0.8rem';
  pokerBar.appendChild(pokerLabel);
  // Configuración de botones de nivel
  const levelNames = [ { name: 'Basic', level: 1 }, { name: 'Med', level: 2 }, { name: 'High', level: 3 }, { name: 'Advance', level: 4 } ];
  levelNames.forEach(({ name, level }) => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.dataset.level = String(level);
    btn.dataset.name = name;
    btn.textContent = `○ ${name}`;
    btn.onclick = () => {
      const lvl = parseInt(btn.dataset.level, 10);
      if (selectedPokerLevels.has(lvl)) {
        selectedPokerLevels.delete(lvl);
        btn.classList.remove('active');
        btn.textContent = `○ ${name}`;
      } else {
        selectedPokerLevels.add(lvl);
        btn.classList.add('active');
        btn.textContent = `● ${name}`;
      }
      updateRunButtonState();
    };
    pokerBar.appendChild(btn);
  });

  // ----- Fila inferior: spinners INI/END/CHN -----
  const rowBottom = document.createElement('div');
  rowBottom.className = 'numa-bottom';
  term.appendChild(rowBottom);
  // Insertar barra de Poker Numbs justo antes de los spinners
  term.insertBefore(pokerBar, rowBottom);
  // Crear spinners abreviados
  const iniSpinner = createBracketedSpinner('INI', 'numa-start', 1);
  const endSpinner = createBracketedSpinner('END', 'numa-end', 10);
  const chnSpinner = createBracketedSpinner('CHN', 'numa-chain', 2);
  rowBottom.appendChild(iniSpinner);
  rowBottom.appendChild(endSpinner);
  rowBottom.appendChild(chnSpinner);
  // Escuchar cambios de spinners para validación
  const chainInputEl = chnSpinner.querySelector('input[type="number"]');
  if (chainInputEl) {
    chainInputEl.addEventListener('input', validateSpinners);
  }
  const startInputEl = iniSpinner.querySelector('input[type="number"]');
  const endInputEl = endSpinner.querySelector('input[type="number"]');
  [startInputEl, endInputEl, chainInputEl].forEach(el => {
    if (el) el.addEventListener('input', validateSpinners);
  });

  // ----- Pot Odds: selección de outs y filtros -----
  const potOddsOutsRow = document.createElement('div');
  potOddsOutsRow.className = 'numa-bottom';
  potOddsOutsRow.id = 'pot-odds-outs-row';
  term.appendChild(potOddsOutsRow);

  const outsRanges = [
    { label: '1–5', values: [1, 2, 3, 4, 5] },
    { label: '6–10', values: [6, 7, 8, 9, 10] },
    { label: '11–15', values: [11, 12, 13, 14, 15] },
    { label: '16–20', values: [16, 17, 18, 19, 20] }
  ];

  outsRanges.forEach(range => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = range.label;
    btn.addEventListener('click', () => {
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      range.values.forEach(value => {
        if (nowActive) selectedPotOddsOuts.add(value);
        else selectedPotOddsOuts.delete(value);
      });
      updatePotOddsGating();
    });
    potOddsOutsRow.appendChild(btn);
  });

  const potOddsFiltersRow = document.createElement('div');
  potOddsFiltersRow.className = 'numa-bottom';
  potOddsFiltersRow.id = 'pot-odds-filters-row';
  term.appendChild(potOddsFiltersRow);

  const domainDefs = [
    { label: 'N %', domain: 'raw_percent' },
    { label: 'N : N', domain: 'raw_odds' }
  ];

  domainDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.dataset.domain = def.domain;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const willActivate = !btn.classList.contains('active');
      btn.classList.toggle('active', willActivate);
      if (willActivate) selectedPotOddsDomains.add(def.domain);
      else selectedPotOddsDomains.delete(def.domain);
      updatePotOddsGating();
    });
    potOddsDomainButtons.push(btn);
    potOddsFiltersRow.appendChild(btn);
  });

  const streetDefs = [
    { label: 'Flop-Turn', street: 'flop_turn' },
    { label: 'Turn-River', street: 'turn_river' },
    { label: 'Flop-River', street: 'flop_river' }
  ];

  streetDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.dataset.street = def.street;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedPotOddsStreets.add(def.street);
      else selectedPotOddsStreets.delete(def.street);
      updateRunButtonState();
    });
    potOddsStreetButtons.push(btn);
    potOddsFiltersRow.appendChild(btn);
  });

  potOddsConversionButton = document.createElement('button');
  potOddsConversionButton.className = 'numa-btn';
  potOddsConversionButton.textContent = 'conv';
  potOddsConversionButton.addEventListener('click', () => {
    if (potOddsConversionButton.disabled) return;
    potOddsConversionActive = !potOddsConversionActive;
    potOddsConversionButton.classList.toggle('active', potOddsConversionActive);
    updateRunButtonState();
  });
  potOddsFiltersRow.appendChild(potOddsConversionButton);

  updatePotOddsGating();

  // ----- Estadísticas -----
  statsEl = document.createElement('div');
  statsEl.id = 'numa-stats';
  statsEl.className = 'numa-stats';
  term.appendChild(statsEl);

  // ----- Botón Comenzar -----
  runBtn = document.createElement('button');
  runBtn.textContent = 'Comenzar';
  runBtn.classList.add('numa-btn', 'start-btn', 'disabled');
  runBtn.disabled = true;
  btnRow = document.createElement('div');
  btnRow.className = 'numa-btn-row';
  btnRow.appendChild(runBtn);
  container.appendChild(btnRow);
  // Acción al hacer clic en Comenzar
  runBtn.onclick = () => {
    // Recopilar operaciones seleccionadas
    const opsLeft = Array.from(leftCol.querySelectorAll('button.numa-btn.active')).map(b => b.textContent);
    // Recopilar números seleccionados
    const nums = Array.from(scroll.querySelectorAll('button.numa-num-btn.active')).map(b => parseInt(b.textContent, 10));
    // Valores de spinners
    const startVal = parseInt(document.getElementById('numa-start').value, 10) || 1;
    const endVal = parseInt(document.getElementById('numa-end').value, 10) || 1;
    const chainVal = parseInt(document.getElementById('numa-chain').value, 10) || 2;
    // Niveles de Poker
    const levels = Array.from(selectedPokerLevels);
    // Modos activos
    const modes = [];
    if (randomBtn?.classList.contains('active')) modes.push('Random');
    if (surgesBtn?.classList.contains('active')) modes.push('Surges');
    if (mirrorBtn?.classList.contains('active')) modes.push('Mirror');
    if (fuguesBtn?.classList.contains('active')) modes.push('Fugues');
    // Calcular expresiones combinadas
    const expressions = generateCombinedExpressions({
      selectedOps: opsLeft,
      selectedNums: nums,
      start: startVal,
      end: endVal,
      chain: chainVal,
      selectedLevels: levels,
      modes: modes,
      pokerOps: pokerOps
    });
    const potOddsSeq = computePotOddsSelection();
    const combined = [...expressions, ...potOddsSeq];
    // Iniciar la sesión
    runSession({
      expressions: combined,
      modes,
      container,
      statsElement: statsEl,
      btnRow
    });
    if (statsEl) {
      const total = combined.length;
      const potCount = potOddsSeq.length;
      const estimated = Math.ceil(total * 5);
      statsEl.textContent = `Total: ${total} (Pot Odds: ${potCount})  Est. tiempo: ${estimated}s`;
    }
  };

  // Añadir oyentes a los botones de operación y número (ya se hicieron
  // dentro de su creación).  Ajustar el estado inicial del botón Run.
  updateRunButtonState();
  // Validar spinners al terminar la inicialización (puede forzar Random)
  setTimeout(() => validateSpinners(), 50);
}