class TVApp {
  constructor() {
    // Add dev tools protection
    if (window.outerHeight - window.innerHeight > 100 || window.outerWidth - window.innerWidth > 100) {
      document.body.innerHTML = '';
      window.location.href = 'about:blank';
      return;
    }
    
    // Initialize encryption keys
    this.key = CryptoJS.enc.Utf8.parse('8x/A?D(G+KbPeShV'); 
    this.iv = CryptoJS.enc.Utf8.parse('kWjXn2r5u8x/A?D(');

    this.player = null;
    this.channels = [];
    this.favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
    this.currentCategory = 'todos';
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.sidebarActive = false;
    this.adminUser = { username: 'jhonny', password: '24591043@' };
    this.isAdmin = false;
    this.deviceInfo = this.getDeviceInfo();
    
    // Initialize everything else
    this.initializeElements();
    this.initializeAuth();
    this.initializeModals();
    this.initializePlayer();
    this.setupEventListeners();
    this.loadChannels();
    this.updateDarkMode();
    this.initializeFavoritesSidebar();
    
    this.addChannelBtn.style.display = 'inline-block';
  }

  initializeElements() {
    this.searchInput = document.getElementById('searchInput');
    this.darkModeBtn = document.getElementById('darkMode');
    this.favoritesBtn = document.getElementById('favorites');
    this.categoriesContainer = document.getElementById('categories');
    this.channelsList = document.getElementById('channelsList');
    this.favoritesSidebar = document.getElementById('favoritesSidebar');
    this.closeFavoritesBtn = document.getElementById('closeFavorites');
    this.favoritesList = document.getElementById('favoritesList');
    this.addChannelBtn = document.getElementById('addChannel');
    this.deviceInfoBtn = document.getElementById('deviceInfo');
    this.deviceInfoModal = document.getElementById('deviceInfoModal');
    this.addChannelModal = document.getElementById('addChannelModal');
    this.deviceDetails = document.getElementById('deviceDetails');
    
    this.deviceInfoBtn.style.display = 'none';
  }

  initializeAuth() {
    if (localStorage.getItem('isAdmin') === 'true') {
      this.isAdmin = true;
    }
  }

  initializeModals() {
  }

  initializePlayer() {
    this.player = videojs('tvPlayer', {
      fluid: true,
      controls: true,
      autoplay: false,
      preload: 'auto'
    });
  }

  setupEventListeners() {
    this.searchInput.addEventListener('input', () => this.filterChannels());
    this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
    this.favoritesBtn.addEventListener('click', () => this.toggleFavoritesView());
    this.categoriesContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('category')) {
        this.setCategory(e.target.dataset.category);
      }
    });
    this.closeFavoritesBtn.addEventListener('click', () => this.toggleFavoritesSidebar());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.sidebarActive) {
        this.toggleFavoritesSidebar();
      }
    });
    this.addChannelBtn.addEventListener('click', () => this.showAddChannelModal());
    this.deviceInfoBtn.addEventListener('click', () => this.showDeviceInfo());
    
    document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
        this.deviceInfoModal.style.display = 'none';
        this.addChannelModal.style.display = 'none';
      });
    });

    document.getElementById('addChannelForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addNewChannel();
    });
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      connection: navigator.connection ? {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : 'Not available'
    };
  }

  showDeviceInfo() {
    this.deviceDetails.innerHTML = `
      <p><strong>Navegador:</strong> ${this.deviceInfo.userAgent}</p>
      <p><strong>Plataforma:</strong> ${this.deviceInfo.platform}</p>
      <p><strong>Fabricante:</strong> ${this.deviceInfo.vendor}</p>
      <p><strong>Idioma:</strong> ${this.deviceInfo.language}</p>
      <p><strong>Resolución:</strong> ${this.deviceInfo.screenResolution}</p>
      <p><strong>Ratio de Píxeles:</strong> ${this.deviceInfo.devicePixelRatio}</p>
    `;
    this.deviceInfoModal.style.display = 'block';
  }

  showAddChannelModal() {
    if (!this.isAdmin) {
      const username = prompt('Usuario admin:');
      const password = prompt('Contraseña admin:');

      if (username === this.adminUser.username && password === this.adminUser.password) {
        this.isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        this.addChannelModal.style.display = 'block';
      } else {
        alert('Credenciales de administrador incorrectas');
      }
    } else {
      this.addChannelModal.style.display = 'block';
    }
  }

  async loadChannels() {
    try {
      // Try to load channels from localStorage first
      const savedChannels = localStorage.getItem('customChannels');
      if (savedChannels) {
        this.channels = JSON.parse(savedChannels);
        this.channels = this.channels.map(channel => ({
          ...channel,
          streamUrl: this.encryptUrl(channel.streamUrl || channel.url)
        }));
      } else {
        // If no channels in localStorage, load from default channels
        this.channels = [
          /* Ecuador */
          { id: 1, name: "Ecuavisa", category: "Ecuador", 
            streamUrl: this.encryptUrl("https://redirector.rudo.video/hls-video/c54ac2799874375c81c1672abb700870537c5223/ecuavisa/ecuavisa.smil/playlist.m3u8"),
            logo: "https://s1.dmcdn.net/v/SE-U41VbC-4qfDmj_/x1080?text=Ecuador" },
          { id: 2, name: "Teleamazonas", category: "Ecuador", 
            streamUrl: this.encryptUrl("https://teleamazonas-live.cdn.vustreams.com/live/fd4ab346-b4e3-4628-abf0-b5a1bc192428/live.isml/fd4ab346-b4e3-4628-abf0-b5a1bc192428.m3u8"),
            logo: "https://i.ytimg.com/vi/oZFsXMgkpQ0/hq720.jpg?sqp=-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYAC0AWKAgwIABABGH8gJigTMA8=&rs=AOn4CLC5zSqmBx34uw0TgUSMGTYkXbMFYg?text=Ecuador" },
          { id: 3, name: "Oromartv", category: "Ecuador", 
            streamUrl: this.encryptUrl("https://stream.oromar.tv/hls/oromartv_hi/index.m3u8"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGp9WHmnHnu2n-iSig7cYO5k_IudfyP25GTqcfxJh19x20lV-H34FcwzBgM_P4khhemQg&usqp=CAU?text=Ecuador" },

          /* Peru */
          { id: 4, name: "Latina", category: "Peru", 
            streamUrl: this.encryptUrl("https://live-evg1.tv360.bitel.com.pe/bitel/latina/playlist.m3u8"),
            logo: "https://i.ytimg.com/vi/WvnxTl6rGuE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBvDGf4TyHls6N4PfQkhEs2UIZNzA?text=Peru" },

          /* Venezuela */
          { id: 5, name: "Venevision", category: "Venezuela", 
            streamUrl: this.encryptUrl("https://vod2live.univtec.com/manifest/4c41c0d8-e2e4-43cc-bd43-79afe715e1b3.m3u8"),
            logo: "https://w2-venevision-com.s3.amazonaws.com/public/media/images/venevision---tu-emocion---2023-1-0049d8.jpg?text=Venevision" },

          /* Noticias */
          { id: 6, name: "Euro New", category: "Noticias", 
            streamUrl: this.encryptUrl("https://39997b2f529e4793961899e546833a75.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Samsung-es_EuroNewsLive/playlist.m3u8"),
            logo: "https://static.euronews.com/articles/stories/07/27/17/48/1200x675_cmsv2_32fdf993-ef22-54d9-809e-ccb2076429b4-7271748.jpg?text=Noticias" },
          { id: 7, name: "24h", category: "Noticias", 
            streamUrl: this.encryptUrl("https://ztnr.rtve.es/ztnr/1694255.m3u8"),
            logo: "https://www.24horas.cl/24horas/site/artic/20240103/imag/foto_0000000920240103074415.png?text=Noticias" },
          { id: 8, name: "DW", category: "Noticias", 
            streamUrl: this.encryptUrl("https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8"),
            logo: "https://static.dw.com/image/69105274_605.webp?text=Noticias" },

          /* Salvador */
          { id: 9, name: "Megavision", category: "Salvador", 
            streamUrl: this.encryptUrl("https://vcp.myplaytv.com/moviefe/moviefe/playlist.m3u8"),
            logo: "https://megavision.univtec.com/_next/image?url=https%3A%2F%2Fkki5auiqw9.execute-api.us-east-1.amazonaws.com%2Fstg%2Fresize%3Furl%3Dhttps%3A%2F%2Ffrankly-vod.akamaized.net%2Fmegavision%2Fuploaded%2F754bd760-78d6-48db-90ad-88b97e502ed8.jpeg&w=3840&q=90?text=Salvador" },

          /* Infantil */
          { id: 30, name: "Kids TV", category: "Infantil", 
            streamUrl: this.encryptUrl("https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/kids-tv-et/master.m3u8"),
            logo: "https://m.media-amazon.com/images/I/61ujeaPoYiL.png?text=Kids TV" },
          { id: 31, name: "Boing España", category: "Infantil", 
            streamUrl: this.encryptUrl("https://spa-ha-p002.cdn.masmediatv.es/SVoriginOperatorEdge/smil:17_HD.smil/index.m3u8"),
            logo: "https://i.ytimg.com/vi/_4Nzy5rjM0A/maxresdefault.jpg?text=Boing España" },
          { id: 32, name: "Toon en Español", category: "Infantil", 
            streamUrl: this.encryptUrl("https://stream.ads.ottera.tv/playlist.m3u8?network_id=514"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLUl7LYl757mci89pjoose7C2Yq-Jnuwok-g&s?text=Toon en Español" },
          { id: 33, name: "Pitufo tv", category: "Infantil", 
            streamUrl: this.encryptUrl("https://stream.ads.ottera.tv/playlist.m3u8?network_id=4211"),
            logo: "https://img.static-ottera.com/prod/tg/linear_channel/thumbnails/widescreen/k0UC6i-MUyyL25pRw2uuulUiBw1AluUVJQhZ65VxwjA.jpg?text=Pitufo tv" },
 /* Ecuador */
          { id: 1, name: "ABN", category: "Colombia", 
            streamUrl: this.encryptUrl("https://s2.abntelevision.com/avivamientoabr/stream/avivamientohd/avivamientohd/chunks.m3u8?nimblesessionid=102448758"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBhOBCXIE8Y3cAfDazLSFUbnw0BMPfy49FyQ&s?text=Ecuador" },

          { id: 2, name: "Telepacífico", category: "Colombia", 
            streamUrl: this.encryptUrl("https://live-edge-bhs-1.cdn.enetres.net/6E5C615AA5FF4123ACAF0DAB57B7B8DC021/live-telepacifico/index.m3u8"),
            logo: "https://www.elespectador.com/resizer/v2/KLUEITR5YFF7HFWXJAVMLGKLX4.jpg?auth=c0954d8bc9af95a12cb5a8b7e5dc7920c137dc3814e418e22c51b2c8751c2bcf&width=920&height=613&smart=true&quality=60?text=Ecuador" },

          { id: 3, name: "Toonz Kids", category: "Infantil", 
            streamUrl: this.encryptUrl("https://d35j504z0x2vu2.cloudfront.net/v1/manifest/0bc8e8376bd8417a1b6761138aa41c26c7309312/toonzkids-spanish/43770034-cfe9-4b6c-9b0a-cd3748021925/1.m3u8"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo35pibfmc9OZqaLwJS15BeLVrQgL2UI43g9IW5h8quseYudGsS5TvYl5xVDzy3AbsF0I&usqp=CAU?text=Ecuador" },

          /* Peru */
          { id: 4, name: "El Pinguino", category: "Chile", 
            streamUrl: this.encryptUrl("https://jireh-4-hls-video-us-isp.dps.live/hls-video/339f69c6122f6d8f4574732c235f09b7683e31a5/pinguinotv/pinguinotv.smil/pinguinotv/livestream2/chunks.m3u8?dpssid=b224464994267a35eaec4d43&sid=ba5t1l1xb2178958716867a35eaec4d41&ndvc=1"),
            logo: "https://i.ytimg.com/vi/hJAB7O4R4Rc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCfV7FteDJcT7Q97jvsPkOUHRcG7w?text=Peru" },

          /* Venezuela */
          { id: 5, name: "LaRed", category: "Chile", 
            streamUrl: this.encryptUrl("https://alba-cl-lared-lared.stream.mediatiquestream.com/live2/alba-cl-lared-lared_480p/chunks.m3u8"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJBP6uFOCoOwwHTX6l5TxD_1eLqLk3MXITtg&s?text=Venevision" },

          /* Noticias */
          { id: 6, name: "Teletrack", category: "Chile", 
            streamUrl: this.encryptUrl("https://teletraktv.janus.cl/playlist/stream.m3u8?s=lq&t=1699756660&id=louvd0p9&q=2&d=w"),
            logo: "https://i.ytimg.com/vi/GIsfu0ORsXA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAktNIrqZlhji26zkUJ6xSlnLREUg?text=Noticias" },

          { id: 7, name: "Canal 13 Tele Series", category: "Chile", 
            streamUrl: this.encryptUrl("https://ztnr.rtve.es/ztnr/1694255.m3u8"),
            logo: "https://www.5900.tv/wp-content/uploads/2020/02/tele-13-chile-en-vivo.jpg?text=Noticias" },

          { id: 8, name: "Deportes13 TV", category: "Chile", 
            streamUrl: this.encryptUrl("https://dai.google.com/linear/hls/pa/event/uFiYkh4CQPCPgbs7WPKhXw/stream/a3c13d14-6c14-4c3f-8ede-849389bf31e4:CHS/variant/d0472ea34665d38a12b63b486af4c283/bandwidth/2045193.m3u8"),
            logo: "https://s.t13.cl/sites/default/files/styles/manualcrop_850x475/public/t13/field-imagen/2023-05/whatsapp_image_2023-05-19_at_11.24.45.jpeg?itok=q-iMMPw5?text=Noticias" },

          /* Salvador */
          { id: 9, name: "Canal Doce Misiones", category: "Argentina", 
            streamUrl: this.encryptUrl("https://g1.vxral-hor.transport.edge-access.net/a14/ngrp:c12_live01-100129_all/c12_live01-100129_540p.m3u8"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQobxlRaOLURmmu2O05p1NfHYGGod7vhhRcTa6MTFWFdiPP_N8EElSTxjMY5hQHyedHS5E&usqp=CAU?text=Salvador" },

          /* Infantil */
          { id: 30, name: "Canal 10 Mar del Plata", category: "Argentina", 
            streamUrl: this.encryptUrl("https://g3.mc-hor.transport.edge-access.net/a12/ngrp:canal10mdq-100044_all/canal10mdq-100044_540p.m3u8"),
            logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOR7mxdqK7Ooh2wclm8o-ps2d7s4DgvsSuqQ&s?text=Kids TV" },

          { id: 31, name: "Canal 12", category: "Salvador", 
            streamUrl: this.encryptUrl("https://alba-sv-c12-c12.stream.mediatiquestream.com/original.m3u8"),
            logo: "https://i.ytimg.com/vi/rexo1xnZCpY/maxresdefault.jpg?text=Boing España" },

          { id: 32, name: "Canal Seis", category: "Salvador", 
            streamUrl: this.encryptUrl("https://stream.ads.ottera.tv/playlist.m3u8?network_id=514"),
            logo: "https://i.ytimg.com/vi/f_PU6GTSClI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDzFXN-2bDT4gBKEODs_Cndwheyzw?text=Toon en Español" },

          { id: 33, name: "WOW TV", category: "Salvador", 
            streamUrl: this.encryptUrl("https://cdn.elsalvadordigital.com:1936/wowtv/smil:wowtv.smil/chunklist_w1660410423_b2000000_slen.m3u8"),
            logo: "https://cigars.roku.com/v1/contain/800x454/https%3A%2F%2Fimage.roku.com%2Fdeveloper_channels%2Fprod%2F81e357d8bce46a50f8dc509841ed5764e975e5ac6eac1112160c8cb13d2b671f.jpg?text=Pitufo tv" }
        


].map(channel => ({
          ...channel,
          streamUrl: this.encryptUrl(channel.url || channel.streamUrl)
        }));
        this.saveChannels(); // Save default channels to localStorage
      }

      this.updateCategories();
      this.renderChannels();
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  }

  saveChannels() {
    try {
      localStorage.setItem('customChannels', JSON.stringify(this.channels));
    } catch (error) {
      console.error('Error saving channels:', error);
    }
  }

  addNewChannel() {
    const name = document.getElementById('channelName').value;
    const category = document.getElementById('channelCategory').value;
    const streamUrl = this.encryptUrl(document.getElementById('channelUrl').value);
    const logo = document.getElementById('channelLogo').value;

    const newChannel = {
      id: Date.now(),
      name,
      category,
      streamUrl,
      logo
    };

    this.channels.push(newChannel);
    this.saveChannels();
    
    this.updateCategories();
    this.renderChannels();
    this.addChannelModal.style.display = 'none';
    document.getElementById('addChannelForm').reset();
  }

  updateCategories() {
    const categories = ['todos', ...new Set(this.channels.map(channel => channel.category))];
    this.categoriesContainer.innerHTML = categories.map(category => 
      `<button class="category ${category === this.currentCategory ? 'active' : ''}" 
       data-category="${category}">${category}</button>`
    ).join('');
  }

  renderChannels() {
    const filteredChannels = this.channels.filter(channel => {
      const matchesCategory = this.currentCategory === 'todos' || channel.category === this.currentCategory;
      const matchesSearch = channel.name.toLowerCase().includes(this.searchInput.value.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    this.channelsList.innerHTML = filteredChannels.map(channel => `
      <div class="channel-card" data-id="${channel.id}">
        <img src="${channel.logo}" alt="${channel.name}" class="channel-logo">
        <div class="channel-info">
          <div class="channel-name">${channel.name}</div>
          <div class="channel-category">${channel.category}</div>
        </div>
        <button class="favorite-btn ${this.favorites.has(channel.id) ? 'active' : ''}"
                data-id="${channel.id}">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    `).join('');

    this.addChannelCardListeners();
  }

  addChannelCardListeners() {
    const cards = this.channelsList.querySelectorAll('.channel-card');
    cards.forEach(card => {
      const channelId = parseInt(card.dataset.id);
      const favoriteBtn = card.querySelector('.favorite-btn');
      
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.favorite-btn')) {
          this.playChannel(channelId);
        }
      });

      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(channelId);
      });
    });
  }

  playChannel(channelId) {
    const channel = this.channels.find(c => c.id === channelId);
    if (channel) {
      const decryptedUrl = this.decryptUrl(channel.streamUrl);
      this.player.src({ src: decryptedUrl, type: 'application/x-mpegURL' });
      this.player.play();
    }
  }

  toggleFavorite(channelId) {
    if (this.favorites.has(channelId)) {
      this.favorites.delete(channelId);
    } else {
      this.favorites.add(channelId);
    }
    localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    this.renderChannels();
    this.renderFavoritesSidebar();
  }

  setCategory(category) {
    this.currentCategory = category;
    this.updateCategories();
    this.renderChannels();
  }

  filterChannels() {
    this.renderChannels();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode);
    this.updateDarkMode();
  }

  updateDarkMode() {
    document.body.classList.toggle('dark-mode', this.darkMode);
  }

  toggleFavoritesView() {
    this.toggleFavoritesSidebar();
  }

  initializeFavoritesSidebar() {
    this.renderFavoritesSidebar();
  }

  toggleFavoritesSidebar() {
    this.sidebarActive = !this.sidebarActive;
    this.favoritesSidebar.classList.toggle('active', this.sidebarActive);
  }

  renderFavoritesSidebar() {
    const favoriteChannels = this.channels.filter(channel => this.favorites.has(channel.id));
    this.favoritesList.innerHTML = favoriteChannels.map(channel => `
      <div class="favorite-channel-card" data-id="${channel.id}">
        <img src="${channel.logo}" alt="${channel.name}" class="channel-logo">
        <div class="channel-info">
          <div class="channel-name">${channel.name}</div>
          <div class="channel-category">${channel.category}</div>
        </div>
        <button class="favorite-btn active" data-id="${channel.id}">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    `).join('');

    this.addFavoriteCardListeners();
  }

  addFavoriteCardListeners() {
    const favoriteCards = this.favoritesList.querySelectorAll('.favorite-channel-card');
    favoriteCards.forEach(card => {
      const channelId = parseInt(card.dataset.id);
      const favoriteBtn = card.querySelector('.favorite-btn');

      card.addEventListener('click', (e) => {
        if (!e.target.closest('.favorite-btn')) {
          this.playChannel(channelId);
        }
      });

      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const card = e.target.closest('.favorite-channel-card');
        card.classList.add('removing');
        await new Promise(resolve => setTimeout(resolve, 300));
        this.toggleFavorite(channelId);
      });
    });
  }

  encryptUrl(url) {
    const encrypted = CryptoJS.AES.encrypt(url, this.key, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }

  decryptUrl(encryptedUrl) {
    const decrypted = CryptoJS.AES.decrypt(encryptedUrl, this.key, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TVApp();
});