const M3U8_URL = 'https://gist.githubusercontent.com/sempreconceito/267043c96ac39ed5b1b9f3680b91974a/raw/f7cb4d3a34fb734cbec7a1c313822cd5aab72da9/CANAISJOABE.M3U';

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const channelList = document.getElementById('channel-list');

    // Função para carregar um stream no player de vídeo
    function loadStream(url) {
        // Tentativa de usar hls.js (para streams HLS)
        if (Hls.isSupported()) {
            // Se o URL for de um stream HLS (.m3u8), o hls.js irá tratar
            // Caso contrário, ele pode falhar ou tentar reprodução direta.
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    console.error('Erro fatal do HLS. Tentando reprodução nativa.');
                    // Tentar reprodução nativa como último recurso
                    video.src = url;
                    video.play().catch(e => console.error("Falha ao reproduzir o URL:", e));
                }
            });
        } else {
            // Suporte nativo do navegador (reprodução direta, funciona para M3U8 nativo ou MP4/TS)
            video.src = url;
            video.addEventListener('loadedmetadata', function() {
                video.play();
            });
        }
    }

    // Função para buscar e processar a lista M3U
    async function fetchAndParsePlaylist() {
        try {
            const response = await fetch(M3U8_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            
            const lines = data.split('\n');
            const channels = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    // Extrair o nome do canal (depois da vírgula)
                    const titleMatch = lines[i].match(/,(.+)/);
                    const name = titleMatch ? titleMatch[1].trim() : 'Canal Desconhecido';
                    
                    // A próxima linha é a URL do stream
                    // M3U/M3U8 são listas de pares [metadados, URL]
                    const url = lines[i + 1] ? lines[i + 1].trim() : null;
                    
                    if (url) {
                        channels.push({ name, url });
                    }
                }
            }

            // Inserir canais na lista HTML
            channels.forEach((channel, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = channel.name;
                
                // Evento de clique para carregar o canal
                listItem.addEventListener('click', () => {
                    // Remover destaque do canal anterior
                    document.querySelectorAll('#channel-list li').forEach(li => {
                        li.style.fontWeight = 'normal';
                        li.style.backgroundColor = 'transparent';
                    });
                    
                    // Adicionar destaque ao canal atual
                    listItem.style.fontWeight = 'bold';
                    listItem.style.backgroundColor = '#d1e7ff';
                    
                    // Carregar o novo stream
                    loadStream(channel.url);
                });

                channelList.appendChild(listItem);
                
                // Carregar o primeiro canal automaticamente ao iniciar
                if (index === 0) {
                    loadStream(channel.url);
                    listItem.style.fontWeight = 'bold';
                    listItem.style.backgroundColor = '#d1e7ff';
                }
            });

        } catch (error) {
            console.error("Não foi possível carregar ou processar a playlist:", error);
            // Stream de teste de fallback se a URL principal falhar
            video.src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; 
            video.play();
        }
    }

    fetchAndParsePlaylist();
});
