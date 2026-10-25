// Saat saat günlük rotalar.
//
// Her gün coğrafyaya göre kurulmuştur: aynı bölgedeki duraklar aynı güne
// toplanır, yol kaybı en aza iner. Saatler gerçek açılış saatlerine, bilet
// seans mantığına ve yürüme mesafelerine göre verilmiştir — kalabalık ve
// sıcak, programı en çok bozan iki şeydir, o yüzden ağır duraklar sabaha alınır.
//
// Blok biçimi: [saat, başlık, açıklama]

export const ROTALAR = {
  // ===================== ROMA =============================================
  roma: [
    {
      gun: 1, baslik: "Antik Roma", tema: "İmparatorluk merkezinde tam gün",
      bloklar: [
        ["08:30", "Kolosyum — ilk seans", "Bilet 30 gün önce ticketing.colosseo.it'ten. Sesli rehber al; arena katı ek ücretli ama değer."],
        ["10:30", "Roma Forumu", "Aynı biletle giriliyor. Via Sacra boyunca yürü; Septimius Severus Takı'nda dur."],
        ["12:00", "Palatine Tepesi", "Forumun üstü; imparator sarayları ve forumun en iyi fotoğraf açısı."],
        ["13:30", "Öğle — Monti mahallesi", "Kolosyum'un hemen kuzeyi. Meydandaki değil, Via Urbana'daki yerler."],
        ["15:30", "Capitoline Meydanı ve müzeleri", "Michelangelo'nun tasarladığı meydan; müze 16 €, Marcus Aurelius heykeli içeride."],
        ["17:30", "Vittoriano terası", "Asansörle çıkış 12 €; Forum'u yukarıdan gören tek nokta."],
        ["20:00", "Akşam — Trastevere", "Nehrin karşı yakası. Kalabalık ama gerçek; cacio e pepe için doğru mahalle."],
      ],
      ipucu: "Bugün 12–14 km yürüyeceksin. Forum'da gölge yok — şapka ve 1,5 litre su. Nasone denen sokak çeşmelerinden su içebilirsin, temizdir.",
    },
    {
      gun: 2, baslik: "Vatikan", tema: "Sabah müze, akşam manzara",
      bloklar: [
        ["08:00", "Vatikan Müzeleri — ilk seans", "Kalabalığın yarısı. Pinacoteca'yı atla, doğruca Raffaello Odaları'na git."],
        ["10:30", "Sistine Şapeli", "Fotoğraf yasak, sessizlik isteniyor. Oturacak sıralar duvar kenarında."],
        ["11:30", "Aziz Petrus Bazilikası", "Turlu grupların iç kapısı varsa oradan; bireyselsen meydandan dolaş. Giriş ücretsiz."],
        ["13:00", "Kubbe çıkışı", "551 basamak (asansörle 320). Kubbe içinden bazilikaya bakış tek başına değer."],
        ["14:30", "Öğle — Prati", "Vatikan'ın kuzeyi; turist fiyatlarından çıkmak için iki sokak yeter."],
        ["16:30", "Castel Sant'Angelo", "Hadrian'ın mozolesi; rampalı iç geçit ve çatı terası."],
        ["18:30", "Ponte Sant'Angelo'da gün batımı", "Bernini melekleri ve arkada Aziz Petrus kubbesi — Roma'nın en iyi karesi."],
      ],
      ipucu: "Omuz ve diz kapalı olmalı; şort veya askılıyla bazilikaya alınmıyorsun. Çantada bir şal bulundur.",
    },
    {
      gun: 3, baslik: "Barok merkez", tema: "Bilet yükü hafif, yürüyüş keyifli",
      bloklar: [
        ["09:00", "Pantheon", "5 €. Sabah ışığı oculustan içeri düşüyor; en iyi saat."],
        ["10:00", "Navona Meydanı", "Bernini'nin Dört Nehir Çeşmesi. Meydan kenarındaki kahveler pahalı, bir sokak içeri gir."],
        ["11:00", "Campo de' Fiori pazarı", "Öğlene kadar açık; baharat ve kuru domates almak için doğru yer."],
        ["12:30", "Öğle — Yahudi Mahallesi (Ghetto)", "Carciofi alla giudia (enginar) burada yenir; Roma'nın en özgün mutfağı."],
        ["15:00", "Borghese Galerisi", "Zorunlu randevu, 2 saatlik seans. Bernini'nin Apollo ve Daphne'si."],
        ["17:00", "Villa Borghese parkı", "Galeri çıkışı park içinde; Pincio terasından Piazza del Popolo manzarası."],
        ["19:00", "Trevi + İspanyol Merdivenleri", "Akşam ışıklandırması gündüzden iyi; Trevi'ye 07:00'de bir kez daha uğramaya değer."],
      ],
      ipucu: "Borghese randevusunu seyahatten önce al — günlük kontenjan sınırlı ve haftalar öncesinden doluyor.",
    },
    {
      gun: 4, baslik: "Ostia Antica ve yerel Roma", tema: "Kalabalıktan çıkış günü",
      bloklar: [
        ["08:30", "Metro + tren ile Ostia Antica", "Piramide'den Roma-Lido hattı; 40 dakika, normal metro bileti geçerli."],
        ["09:30", "Ostia Antica antik kenti", "18 €. Tiyatro, hamamlar, mozaikli meydan. Pompeii kadar iyi, onda biri kadar kalabalık."],
        ["13:00", "Öğle — Testaccio pazarı", "Roma'nın gerçek yemek mahallesi; Mordi e Vai'de panino."],
        ["15:00", "Aventine Tepesi ve Anahtar Deliği", "Malta Şövalyeleri kapısının deliğinden Aziz Petrus kubbesi görünür — ücretsiz ve şaşırtıcı."],
        ["16:30", "Portakal Bahçesi (Giardino degli Aranci)", "Şehrin en sakin manzara terası."],
        ["18:00", "Santa Maria in Cosmedin — Gerçeğin Ağzı", "Kısa kuyruk, ücretsiz; filmden tanıdık taş yüz."],
        ["20:00", "Akşam — Testaccio", "Turistin uğramadığı mahalle mutfağı; Flavio al Velavevodetto gibi klasikler."],
      ],
      ipucu: "Ostia'ya gidemiyorsan Appia Antica'da bisiklet kirala — Pazar günleri yola araç girişi kapalı.",
    },
    {
      gun: 5, baslik: "Boşluk günü ve dönüş", tema: "Doldurma, tamamla",
      bloklar: [
        ["09:00", "Kalan bir müze ya da kilise", "San Clemente (üç katlı: kilise–kilise–Mithras tapınağı) ya da Palazzo Barberini."],
        ["11:30", "Via del Corso alışveriş", "Via Condotti lüks, Via del Corso daha makul."],
        ["13:00", "Son öğle yemeği", "Beğendiğin bir yere dön; yeni bir yer denemek için yanlış gün."],
        ["15:00", "Otele dönüş ve valiz", "Çoğu otel çıkış sonrası bagaj saklıyor."],
        ["17:00", "Havalimanına hareket", "Leonardo Express Termini'den 32 dakika, 14 €. Uçuştan 3 saat önce yola çık."],
      ],
      ipucu: "Son günü yeni bir bölgeye koşmakla doldurma. Beğendiğin bir yere dönmek, görmediğin bir yere yetişmekten iyi hatıra bırakıyor.",
    },
  ],

  // ===================== FLORANSA =========================================
  floransa: [
    {
      gun: 1, baslik: "Rönesans merkezi", tema: "Duomo ve çevresi",
      bloklar: [
        ["08:30", "Duomo kubbesi tırmanışı", "Brunelleschi Pass, saatli giriş. 463 basamak, asansör yok, dar geçitler var."],
        ["10:00", "Vaftizhane ve Giotto Çan Kulesi", "Aynı pasa dahil. Cennet Kapısı'nın orijinali müzede."],
        ["11:30", "Duomo Müzesi", "Michelangelo'nun Pietà'sı ve kapıların orijinalleri burada."],
        ["13:00", "Öğle — Mercato Centrale üst kat", "Yemek katı; her tezgâh ayrı mutfak, fiyatlar makul."],
        ["15:00", "Piazza della Signoria + Loggia", "Açık hava heykel galerisi, ücretsiz. Davut'un kopyası burada."],
        ["16:30", "Ponte Vecchio", "Kuyumcu köprüsü; üstündeki Vasari Koridoru ayrı biletli."],
        ["18:30", "Piazzale Michelangelo'da gün batımı", "Yürüyerek 25 dakika yokuş ya da 12 numaralı otobüs. Klasik kartpostal manzarası."],
      ],
      ipucu: "Kubbe tırmanışını güne ilk iş koy; öğleden sonra hem kuyruk hem sıcak hem de içerisi havasız.",
    },
    {
      gun: 2, baslik: "Müze günü", tema: "Uffizi ve Accademia",
      bloklar: [
        ["08:15", "Uffizi — ilk seans", "Randevu şart. Botticelli salonuna (10–14) doğrudan git, sonra geri dön."],
        ["11:30", "Arno kıyısı molası", "Uffizi çıkışı nehir kenarı; kahve ve nefes."],
        ["12:30", "Öğle — Oltrarno", "Nehrin güneyi; turist yoğunluğu yarıya iniyor, fiyatlar da."],
        ["14:30", "Accademia — Davut", "16 €, randevulu. 45 dakikada çıkarsın; müzik aletleri bölümü bonus."],
        ["16:00", "San Lorenzo ve Medici Şapelleri", "Michelangelo'nun Yeni Sakristi'si; az bilinir, çok etkileyici."],
        ["17:30", "Santo Spirito meydanı", "Oltrarno'nun kalbi; akşamüstü yerel halkın toplandığı meydan."],
        ["20:00", "Akşam — bistecca", "Trattoria Sostanza ya da Il Latini. Rezervasyon şart."],
      ],
      ipucu: "İki büyük müzeyi aynı güne koymak yorucu ama randevu sistemi çoğu zaman buna zorluyor. Aralarına uzun bir öğle molası koy.",
    },
    {
      gun: 3, baslik: "Toskana", tema: "Chianti ve ortaçağ kasabaları",
      bloklar: [
        ["08:30", "Tur buluşması", "San Gimignano + Chianti turu merkez meydandan kalkar; 85 € civarı."],
        ["10:00", "San Gimignano", "'Ortaçağın Manhattan'ı'; 14 kule ayakta. Dünya şampiyonu dondurmacı meydanda."],
        ["12:30", "Chianti bağında tadım + öğle", "Qvevri değil, Sangiovese. 3–4 şarap + zeytinyağı tadımı."],
        ["15:30", "Greve in Chianti", "Küçük meydan, kasap-şarküteri Antica Macelleria Falorni."],
        ["18:00", "Floransa'ya dönüş", "Yol üstünde bağların arasından gün batımı."],
        ["20:30", "Son akşam — Santa Croce çevresi", "Dante'nin mezarı burada; meydan akşamları canlı."],
      ],
      ipucu: "Tadım varsa araç kiralamak yerine turu seç — Toskana'da alkol kontrolü ciddidir ve ceza ağır.",
    },
  ],

  // ===================== VENEDİK ==========================================
  venedik: [
    {
      gun: 1, baslik: "San Marco ve çevresi", tema: "Klasik Venedik",
      bloklar: [
        ["08:00", "San Marco Meydanı — boşken", "Günün tek sakin saati. Kahve içmeden sadece yürü."],
        ["09:00", "San Marco Bazilikası", "Randevulu 6 €. Pala d'Oro ve teras ayrı ücretli; teras meydanı yukarıdan gösteriyor."],
        ["10:30", "Doge Sarayı", "30 €. Gizli Geçitler turu ayrı ve çok daha ilginç; Ah Köprüsü'nden hapishaneye geçiş."],
        ["13:00", "Öğle — cicchetti turu", "Venedik tapası. Cantina Do Mori ya da All'Arco; ayakta, ucuz, gerçek."],
        ["15:00", "Campanile", "12 €, asansörlü. Lagünün tamamı ve Dolomitler açık havada görünür."],
        ["16:30", "Rialto Köprüsü ve pazar", "Balık pazarı öğleden sonra kapalı ama köprü ve çevresi canlı."],
        ["19:00", "Gün batımı — Zattere rıhtımı", "Turist akışının dışında, Giudecca kanalına bakan uzun rıhtım."],
      ],
      ipucu: "Günübirlikçi kalabalığı 10:00–17:00 arası. Konaklıyorsan sabahın ilk ve akşamın son iki saati senin.",
    },
    {
      gun: 2, baslik: "Lagün adaları", tema: "Renk, cam ve sessizlik",
      bloklar: [
        ["08:30", "Vaporetto ile Murano", "Günlük kart al (25 €); tek biletle gitmek pahalıya geliyor."],
        ["09:30", "Murano cam atölyesi", "Ücretsiz gösterimler var; satın alma baskısına kapılma."],
        ["11:30", "Burano", "Renkli evler ve dantel. Murano'dan 40 dakika; adanın en fotojenik yeri."],
        ["13:30", "Öğle — Burano'da risotto de gò", "Lagün balığıyla yapılan yerel risotto."],
        ["15:30", "Torcello", "Burano'dan 5 dakika. Lagünün ilk yerleşimi; 7. yüzyıl bazilikası ve mozaikleri."],
        ["18:00", "Venedik'e dönüş", "Fondamente Nove'ye iniş; Cannaregio üzerinden yürüyerek dön."],
        ["20:00", "Akşam — Cannaregio", "Yahudi Gettosu çevresi; turistin en az olduğu akşam bölgesi."],
      ],
      ipucu: "Gondola bineceksen akşam 19:00 sonrası tarifesi 110 € (tekne başına, 5 kişiye kadar). Kalabalık azaldığı için keyfi de daha yüksek.",
    },
  ],

  // ===================== PARİS ============================================
  paris: [
    {
      gun: 1, baslik: "Klasik Paris", tema: "Eyfel ve Seine ekseni",
      bloklar: [
        ["09:00", "Trocadéro", "Eyfel'in en iyi fotoğraf açısı; sabah ışığı ve boş meydan."],
        ["10:00", "Eyfel Kulesi — 2. kat", "Bileti tam 60 gün önce, satışa açıldığı gün al. Merdivenle çıkış 14 € ve kuyruksuz."],
        ["12:30", "Öğle — Rue Cler", "Kule çevresinden iki sokak uzak; fırın, peynirci, kafeler."],
        ["14:30", "Seine nehir turu", "Bateaux Mouches ya da Vedettes; 1 saat, 15 €. Şehri oturarak görmenin en iyi yolu."],
        ["16:00", "Champs-Élysées yürüyüşü", "Concorde'dan Zafer Takı'na 2 km."],
        ["18:00", "Zafer Takı terası", "16 €. Gün batımında on iki bulvarın yıldızı ve uzakta Eyfel."],
        ["21:00", "Eyfel ışık gösterisi", "Her saat başı 5 dakika; Champ de Mars çimlerinden izlenir."],
      ],
      ipucu: "Zafer Takı'na yer altı geçidinden girilir; meydandan karşıya yürümeye çalışma, trafik gerçekten tehlikeli.",
    },
    {
      gun: 2, baslik: "Louvre ve Tuileries", tema: "Sanat ekseni",
      bloklar: [
        ["09:00", "Louvre — randevulu giriş", "32 € (AB dışı). Üç şey hedefle: Mona Lisa, Samothrake Nike'si, Hammurabi."],
        ["12:30", "Tuileries Bahçesi", "Müzeden çıkıp sandalyelerde oturmak için; havuz kenarı ücretsiz."],
        ["13:30", "Öğle — Rue Saint-Honoré çevresi", "Bistro öğle menüsü 18–25 €."],
        ["15:00", "Orangerie — Nilüferler", "12,5 €. İki oval salon, Monet'nin panoramaları. 1,5 saat yeter."],
        ["16:30", "Palais Royal bahçeleri", "Ücretsiz; Buren sütunları ve sessiz revaklar."],
        ["18:00", "Le Marais yürüyüşü", "Place des Vosges, dar sokaklar, falafel kuyruğu (L'As du Fallafel)."],
        ["20:30", "Akşam — Marais ya da Bastille", "Şehrin en canlı akşam bölgeleri."],
      ],
      ipucu: "Louvre'da 'hepsini görme' niyetini baştan bırak. Bir kanat seç, orayı gerçekten gez; gerisi kalabalıkta kaybolur.",
    },
    {
      gun: 3, baslik: "Versailles", tema: "Tam günlük saray",
      bloklar: [
        ["08:00", "RER C ile Versailles", "45 dakika. Passport bileti 35 € (AB dışı); online al."],
        ["09:00", "Saray — açılışta", "Aynalı Salon'a doğrudan git; 10:30'dan sonra omuz omuza oluyor."],
        ["11:30", "Bahçeler", "Fıskiye gösterisi olan günler ayrı ücretli; gösteri varsa programı sor."],
        ["13:00", "Öğle — Grand Canal kenarı", "Angelina'nın şubesi ya da kanal kenarı sandviç; yanında kayık kiralama var."],
        ["14:30", "Trianon sarayları + Marie Antoinette köyü", "Çoğu ziyaretçinin atladığı bölüm; en keyifli kısmı burası."],
        ["17:00", "Paris'e dönüş", "Dönüş treninde akşam yemeği planını netleştir."],
        ["20:00", "Akşam — Saint-Germain", "Café de Flore klasiktir ama pahalı; arka sokaklar daha iyi."],
      ],
      ipucu: "Bahçeler çok büyük: uçtan uca 3 km. Küçük tren (8,5 €) ya da bisiklet kiralama (9 €/saat) ayağını kurtarır.",
    },
    {
      gun: 4, baslik: "Adalar ve sanat", tema: "Yürüyerek geçen gün",
      bloklar: [
        ["09:30", "Orsay Müzesi", "16 €. İzlenimciler 5. katta; önce yukarı çık, sonra aşağı in."],
        ["12:30", "Öğle — Saint-Germain", "Müzeden 10 dakika; bistro öğle menüleri burada iyi."],
        ["14:00", "Sainte-Chapelle", "13 €. Güneşliyse vitraylar için en iyi saat öğleden sonra."],
        ["15:30", "Conciergerie", "Marie Antoinette'in hapishanesi; Sainte-Chapelle ile kombine bilet 20 €."],
        ["16:30", "Notre-Dame", "Ücretsiz; online randevu kuyruğu atlatıyor. Restorasyon sonrası iç mekân çok parlak."],
        ["18:00", "Île Saint-Louis", "Berthillon dondurması; adanın tamamı 20 dakikada yürünüyor."],
        ["20:00", "Akşam — Latin Mahallesi", "Rue Mouffetard; öğrenci bölgesi, fiyatlar insaflı."],
      ],
      ipucu: "Bugün hiç metroya binmeden geçebilir. Paris'i anlamanın en iyi yolu, iki müze arasını yürümek.",
    },
    {
      gun: 5, baslik: "Montmartre ve dönüş", tema: "Tepeden veda",
      bloklar: [
        ["09:00", "Montmartre — Sacré-Cœur", "Bazilika ücretsiz; kubbe 8 €, 300 basamak ve şehrin en geniş manzarası."],
        ["10:30", "Place du Tertre ve sokaklar", "Ressamlar meydanı turistik; arka sokaklar (Rue de l'Abreuvoir) asıl Montmartre."],
        ["12:00", "Öğle — Abbesses çevresi", "Meydandan iner inmez fiyatlar normale dönüyor."],
        ["14:00", "Galeries Lafayette çatı terası", "Ücretsiz ve şehrin en iyi bedava manzarası; kubbeli iç avlu da görülür."],
        ["15:30", "Son alışveriş", "Boulevard Haussmann; KDV iadesi için fişleri sakla (vergi iadesi havalimanında)."],
        ["17:30", "Havalimanına hareket", "RER B ile CDG 50 dakika; yoğun saatte 1,5 saat pay bırak."],
      ],
      ipucu: "KDV iadesi (%12 civarı) 100 € üstü alışverişlerde geçerli; pasaport ve fişleri yanında bulundur, kioskta işlem 10 dakika.",
    },
  ],

  // ===================== BARSELONA ========================================
  barselona: [
    {
      gun: 1, baslik: "Gaudí günü", tema: "Üç başyapıt, yürüme mesafesi",
      bloklar: [
        ["09:00", "Sagrada Família — ilk seans", "26 €. Sabah ışığı doğu cephesinden mavi-yeşil, akşam batıdan turuncu girer."],
        ["11:00", "Kule çıkışı (biletliyse)", "Asansörle çık, merdivenle in; dar spiral, klostrofobi uyarısı var."],
        ["12:30", "Öğle — Eixample", "Sagrada çevresi turistik; iki blok batıya git."],
        ["14:30", "Casa Batlló", "29 €. Gaudí'nin en teatral yapısı; artırılmış gerçeklik rehberi dahil."],
        ["16:30", "La Pedrera (Casa Milà)", "28 €. Çatı bacaları için gidilir; çatı 17:00 ışığında en iyi."],
        ["18:30", "Passeig de Gràcia", "Modernist cephe hattı; vitrin gezintisi ücretsiz."],
        ["21:00", "Akşam — tapas", "İspanyol saatiyle akşam yemeği 21:00'de başlar. Quimet & Quimet ya da Bar del Pla."],
      ],
      ipucu: "Sagrada Família biletini aylar öncesinden al. 2026 yüzüncü yıl nedeniyle talep rekor seviyede ve gişede bilet yok.",
    },
    {
      gun: 2, baslik: "Park Güell ve Gràcia", tema: "Tepe, mahalle, manzara",
      bloklar: [
        ["09:00", "Park Güell — saatli giriş", "18 €. Geç kalırsan bilet yanar; metro Lesseps'ten 15 dakika yokuş."],
        ["11:00", "Parkın ücretsiz bölümü", "Biletli alan küçük; parkın geri kalanı ücretsiz ve manzaralı."],
        ["12:30", "Gràcia mahallesi", "Küçük meydanlar, bağımsız dükkânlar; Barselona'nın en yaşanır bölgesi."],
        ["14:00", "Öğle — Plaça del Sol çevresi", "Meydan kenarı, turist fiyatı yok."],
        ["16:00", "Mola / siesta", "Şehir gerçekten yavaşlıyor; direnme, otele dön."],
        ["18:30", "Bunkers del Carmel", "Ücretsiz. İç savaştan kalma uçaksavar mevzileri; şehrin en iyi panoraması."],
        ["21:30", "Akşam — Gràcia", "Mahallenin meydanları akşam dolup taşıyor."],
      ],
      ipucu: "Bunkers'a gün batımından 1 saat önce çık; son 10 dakika dik yokuş, ayakkabı önemli. Yanına bir şey götürmek serbest.",
    },
    {
      gun: 3, baslik: "Eski şehir ve deniz", tema: "Gotik, Born, sahil",
      bloklar: [
        ["09:30", "Gotik Mahalle", "Katedral meydanından başla; Carrer del Bisbe köprüsü en fotojenik nokta."],
        ["11:00", "Barselona Katedrali", "9 €; çatıya çıkılabiliyor. Avlusunda 13 kaz var, efsanesi anlatılıyor."],
        ["12:30", "Born mahallesi + Santa Maria del Mar", "Katalan gotiğinin en saf örneği; giriş ücretsiz."],
        ["13:30", "Öğle — Mercat del Born çevresi", "Pazar binası artık arkeolojik alan; çevresi yemek için iyi."],
        ["15:30", "Picasso Müzesi", "15 €. Erken dönem işleri; 'Las Meninas' serisi en ilginç bölüm."],
        ["17:30", "Barceloneta sahili", "Metroyla 10 dakika; ayakları denize sokmak için."],
        ["21:00", "Akşam — Barceloneta", "Deniz ürünleri; Can Solé ya da La Cova Fumada (nakit)."],
      ],
      ipucu: "Las Ramblas'ta yemek yeme. İki sokak içerisi hem yarı fiyat hem gerçek. Ramblas'ta yankesicilik yoğunluğu en yüksek.",
    },
    {
      gun: 4, baslik: "Montjuïc ve kapanış", tema: "Tepe, sanat, veda",
      bloklar: [
        ["09:30", "Montjuïc teleferiği", "14 €. Limanı ve şehri yukarıdan görerek çıkış."],
        ["10:30", "Montjuïc Kalesi", "9 €. Surlardan 360° manzara; iç avlu ücretsiz."],
        ["12:00", "Joan Miró Vakfı", "14 €. Beyaz, ışıklı bir müze; Miró sevmesen de mimarisi iyi."],
        ["13:30", "Öğle — Poble Sec", "Carrer Blai tapas sokağı; pintxo 2–3 €."],
        ["15:30", "Son alışveriş", "Passeig de Gràcia ya da El Corte Inglés; KDV iadesi için fiş sakla."],
        ["17:30", "Havalimanına hareket", "Aerobús 7,25 € ve 35 dakika; taksinin yarı fiyatı."],
      ],
      ipucu: "Akşam uçuşun varsa Sihirli Çeşme gösterisini (Perş–Paz akşamları, ücretsiz) programa ekle; Montjuïc eteğinde.",
    },
  ],

  // ===================== MADRİD ===========================================
  madrid: [
    {
      gun: 1, baslik: "Sanat üçgeni", tema: "Üç müze, bir kilometre",
      bloklar: [
        ["09:30", "Prado Müzesi", "15 €. Velázquez (Las Meninas) ve Goya'nın Kara Resimleri'ni hedefle."],
        ["12:30", "Öğle — Retiro kenarı", "Müzeden parka 5 dakika; park kenarı terasları."],
        ["14:00", "Retiro Parkı", "Ücretsiz. Cristal Sarayı ve gölde kayık (6 €)."],
        ["16:00", "Reina Sofía — Guernica", "12 €. Picasso'nun Guernica'sı tek başına gitmeye değer."],
        ["18:00", "Thyssen-Bornemisza", "14 €. Üçgenin en çeşitli ve en az kalabalık müzesi."],
        ["21:00", "Akşam — La Latina", "Cava Baja sokağı; tapas barı sırası."],
      ],
      ipucu: "Üçünü de gezeceksen 'Paseo del Arte' kombine bileti 32 € — tek tek 41 € tutuyor. Prado 18:00 sonrası ücretsiz ama kuyruk 1 saat.",
    },
    {
      gun: 2, baslik: "Kraliyet Madrid", tema: "Saray, meydan, pazar",
      bloklar: [
        ["09:30", "Kraliyet Sarayı", "14 €. Avrupa'nın en büyük işlevsel sarayı; 3.400 oda, 50'si gezilebiliyor."],
        ["12:00", "Almudena Katedrali", "Ücretsiz; sarayın karşısında, modern iç tasarımı şaşırtıcı."],
        ["13:00", "Mercado de San Miguel", "Tapas 3–6 €. Turistik ama kalite yüksek; öğle için ideal."],
        ["14:30", "Plaza Mayor", "Ücretsiz. Meydandaki restoranlardan uzak dur; sadece geçerek gör."],
        ["16:00", "Mola — San Ginés çikolata ve churros", "1894'ten beri aynı yerde; 24 saat açık."],
        ["18:00", "Gran Vía yürüyüşü", "Madrid'in Broadway'i; Schweppes binası gün batımında."],
        ["21:30", "Akşam — Malasaña", "Genç ve bağımsız; şehrin en iyi bar bölgesi."],
      ],
      ipucu: "Nöbet değişimi Çarşamba ve Cumartesi 11:00; büyük tören ayın ilk Çarşambası. Görmek istiyorsan günü ona göre seç.",
    },
    {
      gun: 3, baslik: "Toledo", tema: "Günübirlik UNESCO",
      bloklar: [
        ["08:30", "AVE ile Toledo", "33 dakika, 14 €. Atocha'dan kalkar; biletini önceden al."],
        ["09:30", "Toledo Katedrali", "12 €. İspanya'nın en zengin katedrali; El Greco'nun Soyulma'sı sakristide."],
        ["11:30", "Alcázar + Ordu Müzesi", "5 €. Tepedeki kale; şehrin tamamı görünür."],
        ["13:00", "Öğle — eski şehir", "Carcamusas (yerel yahni) dene; meydan dışı yerler yarı fiyat."],
        ["15:00", "Santo Tomé — Orgaz Kontu'nun Gömülmesi", "4 €. El Greco'nun başyapıtı yerinde duruyor."],
        ["16:30", "Yahudi Mahallesi + Sinagoglar", "Tránsito ve Santa María la Blanca; üç dinin iç içe olduğu dönemin izleri."],
        ["18:30", "Mirador del Valle", "Otobüsle karşı tepe; Toledo'nun klasik panoraması."],
        ["20:30", "Madrid'e dönüş", "Son AVE 21:25; kaçırma."],
      ],
      ipucu: "Toledo dik ve taş döşeli; rahat ayakkabı şart. Şehir merkezine yürüyen merdiven sistemi var, tren garından otobüsle çık.",
    },
  ],

  // ===================== SEVİLLA ==========================================
  sevilla: [
    {
      gun: 1, baslik: "Alcázar ve Katedral", tema: "Endülüs'ün iki yüzü",
      bloklar: [
        ["09:00", "Real Alcázar", "15,5 €. Online randevu şart. Mudéjar sarayı ve bahçeleri; 2,5 saat ayır."],
        ["12:00", "Sevilla Katedrali + Giralda", "12 €. Dünyanın en büyük gotik katedrali; Kolomb'un mezarı içeride."],
        ["13:30", "Giralda'ya çıkış", "Merdiven yok, rampa var (atla çıkılırmış). Şehrin en merkezî manzarası."],
        ["14:30", "Öğle — Barrio Santa Cruz", "Eski Yahudi mahallesi; dar sokaklar, portakal ağaçları."],
        ["17:00", "Mola — siesta", "Sevilla'da öğleden sonra şehir gerçekten duruyor; direnme."],
        ["19:00", "Plaza de España", "Ücretsiz. Gün batımı ışığında seramik kemerler en iyi halinde."],
        ["21:30", "Akşam — tapas turu", "El Rinconcillo (1670'ten beri) ve Bodeguita Romero."],
      ],
      ipucu: "Alcázar ve Katedral biletlerini aynı güne koymak yoğun ama ikisi yan yana. Alcázar'ı sabah, katedrali öğleden önce bitir.",
    },
    {
      gun: 2, baslik: "Triana ve flamenko", tema: "Nehrin karşı yakası",
      bloklar: [
        ["10:00", "Metropol Parasol (Setas)", "15 €. Dünyanın en büyük ahşap yapısı; teras yürüyüşü ve altında Roma kalıntıları."],
        ["11:30", "Alameda de Hércules", "Şehrin en eski halka açık bahçesi; kahvaltı sonrası kahve için iyi."],
        ["13:00", "Triana Köprüsü ve pazarı", "Mercado de Triana; seramik ve deniz ürünleri."],
        ["14:00", "Öğle — Triana", "Nehre bakan teraslar; Las Golondrinas klasiktir."],
        ["17:00", "Triana sokakları ve seramik atölyeleri", "Calle Alfarería; azulejo geleneği hâlâ yaşıyor."],
        ["19:00", "Torre del Oro + nehir kenarı", "3 €. Altın Kule; nehir boyunca yürüyüş."],
        ["21:00", "Flamenko — tablao", "25 €. Casa de la Memoria ya da La Casa del Flamenco; küçük salon, gerçek icra."],
      ],
      ipucu: "Flamenkoyu yemekli büyük salonlarda değil, 40 kişilik tablao'larda izle. Fark, gösteriyle sanat arasındaki fark kadar.",
    },
    {
      gun: 3, baslik: "Córdoba", tema: "Günübirlik Mezquita",
      bloklar: [
        ["08:30", "AVE ile Córdoba", "45 dakika, 13 €."],
        ["09:30", "Mezquita-Katedral", "13 €. 08:30–09:30 arası ücretsiz giriş var ama fotoğraf zor; 09:30 sonrası daha rahat."],
        ["12:00", "Yahudi Mahallesi + Sinagog", "Dar beyaz sokaklar; Calleja de las Flores en fotojenik."],
        ["13:30", "Öğle — salmorejo ve rabo de toro", "Córdoba'nın iki imza yemeği."],
        ["15:30", "Alcázar de los Reyes Cristianos", "5 €. Bahçeleri Sevilla'nınkinden daha düzenli."],
        ["17:30", "Roma Köprüsü ve Calahorra Kulesi", "Köprüden Mezquita'ya bakış; gün batımı için doğru yer."],
        ["19:30", "Sevilla'ya dönüş", "Akşam yemeği Sevilla'da."],
      ],
      ipucu: "Mayıs başındaki Patios Festivali'nde avlular halka açılıyor — gidebiliyorsan o haftayı seç, Córdoba'nın en güzel hali.",
    },
  ],

  // ===================== LİZBON ===========================================
  lizbon: [
    {
      gun: 1, baslik: "Alfama ve merkez", tema: "Tepeler ve tramvay",
      bloklar: [
        ["09:00", "Tramvay 28", "Martim Moniz'den bin; 08:00'den önce oturacak yer var, sonrası ayakta."],
        ["10:00", "São Jorge Kalesi", "15 €. Şehrin en kapsamlı manzarası; tavus kuşları surlarda."],
        ["12:00", "Alfama sokakları", "Ücretsiz. Kaybolmak planın kendisi; çamaşır ipleri ve fado sesleri."],
        ["13:30", "Öğle — Alfama", "Bacalhau (tuzlu morina) yerel yorumlarından biri."],
        ["15:30", "Miradouro das Portas do Sol", "Ücretsiz teras; Alfama çatılarına bakış."],
        ["17:00", "Baixa + Rossio + Comércio Meydanı", "1755 depreminden sonra ızgara planla yeniden kurulmuş merkez."],
        ["21:00", "Fado gecesi", "30 € (sadece gösteri). Alfama'da küçük bir casa de fado; yemekli programlar 50 €+."],
      ],
      ipucu: "Tepeleri hafife alma. Elevador da Bica ve Santa Justa asansörleri toplu taşıma kartıyla geçerli; bacaklarını kurtarır.",
    },
    {
      gun: 2, baslik: "Belém", tema: "Keşifler çağı",
      bloklar: [
        ["09:30", "Tramvay 15 ile Belém", "Merkeze 25 dakika; aynı kartla."],
        ["10:00", "Jerónimos Manastırı", "18 €. Manuel tarzının zirvesi; kilise kısmı ücretsiz, cloister biletli."],
        ["12:00", "Pastéis de Belém", "Orijinal pastel de nata 1837'den beri burada; ayakta içeride yemek daha hızlı."],
        ["13:00", "Keşifler Anıtı", "6 €, terasa çıkış. Zemindeki dünya haritası mozaiği."],
        ["14:00", "Belém Kulesi", "8 €. İçi küçük; dışarıdan görüp vakti manastıra ayırmak da mantıklı."],
        ["16:00", "MAAT ya da Berardo Koleksiyonu", "Modern sanat; MAAT'ın çatısı nehre bakıyor."],
        ["19:00", "Cais do Sodré — Time Out Market", "Şehrin en iyi 20 şefi tek çatı altında; akşam için pratik."],
      ],
      ipucu: "Belém'de her şey yürüme mesafesinde ama sıra uzun. Jerónimos ve Pastéis kuyruklarını sabah erken hallet.",
    },
    {
      gun: 3, baslik: "Sintra", tema: "Masal sarayları",
      bloklar: [
        ["08:30", "Rossio'dan Sintra treni", "40 dakika, 2,50 €. Hafta sonu çok kalabalık; mümkünse hafta içi."],
        ["09:30", "Pena Sarayı", "20 €, saatli bilet — geç kalırsan yanar. 434 otobüsü ya da 20 dakika yokuş."],
        ["11:30", "Mağribi Kalesi", "12 €. Pena'nın hemen altında; surlardan okyanus görünüyor."],
        ["13:00", "Öğle — Sintra merkezi", "Travesseiro (yastık hamuru tatlısı) Piriquita'da."],
        ["14:30", "Quinta da Regaleira", "15 €. Başlangıç Kuyusu ve yer altı tünelleri; Sintra'nın en sürpriz yeri."],
        ["17:00", "Cabo da Roca (opsiyonel)", "Avrupa'nın en batı noktası; otobüsle 40 dakika."],
        ["19:30", "Lizbon'a dönüş", "Akşam yemeği Bairro Alto'da."],
      ],
      ipucu: "Sintra'da üç yeri aynı güne sığdırmak yorucu. Pena + Regaleira ikilisi en iyi kombinasyon; kaleyi atlayabilirsin.",
    },
    {
      gun: 4, baslik: "Modern Lizbon ve veda", tema: "Tasarım ve okyanus",
      bloklar: [
        ["10:00", "LX Factory", "Ücretsiz. Eski fabrikadan dönüşen tasarım alanı; Ler Devagar kitapçısı."],
        ["12:00", "Miradouro de Santa Catarina", "Ücretsiz; nehir ve köprü manzarası."],
        ["13:00", "Öğle — Bairro Alto", "Gündüz sakin, gece şehrin bar merkezi."],
        ["15:00", "Cascais treni (opsiyonel)", "40 dakika; okyanus kıyısı kasabası ve Boca do Inferno."],
        ["18:00", "Son alışveriş — Chiado", "A Vida Portuguesa; geleneksel Portekiz ürünleri."],
        ["20:00", "Havalimanına hareket", "Metro kırmızı hat, 20 dakika. Havalimanı merkeze çok yakın."],
      ],
      ipucu: "Viva Viagem kartını yolculuk başına yükle: kartla tekli bilet 1,80 €, araçtan alınca 3,20 €. Fark 4 günde kartı amorti ediyor.",
    },
  ],

  // ===================== LONDRA ===========================================
  londra: [
    {
      gun: 1, baslik: "Westminster ve nehir", tema: "Politik Londra",
      bloklar: [
        ["09:00", "Big Ben + Parlamento", "Dışarıdan ücretsiz; Parlamento turu Cumartesi ve tatil dönemlerinde (£25)."],
        ["10:00", "Westminster Abbey", "£32. Sesli rehber dahil; Pazar ziyarete kapalı."],
        ["12:00", "Nöbet değişimi — Buckingham", "Her gün değil; takvimi önceden kontrol et. Victoria Anıtı'nda yer kap."],
        ["13:30", "Öğle — St James's / Soho", "Saray çevresi pahalı; 10 dakika kuzeye yürü."],
        ["15:00", "St James's Park + Horse Guards", "Ücretsiz; şehrin en güzel parkı ve pelikanları."],
        ["17:00", "Churchill War Rooms", "£32. II. Dünya Savaşı'nın yer altı karargâhı; olduğu gibi korunmuş."],
        ["19:30", "London Eye — gün batımı seansı", "£34. Online erken alırsan ~%25 ucuz."],
      ],
      ipucu: "Nöbet değişimi iptal olabiliyor (yağmur, tören). Gitmeden sabah royal.uk takvimine bak, boşa 1,5 saat harcamayasın.",
    },
    {
      gun: 2, baslik: "Tower ve doğu", tema: "Tarih ve pazar",
      bloklar: [
        ["09:00", "Tower of London — açılışta", "£37. Taç mücevherlerine ilk git; 10:30'dan sonra kuyruk 40 dakika."],
        ["12:00", "Tower Bridge", "Dışarıdan ücretsiz; cam zeminli geçit £13."],
        ["13:00", "Borough Market", "Öğle için şehrin en iyi yeri. Pazar kapalı, Pazartesi yarım gün."],
        ["15:00", "Shakespeare's Globe", "£27 tur; oyun varsa ayakta bilet £5."],
        ["16:30", "Tate Modern", "Ücretsiz. Eski elektrik santrali; 10. kat terası ücretsiz manzara."],
        ["18:30", "Millennium Bridge → St Paul's", "Yürüyerek; köprüden katedral manzarası klasiktir."],
        ["20:00", "Akşam — Shoreditch", "Doğu Londra; sokak sanatı ve en iyi kokteyl barları."],
      ],
      ipucu: "Borough Market'e 12:30'dan önce git. 13:00'ten sonra ofis çalışanları iniyor ve kuyruk üçe katlanıyor.",
    },
    {
      gun: 3, baslik: "Müzeler ve West End", tema: "Hepsi ücretsiz",
      bloklar: [
        ["10:00", "British Museum", "Ücretsiz. Rosetta Taşı, Partenon kabartmaları, Mısır mumyaları — üçünü hedefle."],
        ["13:00", "Öğle — Covent Garden", "Pazar binası ve sokak gösterileri; Seven Dials çevresi daha ucuz."],
        ["15:00", "National Gallery", "Ücretsiz. Van Gogh'un Ayçiçekleri ve Turner salonu."],
        ["16:30", "Trafalgar Meydanı + Soho", "Ücretsiz; Soho akşama doğru canlanıyor."],
        ["18:00", "Erken akşam yemeği", "Tiyatro öncesi 'pre-theatre menu' çoğu restoranda indirimli."],
        ["19:30", "West End müzikali", "£45'ten başlıyor. TodayTix ya da Leicester Square TKTS gişesinden son dakika yarı fiyat."],
      ],
      ipucu: "Müzeler ücretsiz ama girişte 'önerilen bağış' soruluyor — zorunlu değil. Çantan varsa güvenlik kuyruğu uzuyor, hafif gel.",
    },
    {
      gun: 4, baslik: "Notting Hill ve kapanış", tema: "Pazar ve park",
      bloklar: [
        ["09:30", "Portobello Road pazarı", "Asıl pazar günü Cumartesi; diğer günler sadece dükkânlar açık."],
        ["11:30", "Notting Hill sokakları", "Renkli cepheler; Lancaster Road ve Portobello'nun kuzeyi."],
        ["13:00", "Öğle — Westbourne Grove", "Mahallenin kendi restoranları; turist fiyatı yok."],
        ["14:30", "Hyde Park + Kensington Gardens", "Ücretsiz. Serpentine Gölü ve Kensington Sarayı dışı."],
        ["16:00", "Natural History / V&A", "Ücretsiz. V&A'nın avlusu ve kafesi tek başına gezmeye değer."],
        ["18:00", "Havalimanına hareket", "Heathrow'a Piccadilly hattı 50 dakika; Gatwick'e Victoria'dan ekspres 30 dakika."],
      ],
      ipucu: "Temassız kartla bin, Oyster alma. Günlük tavan aynı (£8,90 merkez bölgeler) ve kart depozitosu ödemiyorsun.",
    },
  ],

  // ===================== EDINBURGH ========================================
  edinburgh: [
    {
      gun: 1, baslik: "Eski Şehir", tema: "Kale ve Royal Mile",
      bloklar: [
        ["09:30", "Edinburgh Kalesi", "£22, online al. Taç Mücevherleri ve Kader Taşı; 13:00'teki top atışını kaçırma."],
        ["12:00", "Royal Mile yürüyüşü", "Ücretsiz. Kaleden Holyrood'a 1,6 km; yan sokaklara (close) mutlaka gir."],
        ["13:00", "Öğle — Grassmarket", "Royal Mile'ın bir alt kademesi; pub öğle menüleri uygun."],
        ["15:00", "St Giles Katedrali", "Giriş bağışla; Thistle Şapeli'nin ahşap işçiliği olağanüstü."],
        ["16:00", "Real Mary King's Close", "£22. 17. yüzyıldan kalma yer altı sokakları; veba dönemi anlatılıyor."],
        ["18:00", "Calton Hill", "Ücretsiz. Gün batımı için en iyi nokta; kaleyi karşıdan görürsün."],
        ["20:00", "Akşam — Grassmarket ya da Royal Mile pub'ı", "Canlı folk müzik çoğu pub'da ücretsiz."],
      ],
      ipucu: "Kale bileti saatli; geç kalırsan girişi reddedebiliyorlar. Online almak gişede 40 dakika kuyruk farkı demek.",
    },
    {
      gun: 2, baslik: "Arthur's Seat ve Yeni Şehir", tema: "Tırmanış ve Gürcü mimarisi",
      bloklar: [
        ["09:00", "Arthur's Seat tırmanışı", "Ücretsiz, 2,5 saat gidiş-dönüş. Holyrood Park'tan başla; orta zorlukta."],
        ["12:00", "Holyrood Sarayı", "£20. Kralın İskoçya ikametgâhı; Mary Stuart'ın odaları."],
        ["13:30", "Öğle — Canongate", "Sarayın hemen yukarısı."],
        ["15:00", "National Museum of Scotland", "Ücretsiz ve beklenenden çok iyi. Çatı terası şehri gösteriyor."],
        ["17:00", "Yeni Şehir — Princes Street & George Street", "UNESCO'nun diğer yarısı; Gürcü dönemi planlı şehir."],
        ["18:30", "Dean Village", "Ücretsiz. Şehrin içinde kalmış değirmen köyü; Water of Leith kıyısı."],
        ["20:30", "Akşam — Stockbridge", "Yerel halkın bölgesi; iyi restoranlar, turist yok."],
      ],
      ipucu: "Arthur's Seat rüzgârlı havada kaygan ve açıkta. Hava raporuna bak; yağmurlu günde Holyrood'dan başlama, Dunsapie'den kısa rotayı seç.",
    },
    {
      gun: 3, baslik: "Yaylalar", tema: "Tam günlük tur",
      bloklar: [
        ["08:00", "Tur kalkışı", "£65 civarı; 12 saatlik otobüs turu. Royal Mile'dan kalkıyor."],
        ["10:30", "Glencoe vadisi", "İskoçya'nın en çarpıcı manzarası; fotoğraf molaları."],
        ["12:30", "Fort William / Ben Nevis manzarası", "Britanya'nın en yüksek dağı; öğle molası."],
        ["14:30", "Loch Ness + Urquhart Kalesi", "Göl turu opsiyonel ek (£18); kale harabesi gölün kıyısında."],
        ["16:30", "Highland sığırları ve dönüş yolu", "Turların klasik fotoğraf durağı."],
        ["20:00", "Edinburgh'a dönüş", "Geç akşam yemeği; haggis denemek için son şans."],
      ],
      ipucu: "Tur uzun ve oturarak geçiyor. Alternatif: trenle Stirling (1 saat) — Stirling Kalesi ve Wallace Anıtı daha az yorucu bir gün.",
    },
  ],

  // ===================== PRAG =============================================
  prag: [
    {
      gun: 1, baslik: "Eski Şehir", tema: "Ortaçağ merkezi",
      bloklar: [
        ["08:00", "Charles Köprüsü — boşken", "Ücretsiz. 08:00'den sonra tur grupları geliyor; sabah ışığı da en iyisi."],
        ["09:00", "Eski Şehir Meydanı", "Astronomik Saat gösterisi her saat başı, 1 dakika ve açıkçası abartılı."],
        ["09:30", "Eski Belediye Kulesi", "350 Kč, asansörlü. Meydanın ve kırmızı çatıların en iyi görüntüsü."],
        ["11:00", "Tyn Kilisesi + Barut Kapısı", "Meydanın iki ucu; kule çıkışı ayrı biletli."],
        ["13:00", "Öğle — meydandan uzak", "Meydan çevresi üç kat pahalı. Lokál ya da U Medvídků."],
        ["15:00", "Yahudi Mahallesi (Josefov)", "600 Kč kombine bilet; altı sinagog + Eski Mezarlık. Cumartesi kapalı."],
        ["19:00", "Akşam — bira evi", "U Fleků (1499'dan beri) ya da Pivovarský dům; yarım litre 60–80 Kč."],
      ],
      ipucu: "Astronomik Saat gösterisi için 10 dakika önceden gelme — 1 dakika sürüyor ve meydanın her yerinden görülüyor.",
    },
    {
      gun: 2, baslik: "Kale bölgesi", tema: "Yukarı Prag",
      bloklar: [
        ["09:00", "Tramvay 22 ile kaleye", "Pražský hrad durağı; yürüyerek çıkmak 20 dakika rampa demek."],
        ["09:30", "Prag Kalesi — B rotası", "450 Kč. Aziz Vitus Katedrali, Eski Kraliyet Sarayı, Altın Sokak dahil."],
        ["12:00", "Aziz Vitus Katedrali detay", "Mucha'nın vitrayı ve Wenceslas Şapeli; güney kulesi ayrı 150 Kč."],
        ["13:30", "Öğle — Nerudova sokağı", "Kaleden aşağı inen cadde; yukarı kısım pahalı, aşağısı makul."],
        ["15:00", "Strahov Manastırı Kütüphanesi", "200 Kč. İki barok salon; içeri girilmiyor, kapıdan bakılıyor."],
        ["16:30", "Petřín Tepesi + kule", "250 Kč. Füniküler toplu taşıma biletiyle; mini Eyfel manzarası."],
        ["18:30", "Mala Strana'ya iniş + Lennon Duvarı", "Ücretsiz; Kampa adası üzerinden köprüye dönüş."],
      ],
      ipucu: "Kaleye tramvayla çık, yürüyerek in. Tersi 20 dakika dik yokuş ve günün geri kalanını mahvediyor.",
    },
    {
      gun: 3, baslik: "Sakin Prag", tema: "Vyšehrad ya da Kutná Hora",
      bloklar: [
        ["09:30", "Vyšehrad kalesi", "Ücretsiz. Turist akınından uzak; Slavín mezarlığında Dvořák ve Mucha yatıyor."],
        ["11:30", "Vyšehrad surlarından Vltava", "Prag'ın en huzurlu manzarası; kimse yok."],
        ["13:00", "Öğle — Náplavka rıhtımı", "Nehir kıyısı; Cumartesi çiftçi pazarı kuruluyor."],
        ["15:00", "Dans Eden Ev + Yeni Şehir", "Gehry'nin binası; içeri girilmiyor ama çatı barı var."],
        ["16:30", "Wenceslas Meydanı", "Meydan değil bulvar; 1989 Kadife Devrimi burada oldu."],
        ["18:00", "Havelská pazarı — son alışveriş", "Ahşap oyuncak ve Bohemya kristali; turistik ama fiyatlar makul."],
        ["20:00", "Son akşam — Vinohrady", "Yerel halkın bölgesi; turistik merkezin dışında iyi restoranlar."],
      ],
      ipucu: "Kemik Kilisesi'ni (Kutná Hora) görmek istiyorsan bugünü ona ayır: trenle 1 saat, online bilet zorunlu, yarım gün yeter.",
    },
  ],

  // ===================== BUDAPEŞTE ========================================
  budapeste: [
    {
      gun: 1, baslik: "Peşte yakası", tema: "Parlamento ve bulvarlar",
      bloklar: [
        ["09:00", "Parlamento turu", "10.900 Ft (AB dışı). Online randevu şart; Türkçe tur yok, İngilizce al."],
        ["10:30", "Kossuth Meydanı + Ayakkabılar Anıtı", "Ücretsiz. Tuna kıyısındaki demir ayakkabılar; sessiz ve çarpıcı."],
        ["12:00", "Aziz István Bazilikası + kubbe", "4.000 Ft. 360° panoramik teras; Macaristan'ın en büyük kilisesi."],
        ["13:30", "Öğle — Nagy Vásárcsarnok (Merkez Pazar)", "Üst katta lángos ve gulaş; turistik ama iyi."],
        ["15:30", "Andrássy Bulvarı + Opera", "UNESCO listesinde; Opera turu 3.900 Ft."],
        ["17:00", "Kahramanlar Meydanı + Városliget", "Ücretsiz. Macar tarihinin heykel galerisi."],
        ["19:00", "Széchenyi Kaplıcası — akşam seansı", "11.500 Ft. Akşam dış havuzda buharın içinde oturmak şehrin imzası."],
      ],
      ipucu: "Kaplıcaya havlu ve terlik götür; kiralama pahalı. Su geçirmez telefon kılıfı da işe yarıyor, dolap uzakta kalıyor.",
    },
    {
      gun: 2, baslik: "Buda yakası", tema: "Kale tepesi",
      bloklar: [
        ["09:30", "Füniküler ile Buda Kalesi", "5.000 Ft tek yön; yürüyerek de çıkılır (20 dakika)."],
        ["10:00", "Buda Kalesi + Macar Ulusal Galerisi", "Galeri 3.800 Ft; kale avlusu ücretsiz."],
        ["12:00", "Matyas Kilisesi", "2.500 Ft. Çatı kiremitleri ve iç dekorasyonu Avrupa'da benzersiz."],
        ["13:00", "Balık Kulesi (Halászbástya)", "Teras büyük ölçüde ücretsiz; sadece üst kısım biletli. Peşte'nin en iyi manzarası."],
        ["14:00", "Öğle — Kale mahallesi dışı", "Kale içi turist fiyatı; Batthyány tér'e in."],
        ["16:00", "Gellért Tepesi + Citadella", "Ücretsiz. Tırmanış 30 dakika; Özgürlük Heykeli ve tüm şehir."],
        ["20:00", "Tuna'da akşam tekne turu", "9.000 Ft. Işıklı Parlamento için akşam seansı; içecek dahil olanlar var."],
      ],
      ipucu: "Balık Kulesi'ne sabah 09:00'dan önce ya da akşam gidersen ücretsiz ve boş; gündüz hem biletli hem kalabalık.",
    },
    {
      gun: 3, baslik: "Harabe barlar ve Yahudi Mahallesi", tema: "Budapeşte'nin modern yüzü",
      bloklar: [
        ["10:00", "Büyük Sinagog (Dohány)", "9.000 Ft. Avrupa'nın en büyük sinagogu; müze ve anıt bahçe dahil."],
        ["12:00", "VII. Bölge sokak sanatı", "Ücretsiz. Yahudi Mahallesi duvarları şehrin açık hava galerisi."],
        ["13:00", "Öğle — Karaván sokak yemeği", "Szimpla yanında; lángos ve kürtőskalács."],
        ["15:00", "Rudas ya da Gellért Kaplıcası", "Rudas'ın Osmanlı kubbeli havuzu ve çatı jakuzisi (şehre bakıyor)."],
        ["18:00", "Mola ve hazırlık", "Harabe bar turu geç başlar; biraz dinlen."],
        ["21:00", "Szimpla Kert ve çevresi", "Giriş ücretsiz; bira 1.500–2.500 Ft. Terk edilmiş binada kurulmuş efsane."],
      ],
      ipucu: "Harabe barlar 21:00'den sonra doluyor. Szimpla en ünlüsü ama en turistiği; Instant-Fogas ve Mazel Tov daha iyi.",
    },
  ],

  // ===================== VİYANA ===========================================
  viyana: [
    {
      gun: 1, baslik: "İmparatorluk merkezi", tema: "Hofburg ve Ring",
      bloklar: [
        ["09:00", "Hofburg + Sisi Müzesi", "20 €. İmparatorluk daireleri, gümüş koleksiyonu ve Sisi'nin hikâyesi."],
        ["11:30", "İspanyol Binicilik Okulu", "Sabah antrenmanı 16 €; gösteri çok daha pahalı ama antrenman da keyifli."],
        ["13:00", "Öğle — Naschmarkt", "Pazar tezgâhları ve restoranlar; Cumartesi bit pazarı da kurulur."],
        ["15:00", "Aziz Stephan Katedrali", "Ana nef ücretsiz; güney kulesi 6 €, 343 basamak. Çatı kiremitleri simgesel."],
        ["16:30", "Kahvehane molası", "Café Central ya da Café Sperl. Kahve + Sachertorte; acele ettirilmiyorsun."],
        ["18:00", "Ring bulvarı tramvay turu", "1 ve 2 numaralı tramvaylar Ring'i dolaşıyor; normal biletle tur gibi."],
        ["20:00", "Akşam — Schnitzel", "Figlmüller'in schnitzel'i tabaktan taşıyor; rezervasyon şart."],
      ],
      ipucu: "Viyana'da kahvehane oturma hakkı kahve fiyatına dahildir. Garson acele ettirmez; gazete oku, saatlerce kal — kültürün kendisi bu.",
    },
    {
      gun: 2, baslik: "Schönbrunn ve Belvedere", tema: "İki saray",
      bloklar: [
        ["09:00", "Schönbrunn Sarayı — Grand Tour", "26 €, 40 oda. Saatli giriş; U4 metro ile 20 dakika."],
        ["11:00", "Bahçeler ve Gloriette", "Ücretsiz; Gloriette terası 5,2 €. Sarayı yukarıdan gören en iyi nokta."],
        ["13:00", "Öğle — Schönbrunn çevresi", "Saray kafeteryası pahalı; Hietzing tarafına geç."],
        ["15:00", "Belvedere — Üst Saray", "17 €. Klimt'in Öpücük'ü; salon genelde kalabalık ama sıra akıcı."],
        ["17:00", "Belvedere bahçeleri", "Ücretsiz; iki saray arasında barok bahçe düzeni."],
        ["19:00", "Akşam — Heuriger (şarap evi)", "Grinzing ya da Nussdorf; kendi üretimi şarap ve soğuk büfe."],
      ],
      ipucu: "Schönbrunn'un hayvanat bahçesi dünyanın en eskisi (1752) ve gerçekten iyi; çocukla geliyorsan yarım gün ayır.",
    },
    {
      gun: 3, baslik: "Müzeler ve müzik", tema: "Kültür günü",
      bloklar: [
        ["10:00", "Kunsthistorisches Museum", "21 €. Bruegel koleksiyonu dünyanın en büyüğü; kubbe altı kafe güzel."],
        ["13:00", "Öğle — MuseumsQuartier", "Avlu oturma alanları; yazın şehrin buluşma noktası."],
        ["14:30", "Leopold Museum (Schiele)", "17 €. Egon Schiele'nin en kapsamlı koleksiyonu."],
        ["16:30", "Prater + Dev Çark", "Parka giriş ücretsiz; çark 14 €. 'Üçüncü Adam' filminin sahnesi."],
        ["19:00", "Erken akşam yemeği", "Konser öncesi hafif tut."],
        ["20:00", "Konser — Musikverein ya da Staatsoper", "Opera ayakta yer 13 €'ya kadar düşüyor; gösteriden 80 dakika önce gişeye git."],
      ],
      ipucu: "Operada ayakta bilet için 80 dakika önceden sıraya gir ve yanına bir eşarp al — yerini işaretlemek için kullanılıyor, âdet böyle.",
    },
  ],

  // ===================== KRAKOW ===========================================
  krakow: [
    {
      gun: 1, baslik: "Eski Şehir", tema: "Meydan ve kale",
      bloklar: [
        ["09:30", "Rynek Główny", "Ücretsiz. Avrupa'nın en büyük ortaçağ meydanı; her saat başı kuleden trompet."],
        ["10:00", "Kumaş Salonu (Sukiennice)", "Alt kat ücretsiz çarşı; üst kat Polonya resmi galerisi 30 zł."],
        ["11:00", "Rynek Underground Müzesi", "32 zł. Meydanın altındaki ortaçağ katmanı; çok iyi kurgulanmış."],
        ["13:00", "Öğle — meydandan bir sokak içeri", "Pierogi ve żurek; fiyat farkı yarı yarıya."],
        ["15:00", "Wawel Kalesi + Katedral", "60 zł. Devlet Daireleri ve Katedral yeterli; bölümler ayrı biletli."],
        ["17:30", "Vistül kıyısı + Ejderha heykeli", "Ücretsiz. Her birkaç dakikada ateş püskürüyor."],
        ["20:00", "Akşam — Eski Şehir", "Pod Wawelem ya da Starka; votka tadımı burada ciddiye alınıyor."],
      ],
      ipucu: "Wawel'in bölümleri ayrı biletli ve günlük kontenjanlı. Gişeye 09:00'da git ya da online al; öğleden sonra bitmiş oluyor.",
    },
    {
      gun: 2, baslik: "Kazimierz ve Schindler", tema: "20. yüzyıl",
      bloklar: [
        ["09:30", "Schindler Fabrikası Müzesi", "38 zł. İşgal altındaki Krakow'u anlatıyor; online randevu şart."],
        ["12:00", "Podgórze + Getto Kahramanları Meydanı", "Ücretsiz. 70 boş sandalye anıtı."],
        ["13:00", "Öğle — Kazimierz", "Zapiekanka için Plac Nowy'deki Okrąglak; 15 zł ve efsanevi."],
        ["15:00", "Kazimierz sinagogları", "Remuh ve Eski Sinagog; kombine bilet mevcut."],
        ["17:00", "Kazimierz sokakları", "Ücretsiz. Antikacılar, kitapçılar, avlular."],
        ["20:00", "Akşam — Kazimierz barları", "Şehrin gece merkezi; Alchemia ve Singer klasikleri."],
      ],
      ipucu: "Schindler Müzesi fabrikanın kendisini değil, dönemin Krakow'unu anlatıyor. Film beklentisiyle gitme; sergi çok daha geniş.",
    },
    {
      gun: 3, baslik: "Auschwitz ya da Wieliczka", tema: "Günübirlik",
      bloklar: [
        ["08:00", "Auschwitz-Birkenau'ya hareket", "1,5 saat. Giriş ücretsiz ama rehberli tur zorunlu (~90 zł) ve aylar önce rezerve edilir."],
        ["10:00", "Auschwitz I rehberli tur", "Sergiler blokların içinde; 2 saat."],
        ["12:30", "Birkenau (Auschwitz II)", "Servisle geçiş; ölçek burada anlaşılıyor."],
        ["15:00", "Krakow'a dönüş", "Sessiz bir dönüş yolu; plan yapma."],
        ["17:00", "Planty parkı yürüyüşü", "Ücretsiz. Eski şehir surlarının yerine kurulmuş yeşil kuşak."],
        ["20:00", "Sakin bir akşam yemeği", "Bugün programa bar koyma."],
      ],
      ipucu: "Auschwitz'i seyahatin son gününe koyma ve sonrasına bir şey planlama. Alternatif olarak Wieliczka Tuz Madeni (139 zł, yarım gün) çok daha hafif bir gün.",
    },
  ],

  // ===================== AMSTERDAM ========================================
  amsterdam: [
    {
      gun: 1, baslik: "Müze Meydanı", tema: "İki büyük müze",
      bloklar: [
        ["09:00", "Rijksmuseum — açılışta", "25 €. Gece Devriyesi'ne doğrudan git; 11:00'den sonra önünde üç sıra oluyor."],
        ["12:00", "Vondelpark", "Ücretsiz. İki müze arasına uzun bir mola; şehrin ciğeri."],
        ["13:00", "Öğle — Museumplein çevresi", "Müze kafeleri pahalı; De Pijp tarafına 10 dakika yürü."],
        ["14:30", "Van Gogh Müzesi", "24 €, saatli bilet — gişede satış yok. Kronolojik sıra 1. kattan başlıyor."],
        ["17:00", "Dokuz Sokak (De Negen Straatjes)", "Ücretsiz. Kanal halkası içinde butik dükkânlar."],
        ["19:30", "Kanal turu — akşam seansı", "20 €. Işıklı köprüler ve kanal evleri; gündüzden çok daha iyi."],
      ],
      ipucu: "İki büyük müzeyi aynı güne koymak yorucu ama yan yanalar. Aralarına Vondelpark'ta gerçekten uzun bir mola koy.",
    },
    {
      gun: 2, baslik: "Kanallar ve tarih", tema: "Jordaan ve Anne Frank",
      bloklar: [
        ["09:00", "Anne Frank Evi", "16 €. Biletler tam 6 hafta önce 10:00'da açılır ve aynı gün biter; takvime alarm kur."],
        ["10:30", "Westerkerk", "Ücretsiz; kule çıkışı 10 € ve rehberli. Anne Frank'ın günlüğünde geçen çan kulesi."],
        ["11:30", "Jordaan mahallesi", "Ücretsiz. Şehrin en güzel yürüyüşü; dar kanallar ve avlular (hofjes)."],
        ["13:00", "Öğle — Jordaan", "Mahallenin kendi kafeleri; Winkel 43'ün elmalı turtası meşhur."],
        ["15:00", "Begijnhof + Amsterdam Müzesi", "Begijnhof ücretsiz; şehrin ortasında sessiz bir avlu."],
        ["16:30", "Çiçek pazarı (Bloemenmarkt)", "Ücretsiz. Lale soğanı almak istiyorsan 'Türkiye'ye sokulabilir' etiketlisini al."],
        ["18:30", "Akşam — De Pijp", "Albert Cuyp pazarı çevresi; şehrin en iyi yemek bölgesi."],
      ],
      ipucu: "Anne Frank Evi bileti yoksa planı buna göre kur; gişede gerçekten satış yok ve karaborsa biletler geçersiz.",
    },
    {
      gun: 3, baslik: "Çevre ve veda", tema: "Yel değirmenleri ya da laleler",
      bloklar: [
        ["09:00", "Zaanse Schans", "Trenle 20 dakika. Alana giriş ücretsiz, değirmen içi 5 €."],
        ["11:30", "Peynir ve takunya atölyeleri", "Ücretsiz gösterimler; tadım serbest."],
        ["13:00", "Amsterdam'a dönüş + öğle", "Centraal çevresi; Haring (çiğ ringa) standı denemeye değer."],
        ["15:00", "NEMO çatısı ya da A'DAM Lookout", "NEMO çatısı ücretsiz; A'DAM 16,5 € ve binanın kenarında salıncak var."],
        ["17:00", "Son alışveriş — Kalverstraat", "Ana alışveriş caddesi."],
        ["19:00", "Havalimanına hareket", "Schiphol'e tren 17 dakika, 5,9 €. Avrupa'nın en pratik havalimanı bağlantısı."],
      ],
      ipucu: "Nisan'daysan Zaanse Schans yerine Keukenhof'u seç — yılın sadece 8 haftası açık ve dünyanın en büyük lale bahçesi.",
    },
  ],

  // ===================== BRUGGE ===========================================
  brugge: [
    {
      gun: 1, baslik: "Merkez", tema: "Meydan, kule, kanal",
      bloklar: [
        ["09:00", "Markt Meydanı", "Ücretsiz. Sabah erken boş; renkli loncalar ve belediye binası."],
        ["09:30", "Belfort Çan Kulesi", "15 €, saatli giriş. 366 basamak; kasabanın tamamı ayağının altında."],
        ["11:00", "Burg Meydanı + Kutsal Kan Bazilikası", "Bazilika ücretsiz; 12. yüzyıl Romanesk alt kilise etkileyici."],
        ["12:00", "Kanal tekne turu", "15 €, 30 dakika. Brugge'ü en iyi anlatan yarım saat."],
        ["13:00", "Öğle — Markt'tan uzak", "Meydandaki yerler belirgin pahalı; iki sokak içeri gir."],
        ["15:00", "Groeningemuseum", "15 €. Flaman Primitifleri; Van Eyck ve Memling."],
        ["17:00", "Begijnhof + Minnewater", "Ücretsiz. 'Aşk Gölü' ve nergisli avlu; kasabanın en sakin köşesi."],
        ["19:30", "Akşam — De Halve Maan ya da bistro", "Bira fabrikası turu 18 € ve sonunda bir bira."],
      ],
      ipucu: "Günübirlikçiler 11:00–17:00 arası. Brugge'de konaklamak kasabayı akşam ve sabah boşken görmeni sağlıyor — asıl fark bu.",
    },
    {
      gun: 2, baslik: "Zanaat ve çevre", tema: "Çikolata, dantel, Gent",
      bloklar: [
        ["09:30", "Choco-Story çikolata müzesi", "13 €, tadım dahil."],
        ["11:00", "Dantel merkezi ve yel değirmenleri", "Kasabanın doğu sınırındaki surlar üstünde dört değirmen."],
        ["12:30", "Öğle — frituur", "Gerçek Belçika patatesi restoranda değil, frituur'da satılır."],
        ["14:00", "Gent günübirlik (opsiyonel)", "Trenle 25 dakika. Gravensteen kalesi ve Van Eyck'in Ghent Sunağı."],
        ["18:00", "Brugge'e dönüş", "Akşam ışığında Rozenhoedkaai — kasabanın klasik fotoğraf noktası."],
        ["20:00", "Son akşam", "Trappist birası tadımı; Westvleteren bulunursa kaçırma."],
      ],
      ipucu: "Brüksel'e dönmeden Gent'e uğra. Brugge kadar güzel, çeyreği kadar turistik ve üniversite şehri olduğu için çok daha canlı.",
    },
  ],

  // ===================== BERLİN ===========================================
  berlin: [
    {
      gun: 1, baslik: "Mitte — tarihin merkezi", tema: "Kapı, anıt, bulvar",
      bloklar: [
        ["09:00", "Brandenburg Kapısı", "Ücretsiz. Sabah erken fotoğraf için en iyi saat."],
        ["09:30", "Reichstag kubbesi", "Ücretsiz ama online randevu zorunlu, en az 3 gün önce. Sesli rehber dahil."],
        ["11:30", "Holokost Anıtı + Bilgi Merkezi", "Ücretsiz. 2.711 beton blok; aşağıdaki merkez çok ağır, zaman ayır."],
        ["13:30", "Öğle — Unter den Linden", "Bulvar üstü pahalı; bir blok kuzeye çık."],
        ["15:00", "Topographie des Terrors", "Ücretsiz. Gestapo merkezinin yerinde; Berlin'in en sarsıcı sergisi."],
        ["17:00", "Checkpoint Charlie", "Kontrol noktası ücretsiz ve turistik; Duvar Müzesi 17,5 € ve yoğun."],
        ["19:30", "Akşam — Hackescher Markt", "Avlular (Höfe) ve restoranlar; Berlin'in en canlı merkezî bölgesi."],
      ],
      ipucu: "Reichstag kubbesi için randevuyu Türkiye'den al. Ücretsiz ama kontenjanlı; aynı gün başvuruyla neredeyse hiç yer bulunmuyor.",
    },
    {
      gun: 2, baslik: "Müze Adası", tema: "Beş müze, bir ada",
      bloklar: [
        ["09:30", "Neues Museum — Nefertiti", "Ada bileti 24 €. Nefertiti büstü tek başına gitmeye değer."],
        ["11:30", "Altes Museum / Alte Nationalgalerie", "Aynı bilete dahil; Alman romantizmi (Friedrich) Nationalgalerie'de."],
        ["13:30", "Öğle — Hackescher Markt", "Adadan 10 dakika."],
        ["15:00", "Berlin Katedrali (Berliner Dom)", "9 €; kubbeye çıkış dahil, 270 basamak."],
        ["16:30", "Berlin TV Kulesi", "25 €, saatli bilet. Almanya'nın en yüksek yapısı."],
        ["18:00", "Nikolaiviertel", "Ücretsiz. Berlin'in yeniden inşa edilmiş en eski mahallesi."],
        ["20:30", "Akşam — Prenzlauer Berg", "Kollwitzplatz çevresi; şehrin en keyifli akşam bölgelerinden."],
      ],
      ipucu: "Pergamon Müzesi 2027'ye kadar kapalı. Ada bileti alırken bunu hesaba kat; diğer dördü yine de tam gün eder.",
    },
    {
      gun: 3, baslik: "Duvar ve doğu", tema: "Bölünmüş şehrin izleri",
      bloklar: [
        ["09:30", "East Side Gallery", "Ücretsiz. Duvarın 1,3 km'lik ayakta kalan ve boyanmış parçası."],
        ["11:00", "Oberbaumbrücke + Kreuzberg", "Köprüden Kreuzberg'e geçiş; sokak sanatı yoğun."],
        ["12:30", "Öğle — Markthalle Neun", "Perşembe akşamları sokak yemeği günü; diğer günler de açık."],
        ["14:30", "Berlin Duvarı Anıtı (Bernauer Straße)", "Ücretsiz. Duvarın nasıl çalıştığını en iyi anlatan yer; ölüm şeridi korunmuş."],
        ["16:30", "Mauerpark", "Ücretsiz. Pazar günleri bit pazarı ve açık hava karaoke."],
        ["18:30", "Akşam — Kreuzberg", "Türk mutfağının Almanya'daki merkezi; döner burada icat edildi."],
      ],
      ipucu: "Bernauer Straße anıtı Checkpoint Charlie'den çok daha iyi ve ücretsiz. Duvarı gerçekten anlamak istiyorsan buraya zaman ayır.",
    },
    {
      gun: 4, baslik: "Potsdam ya da batı", tema: "Saray ya da alışveriş",
      bloklar: [
        ["09:30", "S-Bahn ile Potsdam", "40 dakika; ABC bölge bileti gerekli."],
        ["10:30", "Sanssouci Sarayı + bahçeler", "14 €. Prusya'nın Versailles'ı; bahçeler ücretsiz ve çok geniş."],
        ["13:00", "Öğle — Potsdam eski şehir", "Hollanda Mahallesi; kırmızı tuğlalı sokaklar."],
        ["15:00", "Cecilienhof (opsiyonel)", "Potsdam Konferansı'nın yapıldığı yer; 10 €."],
        ["17:00", "Berlin'e dönüş", "Kurfürstendamm ve KaDeWe için son alışveriş."],
        ["19:30", "Son akşam", "Kaiser Wilhelm Anıt Kilisesi — savaşta yıkılmış hali bilinçli korunmuş."],
      ],
      ipucu: "Potsdam yerine şehirde kalacaksan Charlottenburg Sarayı + Gemäldegalerie ikilisi de tam gün eder ve yol yorgunluğu yok.",
    },
  ],

  // ===================== MÜNİH ============================================
  munih: [
    {
      gun: 1, baslik: "Merkez", tema: "Marienplatz ve bira",
      bloklar: [
        ["10:30", "Marienplatz + Glockenspiel", "Ücretsiz. Saat gösterisi 11:00 ve 12:00; 10 dakika önce yer kap."],
        ["11:30", "Yeni Belediye kulesi", "6 €, asansörlü. Şehir ve açık havada Alpler görünüyor."],
        ["12:30", "Viktualienmarkt", "Ücretsiz. 140 yıllık gıda pazarı; bira bahçesinde öğle yemeği."],
        ["14:30", "Residenz — Kraliyet Sarayı", "9 €. Wittelsbach hanedanının şehir sarayı; Antiquarium salonu olağanüstü."],
        ["17:00", "Englischer Garten + Eisbach dalgası", "Ücretsiz. Nehirdeki sabit dalgada sörfçüler her mevsim orada."],
        ["19:00", "Chinesischer Turm bira bahçesi", "Parkın içinde; 1 litre bira ~12 €, kendi yemeğini getirebilirsin."],
        ["21:00", "Hofbräuhaus", "Giriş ücretsiz. Turistik ama gerçek; bando ve uzun masalar."],
      ],
      ipucu: "Bira bahçelerinde kendi yemeğini getirmek yasaldır — sadece içeceği oradan alırsın. Yerel halk gerçekten böyle yapıyor.",
    },
    {
      gun: 2, baslik: "Neuschwanstein", tema: "Tam günlük şato",
      bloklar: [
        ["07:30", "Trenle Füssen", "2 saat. Bayern Ticket (29 €, 5 kişiye kadar) en ekonomik seçenek."],
        ["09:45", "Füssen'den otobüs", "73 ya da 78 numara; 10 dakika, Hohenschwangau'ya."],
        ["10:30", "Bilet merkezi", "21 €, saatli giriş — online almadıysan kuyruk uzun ve saat kaçabilir."],
        ["11:30", "Şatoya çıkış", "40 dakika yokuş ya da at arabası (8 €) / servis otobüs (3 €)."],
        ["12:30", "Neuschwanstein turu", "35 dakikalık rehberli tur; iç mekânın sadece 14 odası tamamlanmış."],
        ["14:00", "Marienbrücke", "Şatonun klasik fotoğraf açısı; köprü kışın kapalı olabiliyor."],
        ["16:00", "Hohenschwangau Şatosu (opsiyonel)", "Ludwig'in çocukluk şatosu; daha küçük ve daha samimi."],
        ["19:30", "Münih'e dönüş", "Geç akşam yemeği."],
      ],
      ipucu: "Neuschwanstein bileti saatlidir ve kaçırırsan yanar. Trenle gidiyorsan saat 12:00'den önceye bilet alma; gecikme riski yüksek.",
    },
    {
      gun: 3, baslik: "Müzeler ve Dachau", tema: "Bilim ya da tarih",
      bloklar: [
        ["09:30", "Dachau Anma Alanı", "Giriş ücretsiz; sesli rehber 4,50 €. S2 ile 40 dakika."],
        ["13:00", "Münih'e dönüş + öğle", "Sessiz bir öğle; programı sıkıştırma."],
        ["15:00", "Deutsches Museum", "15 €. Dünyanın en büyük bilim ve teknoloji müzesi; madenci galerisi ve uçaklar."],
        ["18:00", "BMW Welt + Müzesi", "BMW Welt ücretsiz; müze 14 €. Olimpiyat Parkı yanında."],
        ["20:00", "Son akşam — Schwabing", "Üniversite bölgesi; Hofbräuhaus'tan daha yerel bir akşam."],
      ],
      ipucu: "Dachau ve Deutsches Museum aynı güne ağır geliyor. Bir tanesini seç; Alpler'e (Garmisch, Zugspitze) günübirlik de iyi bir alternatif.",
    },
  ],

  // ===================== KOPENHAG =========================================
  kopenhag: [
    {
      gun: 1, baslik: "Merkez ve liman", tema: "Nyhavn ve kraliyet",
      bloklar: [
        ["09:30", "Nyhavn", "Ücretsiz. Renkli evler; sabah erken turist akınından önce."],
        ["10:30", "Kanal turu", "120 DKK, 1 saat. Şehri su üstünden görmenin en verimli yolu."],
        ["12:00", "Amalienborg + nöbet değişimi", "Meydan ücretsiz; değişim 12:00. Saray müzesi 125 DKK."],
        ["13:00", "Öğle — Torvehallerne pazarı", "Kapalı gıda pazarı; smørrebrød (açık sandviç) için doğru yer."],
        ["15:00", "Rosenborg Şatosu + Taç Mücevherleri", "140 DKK. Mücevherler bodrumda; bahçesi (Kongens Have) ücretsiz."],
        ["17:00", "Strøget yürüyüş caddesi", "Avrupa'nın en uzun yaya caddelerinden; 1,1 km."],
        ["19:00", "Tivoli Bahçeleri", "175 DKK giriş. Akşam ışıklandırması ve bahçeler; oyuncaklar ayrı ücretli."],
      ],
      ipucu: "Kopenhag pahalı. Torvehallerne ve Reffen gibi pazar alanları restoran fiyatının yarısına çok daha iyi yemek veriyor.",
    },
    {
      gun: 2, baslik: "Bisikletli gün", tema: "Christiania ve kuzey",
      bloklar: [
        ["09:30", "Bisiklet kiralama", "~120 DKK/gün. Şehir bunun için tasarlanmış; en hızlı ulaşım bu."],
        ["10:00", "Christianshavn kanalları", "Ücretsiz. Amsterdam benzeri ama daha sakin."],
        ["11:00", "Vor Frelsers Kirke kulesi", "69 DKK. Dışarıdan spiral merdivenle çıkılıyor; yükseklik korkun varsa atla."],
        ["12:00", "Christiania", "Ücretsiz. Özerk mahalle; Pusher Street'te fotoğraf çekmek kesinlikle yasak."],
        ["13:30", "Öğle — Reffen sokak yemeği", "Giriş ücretsiz; şehirde makul fiyatla yemenin en iyi yolu."],
        ["15:30", "Küçük Deniz Kızı + Kastellet", "Ücretsiz. Heykel beklenenden küçük; yıldız şeklindeki Kastellet kalesi daha keyifli."],
        ["17:30", "Nørrebro mahallesi", "Superkilen parkı ve Jægersborggade sokağı; şehrin en genç bölgesi."],
        ["20:00", "Akşam — Nørrebro ya da Vesterbro", "Kjøbenhavn'ın en iyi bar ve restoranları bu iki mahallede."],
      ],
      ipucu: "Bisiklet kurallarına uy: el işaretleri zorunlu, kırmızı ışıkta duruluyor ve kaldırımda bisiklet yasak. Ceza gerçekten kesiliyor.",
    },
    {
      gun: 3, baslik: "Louisiana ve veda", tema: "Sanat ve deniz",
      bloklar: [
        ["09:30", "Trenle Humlebæk", "35 dakika. Louisiana Modern Sanat Müzesi istasyondan 10 dakika yürüyüş."],
        ["10:30", "Louisiana Müzesi", "160 DKK. Denize bakan heykel bahçesi tek başına bileti hak ediyor."],
        ["13:00", "Müze kafesinde öğle", "Terastan Öresund ve İsveç kıyısı görünüyor."],
        ["15:00", "Kopenhag'a dönüş", "İsterseniz yolda Kronborg (Hamlet'in kalesi) molası."],
        ["17:00", "Son alışveriş — Illums Bolighus", "İskandinav tasarımı; pahalı ama kalıcı."],
        ["19:00", "Havalimanına hareket", "Metroyla 15 dakika; merkeze çok yakın."],
      ],
      ipucu: "Copenhagen Card yoğun müze programı yapacaksan gerçekten tasarruf ettiriyor (Tivoli + Rosenborg + kanal turu zaten kartı amorti ediyor).",
    },
  ],

  // ===================== ATİNA ============================================
  atina: [
    {
      gun: 1, baslik: "Akropolis", tema: "Antik dünyanın merkezi",
      bloklar: [
        ["08:00", "Akropolis — ilk seans", "33 € (08:00 seansı). Hem serin hem boş; 10:00'dan sonra hem sıcak hem omuz omuza."],
        ["10:30", "Partenon, Erehtheion, Nike Tapınağı", "Aynı alan içinde; Erehtheion'un karyatidleri kopyadır, orijinali müzede."],
        ["11:30", "Dionysos Tiyatrosu", "Aynı biletle; güney yamaçta, çıkışta uğra."],
        ["13:00", "Öğle — Plaka", "Turistik ama Plaka'nın arka sokakları hâlâ iyi."],
        ["15:00", "Akropolis Müzesi", "15 €. Partenon kabartmalarının bağlamı burada; cam zeminden kazı alanı görünüyor."],
        ["18:00", "Anafiotika", "Ücretsiz. Akropolis eteğinde ada köyü gibi beyaz evler; şehrin en sürpriz köşesi."],
        ["20:30", "Akşam — Psyri", "Plaka'dan daha yerel; meyhaneler ve canlı müzik."],
      ],
      ipucu: "Birleşik arkeoloji biletini (30 €, 5 gün geçerli) al. Akropolis tek başına 30 € — diğer beş alan pratikte bedavaya geliyor.",
    },
    {
      gun: 2, baslik: "Antik merkez", tema: "Agora ve tepeler",
      bloklar: [
        ["09:00", "Antik Agora + Hephaisteion", "Birleşik bilete dahil. Hephaisteion Yunanistan'ın en iyi korunmuş tapınağı ve bomboş."],
        ["11:00", "Attalos Stoası müzesi", "Agora içinde; yeniden inşa edilmiş antik çarşı."],
        ["12:00", "Roma Agorası + Rüzgârlar Kulesi", "Birleşik bilete dahil; 5 dakika yürüme."],
        ["13:00", "Öğle — Monastiraki", "Pazar çevresi; souvlaki için Kostas ya da Thanasis."],
        ["15:00", "Kerameikos", "Birleşik bilete dahil. Antik mezarlık; çok sakin ve çok ihmal edilmiş."],
        ["16:30", "Monastiraki bit pazarı", "Ücretsiz. Pazar günü asıl pazar kuruluyor."],
        ["18:30", "Likavitos Tepesi", "Füniküler 10 €, yürüyüş ücretsiz. Gün batımında şehir ve Akropolis bir arada."],
      ],
      ipucu: "Hephaisteion'u atlama. Partenon'dan çok daha sağlam ayakta ve önünde kimse yok — Yunan tapınağını gerçekten görmek buradan mümkün.",
    },
    {
      gun: 3, baslik: "Müze ve Sounion", tema: "Son gün",
      bloklar: [
        ["09:30", "Ulusal Arkeoloji Müzesi", "12 €. Agamemnon maskesi ve Antikythera mekanizması; çoğu turistin atladığı en iyi müze."],
        ["12:30", "Öğle — Exarchia / Kolonaki", "Müzeye yakın iki bölge; Kolonaki şık, Exarchia alternatif."],
        ["14:30", "Sounion'a otobüs", "1,5 saat; Mavromateon caddesinden KTEL."],
        ["16:30", "Poseidon Tapınağı", "10 €. Denize tepeden bakan tapınak; Byron'ın adını kazıdığı sütun hâlâ orada."],
        ["18:30", "Ege'de gün batımı", "Sounion'un asıl sebebi bu."],
        ["21:00", "Atina'ya dönüş", "Geç akşam yemeği."],
      ],
      ipucu: "Sounion'a gitmeyeceksen bu günü bir adaya ayır: Aegina feribotla 1 saat, Afaia Tapınağı ve antep fıstığıyla tam günlük bir kaçamak.",
    },
  ],

  // ===================== DUBROVNİK ========================================
  dubrovnik: [
    {
      gun: 1, baslik: "Surlar ve Eski Şehir", tema: "Taş şehir",
      bloklar: [
        ["08:00", "Şehir Surları turu", "35 €. Sabah ilk saat; öğlen gölgesiz ve 35°C."],
        ["10:30", "Stradun ve Eski Şehir", "Ücretsiz. Kruvaziyerler inmeden önceki son sakin saat."],
        ["11:30", "Rektör Sarayı", "15 €. Dubrovnik Cumhuriyeti'nin yönetim merkezi."],
        ["13:00", "Öğle — Prijeko sokağı dışı", "Ana cadde üstü pahalı; yan sokaklara gir."],
        ["15:00", "Fransisken Manastırı + eczane", "6 €. Avrupa'nın işleyen en eski eczanelerinden (1317)."],
        ["17:00", "Banje Plajı", "Ücretsiz giriş. Surları denizden gören plaj; şezlong ücretli."],
        ["19:30", "Buža Bar", "Surun deliğinden çıkılan kayalık bar; gün batımı için efsanevi."],
      ],
      ipucu: "Kruvaziyer takvimine bak (dubrovnikports.hr). Gemi yanaşan günlerde Eski Şehir 10:00–16:00 arası gerçekten yürünmüyor.",
    },
    {
      gun: 2, baslik: "Ada ve tepe", tema: "Lokrum ve Srđ",
      bloklar: [
        ["09:30", "Lokrum Adası", "27 € (tekne + giriş). 15 dakikalık geçiş; tavus kuşları ve manastır."],
        ["11:00", "Ölü Deniz gölü", "Adanın içinde tuzlu göl; yüzmek için ideal."],
        ["13:00", "Öğle — adada ya da dönüşte", "Adada tek bir restoran var; dönüp yemek de mantıklı."],
        ["15:00", "Mola", "Günün en sıcak saati; otelde dinlen."],
        ["17:30", "Teleferik + Srđ Tepesi", "27 €. Yukarıda Vatanseverlik Savaşı müzesi var."],
        ["19:30", "Srđ'de gün batımı", "Eski Şehir, Lokrum ve Adriyatik aynı karede."],
        ["21:00", "Akşam — Eski Liman", "Kruvaziyerler gittikten sonra şehir bambaşka."],
      ],
      ipucu: "Teleferik rüzgârda kapanabiliyor. Kapalıysa taksiyle (~15 €) ya da yürüyerek (1 saat, serpantin) çıkılıyor.",
    },
    {
      gun: 3, baslik: "Adalar ya da Kotor", tema: "Günübirlik",
      bloklar: [
        ["08:30", "Elafiti adaları tekne turu", "60 €. Koločep, Lopud ve Šipan; öğle yemeği dahil."],
        ["11:00", "Lopud — Šunj plajı", "Adriyatik'in nadir kumlu plajlarından."],
        ["13:00", "Teknede öğle yemeği", "Genelde balık ve ızgara; fiyata dahil."],
        ["15:30", "Šipan", "Adaların en büyüğü ve en sakini."],
        ["18:00", "Dubrovnik'e dönüş", "Limandan Eski Şehir'e 10 dakika."],
        ["20:30", "Son akşam", "Eski Şehir'de balık; Proto ya da Nautika (manzaralı, pahalı)."],
      ],
      ipucu: "Alternatif: Kotor (Karadağ) günübirlik turu, 55 € ve 2 saat yol. Avrupa'nın en güneydeki fiyordu — pasaportunu yanına al.",
    },
  ],

  // ===================== TİFLİS ===========================================
  tiflis: [
    {
      gun: 1, baslik: "Eski Tiflis", tema: "Kale, hamam, meydan",
      bloklar: [
        ["10:00", "Meydan ve Eski Şehir", "Ücretsiz. Ahşap balkonlu evler; kaybolmak planın parçası."],
        ["11:30", "Narikala teleferiği", "2,5 GEL tek yön. Şehrin tamamı görünüyor."],
        ["12:00", "Narikala Kalesi + Ana Gürcistan", "Ücretsiz. Heykel bir elinde şarap, diğerinde kılıç tutuyor — ülkeyi özetliyor."],
        ["13:30", "Öğle — Eski Şehir", "Khinkali (et mantısı) ve khachapuri; Adjaruli en meşhuru."],
        ["16:00", "Kükürtlü hamamlar (Abanotubani)", "60 GEL özel oda/saat; kese + masaj ayrı 30 GEL."],
        ["18:30", "Barış Köprüsü + Rike Parkı", "Ücretsiz. Akşam ışıklandırması."],
        ["20:30", "Akşam — şarap barı", "8000 yıllık qvevri şarabı; Vino Underground ya da g.Vino."],
      ],
      ipucu: "Hamamı günün sonuna koy. Yürüyüşten sonra doğru sıralama bu ve Gürcistan'da hamam gerçekten günlük hayatın parçası.",
    },
    {
      gun: 2, baslik: "Kazbegi", tema: "Kafkas dağları",
      bloklar: [
        ["08:00", "Tur kalkışı", "150 GEL civarı; Askeri Gürcistan Yolu boyunca 3 saat."],
        ["09:30", "Ananuri Kalesi", "Zhinvali barajının kıyısında; kısa mola."],
        ["11:00", "Gudauri manzara noktası", "Sovyet dostluk anıtı; vadiye bakan mozaik."],
        ["13:00", "Stepantsminda — öğle", "Kazbek Dağı'nın eteğindeki kasaba."],
        ["14:30", "Gergeti Üçlemesi Kilisesi", "2.170 metrede; son 6 km 4x4 ile. Kafkasların en bilinen manzarası."],
        ["17:00", "Dönüş yolu", "3 saat; akşam Tiflis'te."],
        ["21:00", "Geç akşam yemeği", "Fabrika ya da Dedaena Bar çevresi."],
      ],
      ipucu: "Dağda telefon çekmiyor ve hava hızla değişiyor. Şoförle buluşma noktası ve saatini net konuş; yanına bir kat fazla giysi al.",
    },
    {
      gun: 3, baslik: "Kakheti", tema: "Şarap rotası",
      bloklar: [
        ["09:00", "Kakheti'ye hareket", "180 GEL tur; 2 saat yol."],
        ["11:00", "Signagi — 'aşk şehri'", "Surlarla çevrili kasaba; Alazani vadisine bakıyor."],
        ["12:30", "Bodbe Manastırı", "Aziz Nino'nun mezarı; Gürcistan'ın en kutsal yerlerinden."],
        ["14:00", "Bağ tadımı + supra", "Qvevri (toprak küp) yöntemi UNESCO mirası; supra uzun ve bol alkollü bir sofradır."],
        ["17:00", "Tsinandali ya da ikinci bağ", "İsteğe bağlı ikinci durak."],
        ["20:00", "Tiflis'e dönüş", "Dönüş saatini geniş tut; supra planlandığından uzun sürer."],
      ],
      ipucu: "Supra'da tamada (sofra başkanı) kadeh kaldırır ve herkesin içmesi beklenir. Araç kullanmayacağından emin ol; tur bu yüzden daha mantıklı.",
    },
    {
      gun: 4, baslik: "Mtskheta ve veda", tema: "Eski başkent",
      bloklar: [
        ["10:00", "Jvari Manastırı", "Ücretsiz. Tepeden iki nehrin birleşimi ve Mtskheta görünüyor."],
        ["11:30", "Svetitskhoveli Katedrali", "Ücretsiz. Gürcistan'ın en kutsal katedrali; UNESCO listesinde."],
        ["13:00", "Öğle — Mtskheta", "Nehir kenarı restoranlar; Salobie Bia iyi."],
        ["15:00", "Dezerter pazarı", "Ücretsiz. Baharat, ceviz, churchkhela — en iyi hediyelik burada ve en ucuz."],
        ["17:00", "Rustaveli Bulvarı", "Opera, parlamento ve kitapçılar."],
        ["19:00", "Havalimanına hareket", "Bolt ile 25 dakika, ~25 GEL."],
      ],
      ipucu: "Churchkhela (cevizli pestil) ve Svaneti tuzu en iyi hediyelikler. Pazarda fiyat zaten düşük; pazarlık âdeti Fas'taki gibi değil.",
    },
  ],

  // ===================== DUBAİ ============================================
  dubai: [
    {
      gun: 1, baslik: "Modern Dubai", tema: "Downtown",
      bloklar: [
        ["11:00", "Dubai Mall", "Ücretsiz. Dünyanın en büyük AVM'si; akvaryum duvarı dışarıdan ücretsiz görülüyor."],
        ["13:00", "Öğle — Mall yemek katı", "Her mutfaktan var; Souk Al Bahar tarafı daha atmosferli."],
        ["15:00", "Dubai Akvaryumu (opsiyonel)", "140 AED; tünel geçişi ve su altı zoo."],
        ["17:30", "Burj Khalifa — gün batımı seansı", "179 AED (124+125. kat). En pahalı ve en talep gören seans; online al."],
        ["19:30", "Dubai Çeşmesi gösterisi", "Ücretsiz; her 30 dakikada bir. Souk Al Bahar köprüsünden en iyi açı."],
        ["21:00", "Akşam — Souk Al Bahar", "Göl kenarı teraslar; Burj Khalifa tam karşında."],
      ],
      ipucu: "Dubai'de gün ortası dışarıda vakit geçirilmiyor. Programı sabah erken ve 17:00 sonrasına kur; öğleni kapalı alanda geçir.",
    },
    {
      gun: 2, baslik: "Eski Dubai ve çöl", tema: "İki ayrı şehir",
      bloklar: [
        ["09:00", "Al Fahidi tarihi mahallesi", "Ücretsiz. Rüzgâr kuleli avlu evleri; şehrin petrol öncesi hali."],
        ["10:30", "Dubai Müzesi / Coffee Museum", "Küçük ama bağlam veriyor."],
        ["11:30", "Abra ile karşıya geçiş", "1 AED. Dünyanın en ucuz ve en keyifli tekne yolculuğu."],
        ["12:00", "Altın ve Baharat Çarşısı", "Ücretsiz. Altın gram fiyatı sabit, işçilik pazarlığa açık."],
        ["13:30", "Öğle — Deira", "Yerel Pakistan ve İran mutfağı; fiyatlar Downtown'ın üçte biri."],
        ["15:00", "Otele dönüş ve hazırlık", "Safari için rahat kıyafet ve ıslak mendil."],
        ["15:30", "Çöl safari alım", "250 AED. Dune bashing + deve + henna + canlı gösteri + BBQ."],
        ["21:30", "Otele dönüş", "Safari genelde 21:00–22:00'de bırakıyor."],
      ],
      ipucu: "Dune bashing araç sallıyor; midesi hassas olanlar önde otursun ve safariden önce ağır yemek yemesin.",
    },
    {
      gun: 3, baslik: "Abu Dabi", tema: "Günübirlik başkent",
      bloklar: [
        ["08:30", "Abu Dabi'ye hareket", "1,5 saat; tur ya da kiralık araç."],
        ["10:00", "Şeyh Zayed Camii", "Ücretsiz, online randevu gerekli. Kadınlar için abaya girişte veriliyor."],
        ["12:30", "Öğle — Corniche", "Deniz kenarı; Emirates Palace çevresi pahalı."],
        ["14:00", "Louvre Abu Dhabi", "65 AED. Mimarisi (Jean Nouvel'in 'yağmur kubbesi') tek başına bileti hak ediyor."],
        ["16:30", "Qasr Al Watan", "65 AED. Cumhurbaşkanlığı sarayı; kütüphanesi olağanüstü."],
        ["18:30", "Dubai'ye dönüş", "Akşam Marina'da."],
      ],
      ipucu: "Camiye kıyafet kuralı katı: erkek uzun pantolon, kadın bilek ve bilek kapalı + başörtü. Abaya ücretsiz veriliyor ama sıra uzun olabiliyor.",
    },
    {
      gun: 4, baslik: "Marina ve veda", tema: "Sahil ve alışveriş",
      bloklar: [
        ["10:00", "Dubai Marina yürüyüşü", "Ücretsiz. Gökdelenler arasında kanal; sabah serin."],
        ["12:00", "JBR sahili (The Beach)", "Ücretsiz. Denize girmek ve öğle için pratik."],
        ["14:30", "Mall of the Emirates / Ski Dubai", "Ski Dubai 350 AED; kar manzarası 45°C'de tuhaf ve eğlenceli."],
        ["17:00", "KDV iadesi + son alışveriş", "%5 iade havalimanında Planet kioskundan; fişleri sakla."],
        ["19:00", "Havalimanına hareket", "Metro kırmızı hat doğrudan terminale gidiyor."],
      ],
      ipucu: "Dubai metrosunda 'Gold Class' vagonu var ve iki katı fiyat. Normal vagon zaten temiz ve klimalı; gerek yok.",
    },
  ],

  // ===================== TOKYO ============================================
  tokyo: [
    {
      gun: 1, baslik: "Asakusa ve doğu", tema: "Eski Tokyo",
      bloklar: [
        ["08:00", "Senso-ji Tapınağı", "Ücretsiz. 08:00'de Nakamise çarşısı bomboş; 10:00'da omuz omuza."],
        ["09:30", "Nakamise çarşısı", "Geleneksel atıştırmalıklar; ningyo-yaki ve melonpan."],
        ["11:00", "Sumida nehri yürüyüşü", "Ücretsiz. Karşıda Tokyo Skytree ve Asahi binası."],
        ["12:30", "Öğle — Asakusa", "Tempura ya da unagi; bölgenin iki klasiği."],
        ["14:30", "Tokyo Skytree", "3.100 ¥. 634 metre; açık havada Fuji görünüyor."],
        ["17:00", "Ueno Parkı + Tokyo Ulusal Müzesi", "Müze 1.000 ¥; samuray zırhları ve kılıçlar."],
        ["19:30", "Akşam — Ueno Ameyoko", "Sokak pazarı ve izakaya'lar; jet lag için fazla geç kalma."],
      ],
      ipucu: "Jet lag ilk gün en ağır. Programı hafif tut, 22:00'de yat; ertesi sabah 06:00'da uyanman Tokyo için avantaj.",
    },
    {
      gun: 2, baslik: "Batı Tokyo", tema: "Shibuya ve Harajuku",
      bloklar: [
        ["08:30", "Meiji Jingu", "Ücretsiz. Ormanın içinde tapınak; sabah erken ayin görülebiliyor."],
        ["10:30", "Harajuku — Takeshita caddesi", "Ücretsiz. Gençlik modası; crepe standları."],
        ["12:00", "Omotesando", "Mimari gezintisi; dünyanın en iyi mağaza binaları bu caddede."],
        ["13:30", "Öğle — Omotesando / Aoyama", "Kaliteli ve makul; ramen için Afuri."],
        ["15:30", "Shibuya kavşağı + Hachiko", "Ücretsiz. Starbucks üst katından kavşağı izlemek klasik."],
        ["17:30", "Shibuya Sky — gün batımı", "2.500 ¥. Açık çatı; seans aylar öncesinden doluyor."],
        ["20:00", "Akşam — Shinjuku Omoide Yokocho", "Dar sokakta yakitori tezgâhları; 'Piss Alley' lakaplı ama harika."],
      ],
      ipucu: "Shibuya Sky biletini Türkiye'den al; gün batımı seansları yerinde asla bulunmuyor. Bulut varsa iptal/iade yok.",
    },
    {
      gun: 3, baslik: "Modern Tokyo", tema: "Sanat ve pazar",
      bloklar: [
        ["05:00", "Toyosu balık hali (opsiyonel)", "Ücretsiz. Ton balığı mezatı için 05:00'te orada olman gerek."],
        ["09:00", "TeamLab Planets", "3.800 ¥, saatli bilet. Suya giriliyor; kısa pantolon/toplanabilir giysi gerekli."],
        ["12:30", "Öğle — Toyosu / Odaiba", "Deniz manzaralı; gundam heykeli Odaiba'da."],
        ["15:00", "Ginza", "Ücretsiz gezinti. Hafta sonu ana cadde yayalaştırılıyor."],
        ["17:00", "Tokyo İstasyonu + Imperial Palace bahçeleri", "Bahçeler ücretsiz; istasyonun tuğla cephesi 1914'ten."],
        ["19:30", "Akşam — Shinjuku Golden Gai", "Altı sokakta 200'den fazla minik bar; bazıları yabancı kabul etmiyor, kapıdaki yazıya bak."],
      ],
      ipucu: "Toyosu mezatı için kayıt gerekiyor ve sabah 05:00 demek. Zorunlu değil — izleme galerisinden ücretsiz bakmak da mümkün.",
    },
    {
      gun: 4, baslik: "Hakone / Fuji", tema: "Günübirlik dağ",
      bloklar: [
        ["07:30", "Shinjuku'dan Odakyu treni", "Hakone Free Pass 6.100 ¥; tren + teleferik + göl teknesi + otobüs dahil."],
        ["09:30", "Hakone-Yumoto → dağ treni", "Zikzaklı tırmanış; yol başlı başına keyifli."],
        ["11:00", "Owakudani volkanik vadi", "Teleferikle; kükürtlü kaynakta pişen siyah yumurta geleneği."],
        ["13:00", "Öğle — Togendai", "Ashi Gölü kıyısı."],
        ["14:00", "Korsan gemisiyle Ashi Gölü", "Açık havada Fuji göle yansıyor."],
        ["15:30", "Hakone Tapınağı — göldeki torii", "Ücretsiz. Suyun içindeki kırmızı kapı; sıra olabiliyor."],
        ["19:00", "Tokyo'ya dönüş", "Akşam yemeği Shinjuku'da."],
      ],
      ipucu: "Fuji'yi görmek hava şansı. En yüksek ihtimal sabah erken ve kış aylarında; yazın bulut genelde kapatıyor.",
    },
    {
      gun: 5, baslik: "Kyoto'ya geçiş ya da veda", tema: "Son gün",
      bloklar: [
        ["09:00", "Son alışveriş — Akihabara ya da Nakano", "Elektronik, oyun, koleksiyon."],
        ["12:00", "Öğle — bir kez daha ramen", "Ichiran ya da Afuri; bireysel kabinli sistem deneyimi."],
        ["14:00", "Shinkansen ile Kyoto (devam edilecekse)", "14.000 ¥, 2s 15dk. Sağ taraf koltuk: Fuji görünüyor."],
        ["16:00", "Havalimanına hareket (dönüş varsa)", "Narita Express 3.070 ¥, 60 dakika; Haneda daha yakın."],
      ],
      ipucu: "Büyük valizi otelden otele kargo (takkyubin) ile yolla: 2.000 ¥ ve aynı gün varıyor. Shinkansen'de büyük bagaj için rezervasyon gerekiyor.",
    },
  ],

  // ===================== KYOTO ============================================
  kyoto: [
    {
      gun: 1, baslik: "Güney Higashiyama", tema: "Tapınaklar ve Gion",
      bloklar: [
        ["07:00", "Fushimi Inari", "Ücretsiz, 24 saat açık. 07:00'den önce git; fotoğraflardaki boş tüneller ancak o saatte."],
        ["09:30", "Tofuku-ji", "500 ¥. Zen bahçeleri; sonbaharda kızıl yaprak merkezi."],
        ["11:30", "Sanjusangendo", "600 ¥. 1.001 Kannon heykeli tek salonda; fotoğraf yasak, o yüzden az biliniyor."],
        ["13:00", "Öğle — Gion çevresi", "Obanzai (Kyoto ev yemeği) seti öğle vakti uygun."],
        ["14:30", "Kiyomizu-dera", "500 ¥. Ahşap teras; yolundaki Sannenzaka ve Ninenzaka sokakları."],
        ["17:00", "Gion ve Hanamikoji", "Ücretsiz. Akşamüstü geyko/maiko görme ihtimali en yüksek saat."],
        ["19:00", "Pontocho sokağı", "Kamo nehri kenarında dar sokak; yazın nehir üstü teraslar kuruluyor."],
      ],
      ipucu: "Gion'un özel sokaklarında fotoğraf yasağı var ve 10.000 ¥ ceza uygulanıyor. Maiko'ları takip etme; tabelalara uy.",
    },
    {
      gun: 2, baslik: "Arashiyama ve kuzeybatı", tema: "Bambu ve Altın Köşk",
      bloklar: [
        ["08:00", "Arashiyama bambu ormanı", "Ücretsiz. 08:00 şart; 10:00'da yürünmüyor."],
        ["09:00", "Tenryu-ji bahçesi", "800 ¥. UNESCO listesinde; bahçe 14. yüzyıldan beri aynı."],
        ["10:30", "Iwatayama maymun parkı", "600 ¥. 20 dakika tırmanış; tepeden Kyoto manzarası ve serbest makaklar."],
        ["12:30", "Öğle — Arashiyama", "Yudofu (sıcak tofu) bölgenin klasiği."],
        ["15:00", "Kinkaku-ji (Altın Köşk)", "500 ¥. Otobüsle 40 dakika; 45 dakikada biter."],
        ["16:30", "Ryoan-ji taş bahçesi", "600 ¥. Zen kuru bahçenin en ünlü örneği; oturup sessizce bakılır."],
        ["18:30", "Dönüş ve akşam", "Nishiki pazarı çevresi ya da Kyoto İstasyonu yemek katı."],
      ],
      ipucu: "Arashiyama ve Kinkaku-ji şehrin iki ucunda ve arası otobüsle 40 dakika. Günlük otobüs kartı (1.100 ¥) bugün kesinlikle kârlı.",
    },
    {
      gun: 3, baslik: "Merkez ve kuzey", tema: "Saray, pazar, felsefe",
      bloklar: [
        ["09:00", "Nijo Kalesi", "1.300 ¥. Shogun sarayı; 'bülbül zeminleri' adım atınca ötüyor (suikast önlemi)."],
        ["11:00", "Kyoto İmparatorluk Sarayı", "Ücretsiz. Geniş çakıl avlular; rezervasyon artık gerekmiyor."],
        ["13:00", "Nishiki pazarı", "Ücretsiz. 'Kyoto'nun mutfağı'; tadımlık her şey var."],
        ["15:00", "Ginkaku-ji (Gümüş Köşk)", "500 ¥. Altın Köşk'ten sakin ve bahçesi daha güzel."],
        ["16:30", "Felsefe Yolu", "Ücretsiz. Kanal boyunca 2 km; sakura mevsiminde Japonya'nın en güzel yürüyüşü."],
        ["18:00", "Nanzen-ji + su kemeri", "600 ¥ (bahçe). Meiji dönemi tuğla su kemeri tapınağın içinden geçiyor."],
      ],
      ipucu: "Tapınakların çoğu 17:00'de kapanıyor. Kyoto'da akşam programı değil, sabahı uzatmak işe yarıyor.",
    },
    {
      gun: 4, baslik: "Nara", tema: "Günübirlik eski başkent",
      bloklar: [
        ["08:30", "Trenle Nara", "45 dakika; Kintetsu ya da JR."],
        ["09:30", "Todai-ji + Büyük Buda", "800 ¥. Dünyanın en büyük ahşap binalarından; 15 metrelik bronz Buda."],
        ["11:30", "Nara Parkı ve geyikler", "Ücretsiz. Kraker 200 ¥; geyikler selam veriyor, bazıları ısrarcı."],
        ["13:00", "Öğle — Naramachi", "Eski tüccar mahallesi; kakinoha-zushi (kaki yaprağında suşi)."],
        ["15:00", "Kasuga Taisha", "500 ¥. 3.000 taş ve bronz fener; orman içinde."],
        ["17:00", "Kyoto'ya dönüş", "Akşam Kyoto İstasyonu çatı terası."],
      ],
      ipucu: "Geyik krakerini elinde fazla tutma; sürü oluyor. Çantandaki kâğıtları da yiyorlar — harita ve bilet cepte dursun.",
    },
  ],

  // ===================== KAHİRE ===========================================
  kahire: [
    {
      gun: 1, baslik: "Giza", tema: "Piramitler ve yeni müze",
      bloklar: [
        ["08:00", "Giza Piramitleri — açılışta", "700 EGP. Sabah hem serin hem satıcılar henüz az."],
        ["10:00", "Keops'un içi (opsiyonel)", "900 EGP ek. Dar, dik, havasız; klostrofobin varsa girme."],
        ["11:00", "Sfenks", "Aynı bilete dahil; vadi tapınağından bakılıyor."],
        ["12:00", "Panorama noktası", "Üç piramidin aynı karede göründüğü tepe."],
        ["13:30", "Öğle — Giza", "Piramitlere bakan teraslı restoranlar; Khufu's ya da 9 Pyramids Lounge."],
        ["15:30", "Büyük Mısır Müzesi (GEM)", "1.500 EGP. Tutankamon hazinesinin tamamı; 4 saat gerçekten gerekiyor."],
        ["20:00", "Akşam — Zamalek", "Nil adası; şehrin en sakin ve modern bölgesi."],
      ],
      ipucu: "Piramitlerde deve/at teklifleri çok ısrarcı. Fiyatı binmeden, yazılı ve 'dönüş dahil' diye netleştir — yoksa tepede pazarlık başlıyor.",
    },
    {
      gun: 2, baslik: "Eski Kahire", tema: "Sakkara, Kıpti, çarşı",
      bloklar: [
        ["08:30", "Sakkara basamaklı piramidi", "600 EGP. Dünyanın en eski taş yapısı; Giza'dan 2.700 yıl önce."],
        ["11:00", "Dahşur — Kızıl ve Eğri Piramit", "Aynı bölgede; Kızıl Piramit'in içine girilebiliyor ve neredeyse boş."],
        ["13:30", "Öğle — dönüş yolu", "Yol üstü yerel lokantalar; koshari dene."],
        ["15:30", "Kıpti Kahire", "Asılı Kilise ve Ben Ezra Sinagogu; Roma kalesi surları içinde."],
        ["17:30", "Han El-Halili çarşısı", "Ücretsiz. Pazarlık zorunlu; ilk fiyatın üçte biri hedef."],
        ["19:00", "El Fishawy kahvesi", "250 yıllık kahvehane; nargile ve nane çayı."],
      ],
      ipucu: "Sakkara ve Dahşur için günlük şoför tut (~1.500 EGP). Toplu taşıma pratik değil ve taksi pazarlığı her durakta yeniden başlıyor.",
    },
    {
      gun: 3, baslik: "Luksor'a geçiş", tema: "Doğu yaka",
      bloklar: [
        ["07:00", "Kahire–Luksor uçuşu", "~4.000 EGP, 1 saat. Alternatif: gece treni 1.500 EGP, 10 saat yataklı."],
        ["10:00", "Otele yerleşme", "Nil kıyısı otelleri; batı yakası daha sakin."],
        ["11:00", "Karnak Tapınağı", "600 EGP. Sütunlu salon (Hypostyle) tek başına yolculuğa değer; 134 sütun."],
        ["14:00", "Öğle + mola", "Öğleden sonra sıcak; otelde dinlen."],
        ["17:30", "Luksor Tapınağı", "500 EGP. Akşam ışıklandırmalı; gündüzden çok daha etkileyici."],
        ["20:00", "Nil kenarı akşam", "Felucca (yelkenli) ile gün batımı turu ~300 EGP."],
      ],
      ipucu: "Luksor Tapınağı'nı akşam gör, Karnak'ı gündüz. İkisi aynı eksende ve eskiden sfenks yoluyla birbirine bağlıydı; yol restore edildi.",
    },
    {
      gun: 4, baslik: "Batı yaka", tema: "Krallar Vadisi",
      bloklar: [
        ["05:00", "Balon turu", "4.500 EGP. Gün doğumunda kalkar; Luksor'un en iyi deneyimi."],
        ["08:00", "Krallar Vadisi", "750 EGP (3 mezar). Tutankamon ayrı 700, Seti I ayrı 2.000 EGP."],
        ["10:30", "Hatşepsut Tapınağı", "440 EGP. Kayaya oyulmuş teraslar; gölge yok, erken git."],
        ["12:00", "Memnon Kolosleri", "Ücretsiz; yol kenarında iki dev heykel."],
        ["13:00", "Öğle + uzun mola", "Öğleden sonra 45°C; dışarı çıkma."],
        ["18:00", "Son akşam — Nil kenarı", "Luksor çarşısı; alabaster ve papirüs (çoğu sahte, hediyelik olarak al)."],
      ],
      ipucu: "Batı yakasını 06:00–12:00 arasında bitir. Öğleden sonra gerçekten dayanılmaz ve gölge hiç yok.",
    },
    {
      gun: 5, baslik: "Dönüş", tema: "Kahire ve veda",
      bloklar: [
        ["09:00", "Kahire'ye uçuş", "1 saat."],
        ["11:30", "Kahire Kalesi + Muhammed Ali Camii", "450 EGP. Şehrin tamamı ve açık havada piramitler görünüyor."],
        ["14:00", "Öğle — Khan el-Khalili ya da Zamalek", "Son koshari ya da mahşi."],
        ["16:00", "Son alışveriş", "Baharat, hibiskus (karkade), gümüş kartuş."],
        ["19:00", "Havalimanına hareket", "Trafik öngörülemez; 3 saat pay bırak."],
      ],
      ipucu: "Kahire trafiği gerçekten kaotik. Uber/Careem çalışıyor ve taksiden hem ucuz hem pazarlıksız; mutlaka uygulama kullan.",
    },
  ],

  // ===================== BANGKOK ==========================================
  bangkok: [
    {
      gun: 1, baslik: "Tapınaklar", tema: "Rattanakosin adası",
      bloklar: [
        ["08:00", "Büyük Saray + Zümrüt Buda", "500 THB. Açılışta git; 10:00'da hem sıcak hem kalabalık."],
        ["10:30", "Wat Pho — Yatan Buda", "300 THB. 46 metre uzunluğunda; geleneksel Tay masajının doğduğu yer."],
        ["12:00", "Wat Pho masaj okulu", "480 THB/saat. Kaynağında ve ucuz."],
        ["13:30", "Öğle — Tha Tien iskelesi", "Nehir kenarı; pad thai ve mango sticky rice."],
        ["15:00", "Tekneyle Wat Arun", "5 THB geçiş + 200 THB giriş. Porselen mozaikli kule."],
        ["17:30", "Chao Phraya ekspres teknesi", "Turuncu bayraklı hat 16 THB; nehirden şehir turu gibi."],
        ["20:00", "Akşam — Chinatown (Yaowarat)", "Asya'nın en iyi sokak yemeği caddelerinden; 18:00 sonrası kuruluyor."],
      ],
      ipucu: "Tapınak çevresinde 'bugün kapalı, size özel tur' diyen herkes dolandırıcıdır. Resmî girişe kadar yürü, kimseye kulak asma.",
    },
    {
      gun: 2, baslik: "Modern Bangkok", tema: "Pazar ve şehir",
      bloklar: [
        ["09:00", "Chatuchak pazarı (hafta sonu)", "Ücretsiz. 15.000 tezgâh; hafta içiyse Or Tor Kor gıda pazarına git."],
        ["13:00", "Öğle — pazar içi", "Tezgâh yemeği; kokonat dondurma kaçırılmaz."],
        ["15:00", "Jim Thompson Evi", "200 THB. Geleneksel Tay evi ve ipek koleksiyonu; şehrin ortasında vaha."],
        ["17:00", "Siam alışveriş bölgesi", "MBK, Siam Paragon; klimalı mola için de iyi."],
        ["19:30", "Çatı barı", "Lebua (Hangover filmi) ya da Vertigo; kıyafet kuralı var, şort/terlik girmiyor."],
        ["21:30", "Akşam — Thonglor ya da Khao San", "Thonglor yerel ve şık, Khao San sırt çantacı klasiği."],
      ],
      ipucu: "Çatı barlarında içki 400–600 THB. Gün batımına 30 dakika kala git; hem manzara en iyi hem masa bulmak kolay.",
    },
    {
      gun: 3, baslik: "Ayutthaya", tema: "Günübirlik eski başkent",
      bloklar: [
        ["07:30", "Trenle Ayutthaya", "20 THB (3. mevki), 1,5 saat. Hua Lamphong ya da Krung Thep Aphiwat'tan."],
        ["09:30", "Bisiklet kiralama", "50 THB/gün. Harabeler arası yürümek sıcakta imkânsız."],
        ["10:00", "Wat Mahathat", "50 THB. Ağaç köklerine sarılmış Buda başı; Tayland'ın en bilinen görüntüsü."],
        ["11:30", "Wat Ratchaburana + Wat Phra Si Sanphet", "Her biri 50 THB; eski kraliyet tapınakları."],
        ["13:00", "Öğle — nehir kenarı", "Boat noodle ve kung mae nam (dev tatlı su karidesi)."],
        ["15:00", "Wat Chaiwatthanaram", "50 THB. Nehir kıyısında Khmer tarzı; gün batımı için en iyisi."],
        ["18:00", "Bangkok'a dönüş", "Akşam yemeği Bangkok'ta."],
      ],
      ipucu: "Ayutthaya'da gölge yok ve 35°C. Şapka, güneş kremi ve 2 litre su; bisiklet olmadan bu rota yürünmez.",
    },
    {
      gun: 4, baslik: "Yüzen pazar ya da plaj", tema: "Son gün",
      bloklar: [
        ["07:00", "Amphawa / Damnoen Saduak yüzen pazarı", "Tur ~1.200 THB. Amphawa daha yerel, Damnoen daha fotojenik."],
        ["10:00", "Maeklong demiryolu pazarı", "Ücretsiz. Tren geçerken tezgâhlar katlanıyor; günde birkaç kez."],
        ["13:00", "Bangkok'a dönüş + öğle", "Son Tay yemeği."],
        ["15:00", "Tay masajı", "300 THB/saat. Uzun uçuş öncesi seyahatin en iyi 300 bahtı."],
        ["17:00", "Son alışveriş", "Terminal 21 ya da Chatuchak; baharat ve ipek."],
        ["19:00", "Havalimanına hareket", "Airport Rail Link 45 THB, 30 dakika; taksi trafikte 1,5 saat sürebiliyor."],
      ],
      ipucu: "Adalara devam edecekseniz Phuket/Krabi iç hat uçuşu 1,5 saat ve 1.200–2.200 THB. Şehir + plaj kombinasyonu bu rotanın doğal devamı.",
    },
  ],

  // ===================== MARAKEŞ ==========================================
  marakes: [
    {
      gun: 1, baslik: "Medina", tema: "Labirent ve meydan",
      bloklar: [
        ["09:30", "Bahia Sarayı", "100 MAD. 19. yüzyıl Fas zanaatının vitrini; avlular ve ahşap tavanlar."],
        ["11:00", "Saadi Mezarları", "100 MAD. 1917'ye kadar duvarla örülü kalmış; mermer ve çini işçiliği."],
        ["12:30", "Öğle — medina içi riad terası", "Tajine ve nane çayı; teraslar gürültüden kaçmanın yolu."],
        ["15:00", "Souk'lar", "Ücretsiz. Baharat, deri, metal işleri; pazarlık zorunlu ve ilk fiyatın %30–40'ı hedef."],
        ["17:00", "Ben Youssef Medresesi", "50 MAD. 14. yüzyıl Kuran okulu; restorasyon sonrası çok iyi durumda."],
        ["18:30", "Jemaa el-Fnaa", "Ücretsiz. 18:00'den sonra tezgâhlar kuruluyor; şehrin asıl gösterisi bu."],
        ["20:00", "Meydan terasında akşam", "Café de France ya da Le Grand Balcon; yukarıdan izlemek daha keyifli."],
      ],
      ipucu: "Meydanda fotoğraf çekersen (yılan oynatıcı, maymun, su satıcısı) mutlaka para isterler ve ısrarcı olurlar. Çekmeden önce düşün.",
    },
    {
      gun: 2, baslik: "Bahçeler ve hamam", tema: "Yavaş gün",
      bloklar: [
        ["09:00", "Majorelle Bahçesi + YSL Müzesi", "270 MAD kombine. Sabah ilk saat; öğlen tur grupları doluyor."],
        ["11:30", "Yeni şehir (Gueliz)", "Fransız dönemi mahallesi; kafeler ve çağdaş galeriler."],
        ["13:00", "Öğle — Gueliz", "Medina'dan daha modern ve daha sakin."],
        ["15:00", "Hamam + argan masajı", "300 MAD. Geleneksel hamam; riad'ında da yapılıyor."],
        ["17:30", "Menara Bahçeleri", "70 MAD. Zeytinlik ve havuz; arkada Atlas Dağları."],
        ["20:00", "Akşam — riad'da yemek", "Çoğu riad akşam yemeği veriyor ve genelde şehirdekinden iyi; önceden söyle."],
      ],
      ipucu: "Marakeş'te yorulmak kolay: ses, kalabalık ve sıcak üst üste biniyor. Her güne bir sakin blok koy, yoksa üçüncü gün bıkarsın.",
    },
    {
      gun: 3, baslik: "Atlas Dağları", tema: "Günübirlik doğa",
      bloklar: [
        ["08:30", "Imlil vadisine hareket", "450 MAD tur; 1,5 saat araç."],
        ["10:30", "Imlil köyü", "Toubkal tırmanışının başlangıç noktası; 1.740 metre."],
        ["11:30", "Berberi köyü yürüyüşü", "Katır eşliğinde vadide 2 saatlik yürüyüş."],
        ["13:30", "Berberi evinde öğle", "Ev yapımı tajine; tur fiyatına dahil olabiliyor."],
        ["15:30", "Şelale ya da Asni pazarı", "Mevsime göre program değişiyor."],
        ["18:30", "Marakeş'e dönüş", "Akşam medina'da."],
      ],
      ipucu: "Atlas yerine çöl istiyorsan Agafay (45 dakika, 600 MAD) taşlık çöl — kum tepesi değil ama gün batımı ve gökyüzü gerçek. Sahra için 3 gün gerekiyor.",
    },
    {
      gun: 4, baslik: "Essaouira ya da veda", tema: "Okyanus ya da alışveriş",
      bloklar: [
        ["08:30", "Essaouira'ya hareket (opsiyonel)", "2,5 saat; otobüs 100 MAD. Okyanus kıyısında rüzgârlı liman kasabası."],
        ["11:00", "Essaouira medinası ve limanı", "UNESCO listesinde; Marakeş'ten çok daha sakin."],
        ["13:00", "Öğle — limanda balık ızgara", "Tezgâhtan seçip pişirtiyorsun; fiyatı önceden netleştir."],
        ["16:00", "Marakeş'e dönüş", "Ya da şehirde kalıp son alışveriş."],
        ["19:00", "Havalimanına hareket", "Menara havalimanı merkeze 15 dakika."],
      ],
      ipucu: "Dirhem ülke dışına çıkarılamıyor. Dönüşte elinde kalmasın; havalimanında bozdurma kuru kötü.",
    },
  ],
};

// Alp & Güney Almanya — sonradan eklenen şehirler.
Object.assign(ROTALAR, {
  salzburg: [
    {
      gun: 1, baslik: "Eski şehir ve kale", tema: "Mozart'ın Salzburg'u",
      bloklar: [
        ["09:00", "Hohensalzburg Kalesi", "Füniküler ilk sefer; kale avlusundan Alpler ve şehir."],
        ["11:30", "Salzburg Katedrali", "Barok katedral; Mozart burada vaftiz edildi."],
        ["12:30", "Öğle — St. Peter Stiftskeller", "803'ten beri açık olduğu söylenen restoran; Wiener Schnitzel."],
        ["14:00", "Getreidegasse & Mozart'ın Doğduğu Ev", "Demir tabelalı sokak ve sarı cepheli ev."],
        ["16:30", "Salzach kıyısı & Makartsteg", "Aşk kilitli köprüden eski şehir silüeti."],
        ["17:30", "Mirabell Bahçeleri", "Do-Re-Mi merdivenleri; arkada kale manzarası."],
        ["19:30", "Akşam — Augustiner Bräu", "Manastır birahanesi; kendi tabağını büfeden alıyorsun."],
      ],
      ipucu: "Salzburg Card'ı bu sabah başlat: kale, Mozart evi ve yarın Untersberg aynı karta sığıyor.",
    },
    {
      gun: 2, baslik: "Saraylar ve dağ", tema: "Hellbrunn & Untersberg",
      bloklar: [
        ["09:30", "Hellbrunn Sarayı", "Şaka çeşmeleri turu 40 dakika; ıslanmaya hazır ol."],
        ["12:00", "Öğle — Hellbrunn çevresi", "Sarayın bahçesinde kafe."],
        ["13:30", "Untersberg teleferiği", "1.800 metre; zirveye kısa yürüyüş."],
        ["17:00", "Şehre dönüş — Linzer Gasse", "Sağ yakanın daha sakin alışveriş sokağı."],
        ["19:30", "Akşam — Mozart Dinner Concert ya da Kapuzinerberg'de gün batımı", "Klasik müzik isteyenler için yemekli konser."],
      ],
      ipucu: "Hallstatt'a geçeceksen Hellbrunn'u kısalt; Hallstatt'ta bir gece kalmak gündüz gezisinden çok daha değerli.",
    },
  ],
  hallstatt: [
    {
      gun: 1, baslik: "Köy, tuz madeni ve Skywalk", tema: "Hallstatt'ın kendisi",
      bloklar: [
        ["08:30", "Varış ve köy turu", "Günübirlikçiler gelmeden göl kıyısı ve Marktplatz."],
        ["09:30", "Klasik fotoğraf noktası", "Köyün kuzey ucu; sabah ışığı en iyisi."],
        ["10:30", "Füniküler → Skywalk", "Dünya Mirası seyir terası."],
        ["11:00", "Salzwelten tuz madeni", "Madenci kaydıraklarıyla iniş, yeraltı tuz gölü."],
        ["14:00", "Öğle — göl kenarında balık", "Hallstätter See alabalığı (Reinanke)."],
        ["15:30", "Kemik Evi (Beinhaus)", "Kilise bahçesindeki boyanmış kafatasları."],
        ["17:00", "Göl tekne turu / kayık", "Köyü sudan görmek."],
        ["19:30", "Akşam — boşalan köyde yürüyüş", "Son otobüsler gidince Hallstatt bambaşka."],
      ],
      ipucu: "Gece burada kalmak bu rotanın asıl sırrı; konaklama aylar öncesinden dolduğu için erken rezervasyon şart.",
    },
    {
      gun: 2, baslik: "Dachstein ve Gosausee", tema: "Alp manzarası",
      bloklar: [
        ["08:30", "Obertraun → Dachstein teleferiği", "Hallstatt'tan 10 dakika."],
        ["09:30", "5 Parmak platformu", "Uçurumdan sarkan beş seyir parmağı."],
        ["11:00", "Dachstein Buz Mağarası", "Yazın bile 0°C; mont şart."],
        ["13:30", "Öğle — Obertraun", "Göl kıyısında hafif bir öğle."],
        ["15:00", "Gosausee", "Dachstein buzullarına bakan göl; göl etrafı 1 saatlik yürüyüş."],
        ["18:00", "Salzburg'a ya da Viyana'ya dönüş", "Araçla 1,5 saat Salzburg."],
      ],
      ipucu: "Teleferik çalışma saatleri mevsime göre değişir ve rüzgârda kapanabilir; sabah kontrol et.",
    },
  ],
  heidelberg: [
    {
      gun: 1, baslik: "Kale ve eski şehir", tema: "Romantik Heidelberg",
      bloklar: [
        ["09:30", "Bergbahn ile kaleye", "Kornmarkt'tan füniküler."],
        ["10:00", "Heidelberg Kalesi + Büyük Fıçı", "221.000 litrelik fıçı ve Eczacılık Müzesi."],
        ["12:00", "Königstuhl", "Aynı biletle üst istasyon; orman ve Neckar vadisi."],
        ["13:30", "Öğle — Eski Şehir", "Zum Roten Ochsen gibi öğrenci tavernaları."],
        ["15:00", "Üniversite & Öğrenci Hapishanesi", "Almanya'nın en eski üniversitesi."],
        ["16:30", "Hauptstraße", "Kutsal Ruh Kilisesi ve meydan."],
        ["18:30", "Eski Köprü → Filozoflar Yolu", "Gün batımında kaleye karşıdan bakış."],
        ["20:30", "Akşam — Untere Straße", "Şehrin bar sokağı."],
      ],
      ipucu: "Filozoflar Yolu'na Schlangenweg (yılan yolu) ile çık; dik ama kısa, üstü düz ve manzaralı.",
    },
    {
      gun: 2, baslik: "Neckar vadisi", tema: "Nehir ve çevre",
      bloklar: [
        ["10:00", "Neckar tekne turu", "Neckarsteinach'ın dört kalesine nehir yolculuğu."],
        ["13:00", "Öğle — Neckarsteinach", "Nehir kenarı lokanta."],
        ["15:00", "Schwetzingen Sarayı bahçeleri", "Barok bahçe ve 'camii' yapısı; trenle 20 dakika."],
        ["18:00", "Frankfurt'a geçiş ya da dönüş", "Havalimanına doğrudan otobüs."],
      ],
      ipucu: "Heidelberg'i Frankfurt'la birleştirmek mantıklı; iki şehir arasında tren her saat.",
    },
  ],
  stuttgart: [
    {
      gun: 1, baslik: "Otomobil günü", tema: "Mercedes ve Porsche",
      bloklar: [
        ["09:30", "Mercedes-Benz Müzesi", "En üst kattan başlayan spiral rota; 3 saat ayır."],
        ["12:30", "Öğle — müze restoranı ya da Bad Cannstatt", "Maultaschen dene."],
        ["14:00", "Porsche Müzesi", "S-Bahn ile Zuffenhausen; 2 saat."],
        ["17:00", "Schlossplatz & Königstraße", "Merkez meydan ve alışveriş caddesi."],
        ["19:30", "Akşam — Bohnenviertel", "Eski şehrin restoran ve şarap evleri."],
      ],
      ipucu: "Mercedes müzesinde sesli rehber biletle geliyor ve gerçekten iyi; atlamamak lazım.",
    },
    {
      gun: 2, baslik: "Bağlar ve saray", tema: "Swabya'nın sakin yüzü",
      bloklar: [
        ["09:30", "Ludwigsburg Sarayı", "S-Bahn ile 15 dakika; rehberli saray turu."],
        ["13:00", "Öğle — Markthalle", "Art nouveau pazar binası."],
        ["14:30", "Bağ yolu — Rotenberg", "Württemberg şapeline yürüyüş; şehir ve Neckar manzarası."],
        ["17:30", "TV Kulesi", "Gün batımında Swabya Alpleri."],
        ["19:30", "Akşam — Besenwirtschaft", "Bağcının kendi evinde açtığı mevsimlik şarap evi."],
      ],
      ipucu: "Besenwirtschaft'lar yılın belli haftalarında açık; kapıda süpürge asılıysa açık demektir.",
    },
  ],
});

export const rota = (sehirId) => ROTALAR[sehirId] || [];

