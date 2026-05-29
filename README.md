# ULTRAKILL Task Engine

## Nedir?
ULTRAKILL Task Engine, kişisel görevlerinizi (verimliliğinizi) yönetmeniz için tasarlanmış hiper-aktif bir uygulamadır. ULTRAKILL oyununun mekaniklerinden ilham alınarak, zaman kısıtı, kan ("blood as time") ve başarısızlık cezası (Cyber Grind) üzerine kurulmuştur. 0 bağımlılıkla (Sıfır Node.js, Sıfır npm, Sıfır Pip vb.) ve tamamen Python standart kütüphanesi + Vanilla JavaScript (Web Components) ile "KISS (Keep It Simple, Stupid)" prensibi kullanılarak inşa edilmiştir.

## Temel Kurallar (Mekanikler)
1. **KAN İS YAKIT (Blood is Fuel):** Klasik bir görev uygulamasındaki "zamanınız", burada kanınızdır (100 üzerinden başlar). Her **saniye 1 kan** kaybedersiniz. Sistemden çıksanız da arka planda düşmeye devam edebilir (Sunucu açıkken).
2. **GÖREVLER ve STYLE RANK:** Görevleri tamamladığınızda kan kazanırsınız. Ancak kazandığınız kan miktarı, görevi *ne kadar hızlı* tamamladığınıza bağlıdır. Vaktinden ne kadar erken tamamlarsanız **Style Rank**'iniz artar (SSS, SS, S, A, B, vb.) ve kan ödülünüz katlanır.
3. **CYBER GRIND (CEZA DURUMU):** Eğer görevi ihmal edip kanınızı **0'a** düşürürseniz "Cyber Grind" adı verilen ceza durumu başlar. Ekrandaki tüm görevlerin yerleri karışır ve görsel efektler arayüzü bozar. Aynı zamanda arka planda bir "Cezalandırma İblisi (Punishment Daemon)" devredeyse siteler bloklanabilir, programlar kapatılabilir veya ekran kilitlenebilir. *Tek çözüm, hızlıca bir görevi bitirmektir.*
4. **CEHENNEM KATLARI (Layers of Hell):** Önünüzdeki görevler cehennemin farklı katmanlarında (Prelude, Limbo, Lust...) bulunur. Bir katmanda görev tamamlarsanız bir sonraki katmanın kilidini açarsınız.

## Nasıl Kurulur ve Çalıştırılır?

Herhangi bir indirme, paket vs. kurmanıza gerek yoktur, sadece Python 3 gereklidir:

```bash
# Sadece iki terminal açmanız gereklidir.

# Terminal 1: Ana Sunucu (Data Storage ve Frontend Engine)
python3 server.py 
# (Yada `python server.py`)
```

Eğer bilgisayarınız içinde de gerçek dünyadan cezalar istiyorsanız (ekranınızın kitlenmesi vb.) ikinci terminali açın:
```bash
# Terminal 2: Punishment Daemon (Opsiyonel)
sudo python3 punishment_daemon.py 
```

Sunucuyu çalıştırdıktan sonra tarayıcınızdan **`http://localhost:8000`** adresine giderek sistemi kullanmaya başlayabilirsiniz.

## Proje Yapısı (Neden KISS?)
Hiçbir karmaşık framework kullanılmadı:
- Sunucu sadece Python'ın gömülü `http.server` ve `sqlite3` paketlerini kullanır.
- Tüm statik dosyalar ve sayfalar JavaScript'in Shadow DOM ve Vanilla CSS modülleri üzerinden yönetilir, Tailwind vb. çöp yığını kullanılmaz. Dosyalar direkt okunur ve renderlanır, paketlenmeye ihtiyaç duymadan da en hızlı performansı sunar.
- Veri senkronizasyonu her yenilendiğinde IndexedDB + SQLite ikilisi arasında en pratik halinde çözümlenir.

# Yol Haritası

- [ ] **Gerçek dünyadan cezaların boyutunu arttırmak için çeşitli mikroçip destekleri eklenecektir.Bu sayede en basitinden elektrik,ısı,ses veya flash verebilirsiniz kendinize.**
- [ ] **Sisteme tanımladığınız görevi gerçekten yapıp yapmadığınızı gerçek zamanlı kontrol eden hafif bir gözlem mekanizması eklencek.Hem dahili hem de harici olarak;yazılımla veya donanımla kontrol edebileceksiniz,konfigüre edebileceksiniz.**
- [ ] **Arayüzün kullanışlığı,fonksiyonları arttırılacak**
- [ ] **Android & ios desteği eklenecek,native şekilde çalışacak.İşletim sistemlerinin kendilerine has avantajlarını birer cezalandırma sistemine dönüştüren mekanizmalar eklenecek.**
- [ ] **Akıllı evi olan kullanıcılar için akıllı ev sistemlerini de yönetip kontrol edebilen sistem getirilecek.Bu mekanizma her zaman bir STOP butonuna sahip olacak ACİL DURUMLAR için ancak normal şartlar da kullanıcı normal şekilde sistemi durduramayacak çünkü amaç zaten sistemin,sistematik şekilde ilerleyebilmesi.**
- [ ] **Uzaktan kontrol mekanizması getirilecek**
- [ ] **Kullanıcının yaptığı görev her neyse,o görevde onun görevi yapmasını engelleyen,vaktini çalan her şey geçici olarak görev bitene kadar imha edilecek ve erişilemeyecek görev süresi boyunca.İstenirse görev başarısız biterse o imha edilen şeyler sonsuza kadar geri kurtarılamaz şekilde imha etme ayarı da bulunacak ve aktif edilebilecek**
- [ ] **Bol sayıda minimal animasyon ve ses efekti eklenecek**
- [ ] **Kullanıcının kamera ve mikrofon donanımı yoksa telefonunu kamera ve mikrofon olarak native kullanabilmelerini sağlayan arayüz ve sistem getirilecek**
- [ ] **Bulut senkranizasyon özelliği eklenecek.Bu sayede kullanıcı istediği gibi verilerini,ilerlemesini ve her şeyini istediği gibi bulut depolama hizmetlerine ya da kendi self host hizmetlerine yükleyip,gerçek zamanlı olarak eşitleyebilecek.**
- [ ] **GeforceNow tarzında uzaktan erişilebilir,oynanılabilir ve ceza sistemleri aktif bir şekilde çalışabilir sistem de getirilecektir**
- [ ] **Giyilebilir teknoloji destekleri getirilecektir ve giyilebilir teknolojilerinizi de bizzat birer CEZALANDIRMA aracı olarak kullanabileceksiniz.İsteğe bağlı olarak,donanımın size zarar vermesini de ayarı aktifleştirerek sağlayabilirsiniz.Ancak varsayılan olarak bu ayar kapalı gelecektir ve %100 çalışma garantisi kesinlikle olmayacaktır.Çünkü bu ileri seviye donanım kontrolü ve hakimiyeti gerektireceği için donanımınızı bir nevi kırmanız gerecektir.**
- [ ] **Linux da native çalışacak (Dağıtım veya paket yöneticisi farketmeksizin) masaüstü uygulaması getirilecektir.Kullanışlı işlevlere ve arayüze sahip olacaktır.Örneğin en basitinden görüntü işleme,ses işleme,gerçek zamanlı olarak sizinle konuşabilme (voice mod),tanımladığınzı görevi yapmakan kaytarmaya çalıştığınızda yaptığınız eylemi yok etme kill etme veya eylemi kontrol etme ve çok daha fazlası eklenecektir**
- [ ] **Dökümantasyon yazılacak ve iyileştirilecektir**
- [ ] **KISS prensibi üzerine daha çok durulacak ve sistem mimarisi,dizaynı,tasarımı ve kullanıcı deneyimi iyileştirilecektir.** 

**Kan kaybınız yavaş, tarzınız kusursuz olsun!**
