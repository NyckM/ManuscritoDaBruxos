# ManuscritoDaBruxos

Assistente criativo local para prompts de imagem, vídeo, VFX e ferramentas audiovisuais. O site usa **Gemma 3 270M IT**, via Transformers.js e WebGPU, diretamente no navegador. Essa variante foi escolhida por ser compatível com uma faixa maior de GPUs.

## Publicar no GitHub Pages

1. Envie todo o conteúdo desta pasta para a raiz do seu repositório.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main`, a pasta `/ (root)` e clique em **Save**.

Também é possível publicar esta pasta dentro de um repositório maior, usando GitHub Actions ou movendo os arquivos para a raiz.

## Testar localmente

No Windows, dê dois cliques em **iniciar-local.bat**. Não abra o `index.html`
diretamente: navegadores bloqueiam partes do carregamento do modelo em páginas
abertas com `file://`.

Como alternativa, abra um terminal dentro da pasta e execute:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`. O carregamento do modelo requer internet na primeira execução e pode baixar centenas de megabytes. Os arquivos ficam armazenados no cache do navegador.

## Requisitos

- Chrome ou Edge recente com WebGPU e aceleração de hardware habilitados.
- HTTPS em produção (o GitHub Pages já fornece).
- Uma GPU integrada ou dedicada com memória suficiente.

Em dispositivos incompatíveis, a interface continua disponível e informa como ativar o WebGPU.

## Privacidade

Depois do download inicial do modelo, a inferência e as conversas acontecem no dispositivo. Os prompts não são enviados a uma API de chat.

## Créditos

Inspirado no experimento [Gemma 4 WebGPU Kernels](https://huggingface.co/spaces/webml-community/gemma-4-webgpu-kernels), do webml-community. Modelo compatível usado nesta versão: [onnx-community/gemma-3-270m-it-ONNX](https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX).
