# ManuscritoDaBruxos

Gerador local que transforma um parágrafo simples em um prompt cinematográfico para vídeo. Não usa chat, API ou modelo pesado: a geração é imediata e segue uma estrutura inspirada nos guias de Seedance, Bernini e LTX-2.3.

## Testar localmente

No Windows, dê dois cliques em **iniciar-local.bat**. Também é possível abrir
o `index.html` diretamente, mas o servidor local facilita testar o mesmo
comportamento que será usado no GitHub Pages.

Como alternativa, abra um terminal dentro da pasta e execute:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`. O gerador abre imediatamente e não precisa baixar nenhum modelo.

## Requisitos

Funciona em navegadores modernos no computador ou celular. Não requer WebGPU.

## Privacidade

Todo o processamento acontece no próprio navegador. Os textos não são enviados a servidores ou APIs.

## Créditos

Método baseado no [guia de prompting do Seedance](https://higgsfield.ai/blog/seedance-prompting-guide), nos [templates do Bernini](https://deepwiki.com/bytedance/Bernini/7.1-task-specific-prompt-templates) e no [guia do LTX-2.3](https://ltx.io/blog/ltx-2-3-prompt-guide).
