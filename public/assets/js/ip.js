function enableCopyButton() {
  document.querySelector('#copiar-ip').disabled = false;
}

function disableCopyButton() {
  document.querySelector('#copiar-ip').disabled = true;
}

function updateIpOnScreen(text) {
  document.querySelector('.ip').value = text;
}

async function ip() {
  const result = await fetch('https://api.codamos.com.br/ifcfg', {
    method: 'GET',
  });

  document.querySelector('#copiar-ip').innerHTML = document.querySelector('#copiar-ip').innerHTML.replace('Copiado!', 'Copiar');
  if (result.status == 200) {
    updateIpOnScreen(await result.text());
    enableCopyButton();
  } else {
    updateIpOnScreen('Não foi possível obter seu IP. Tente novamente mais tarde.');
    disableCopyButton();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await ip();

  const ipElm = document.querySelector('.ip');
  document.querySelector('#copiar-ip').addEventListener('click', () => {
    if (document.querySelector('#copiar-ip').disabled) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      ipElm.select();
      ipElm.setSelectionRange(0, 99999);

      navigator.clipboard.writeText(ipElm.value);
      document.querySelector('#copiar-ip').innerHTML = document.querySelector('#copiar-ip').innerHTML.replace('Copiar', 'Copiado!');
    }
  });
});

