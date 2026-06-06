function enableCopyButton() {
  document.querySelector('#copiar-uuid').disabled = false;
}

function disableCopyButton() {
  document.querySelector('#copiar-uuid').disabled = true;
}

function updateUuidOnScreen(text) {
  document.querySelector('.uuid').value = text;
}

async function uuid() {
  const result = await fetch('https://api.codamos.com.br/uuid', {
    method: 'POST',
  });

  document.querySelector('#copiar-uuid').innerHTML = document.querySelector('#copiar-uuid').innerHTML.replace('Copiado!', 'Copiar');
  if (result.status == 200) {
    updateUuidOnScreen(await result.text());
    enableCopyButton();
  } else {
    updateUuidOnScreen('Não foi possível gerar um UUID novo.');
    disableCopyButton();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await uuid();

  const uuidElm = document.querySelector('.uuid');
  document.querySelector('#copiar-uuid').addEventListener('click', () => {
    if (document.querySelector('#copiar-uuid').disabled) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      uuidElm.select();
      uuidElm.setSelectionRange(0, 99999);

      navigator.clipboard.writeText(uuidElm.value);
      document.querySelector('#copiar-uuid').innerHTML = document.querySelector('#copiar-uuid').innerHTML.replace('Copiar', 'Copiado!');
    }
  });
});

