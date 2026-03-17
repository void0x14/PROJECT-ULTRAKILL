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

**Kan kaybınız yavaş, tarzınız kusursuz olsun!**
