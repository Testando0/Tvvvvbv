const M3U8_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const channelList = document.getElementById('channel-list');

    // Função para carregar um stream no player de vídeo
    function loadStream(url) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            // Ligar o hls.js ao elemento <video>
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
            // Opcional: Adicionar tratamento de erros do HLS
            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    console.error('Erro fatal do HLS:', data.type, data.details);
                    // Tentar reprodução nativa como último recurso
                    video.src = url;
                    video.play().catch(e => console.error("Falha ao reproduzir:", e));
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Suporte nativo do navegador (principalmente Safari/iOS)
            video.src = url;
            video.addEventListener('loadedmetadata', function() {
                video.play();
            });
        }
    }

    // Função para buscar e processar a lista M3U8
    async function fetchAndParsePlaylist() {
        try {
            const response = await fetch(M3U8_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            
            // Regex para encontrar o nome do canal (group-title) e a URL
            const lines = data.split('\n');
            const channels = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('#EXTINF:')) {
                    // Extrair o nome do canal (depois da vírgula)
                    const titleMatch = lines[i].match(/,(.+)/);
                    const name = titleMatch ? titleMatch[1].trim() : 'Canal Desconhecido';
                    
                    // A próxima linha é a URL do stream
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
            video.src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"; // Stream de teste de fallback
            video.play();
        }
    }

    fetchAndParsePlaylist();
});
