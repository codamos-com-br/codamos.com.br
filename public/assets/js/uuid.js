/**
 * Gerador e validador de UUID v4 do codamos.com.br.
 * Gera UUIDs no próprio navegador (sem rede) usando a Web Crypto API,
 * com fallback via crypto.getRandomValues para navegadores antigos.
 */
(function () {
  'use strict';

  var HEX = [];
  for (var i = 0; i < 256; i++) {
    HEX.push((i + 0x100).toString(16).substr(1));
  }

  function randomUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    var rng = window.crypto || window.msCrypto;
    var b = new Uint8Array(16);
    rng.getRandomValues(b);
    // Versão 4 e variante RFC 4122.
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;

    return (
      HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + '-' +
      HEX[b[4]] + HEX[b[5]] + '-' +
      HEX[b[6]] + HEX[b[7]] + '-' +
      HEX[b[8]] + HEX[b[9]] + '-' +
      HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
    );
  }

  function generateMany(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(randomUuid());
    }
    return out;
  }

  // Mantido global para o link "clique aqui" no conteúdo (compatibilidade).
  window.uuid = function () {
    var output = document.getElementById('uuid-output');
    if (output) {
      output.value = randomUuid();
      output.rows = 1;
    }
    return output ? output.value : randomUuid();
  };

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function setup() {
    var output = document.getElementById('uuid-output');
    var countInput = document.getElementById('uuid-count');
    var genBtn = document.getElementById('uuid-generate');
    var copyBtn = document.getElementById('uuid-copy');

    function render() {
      var n = parseInt(countInput ? countInput.value : '1', 10);
      if (isNaN(n) || n < 1) n = 1;
      if (n > 100) n = 100;
      if (countInput) countInput.value = n;

      output.value = generateMany(n).join('\n');
      output.rows = Math.min(n, 10);
      if (copyBtn) copyBtn.textContent = 'Copiar';
    }

    if (output) {
      render(); // gera na hora, sem esperar rede
      if (genBtn) genBtn.addEventListener('click', render);
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          output.select();
          output.setSelectionRange(0, 99999);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(output.value);
          } else {
            try { document.execCommand('copy'); } catch (e) {}
          }
          copyBtn.textContent = 'Copiado!';
        });
      }
    }

    // Validador de UUID.
    var vInput = document.getElementById('uuid-validate-input');
    var vBtn = document.getElementById('uuid-validate-btn');
    var vResult = document.getElementById('uuid-validate-result');

    function validate() {
      var val = (vInput.value || '').trim();
      if (!val) {
        vResult.textContent = '';
        vResult.className = 'msg';
        return;
      }
      if (UUID_RE.test(val)) {
        var version = val.charAt(14);
        vResult.textContent =
          'UUID válido' + (/[1-5]/.test(version) ? ' (versão ' + version + ').' : '.');
        vResult.className = 'msg msg--success';
      } else {
        vResult.textContent =
          'UUID inválido. O formato esperado é 8-4-4-4-12 dígitos hexadecimais.';
        vResult.className = 'msg msg--highlight';
      }
    }

    if (vBtn && vInput && vResult) {
      vBtn.addEventListener('click', validate);
      vInput.addEventListener('input', validate);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
