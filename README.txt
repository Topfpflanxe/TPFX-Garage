TPFX GARAGE – neue Website
==========================

Dateien
-------
index.html   Inhalt und Struktur
style.css    komplettes Design (Akzentfarbe: ganz oben bei --accent ändern)
script.js    Animationen, Projekt-Reihe, Bilderkette, Lightbox
images/      alle Bilder (aktuell Platzhalter)

Bilder austauschen
------------------
Die Platzhalter im Ordner "images" haben die Namen deiner alten Bilder.
Einfach die echten Bilder mit exakt dem gleichen Dateinamen drüberkopieren,
dann musst du am Code nichts ändern.

Datei                    Wo es erscheint
-----------------------  ----------------------------------------
TPFX_GARAGE_Black1.png   Logo im Hero, Tab-Icon
TPFX_Garage_Black.png    Logo im Footer
AI-Profil.jpg            Foto bei "Über uns"
e46_Original.png         Projekt-Reihe, Bild 1 (Forest)
e46_Sunny.png            Projekt-Reihe, Bild 2 (Sun)
e46_Profil.png           Projekt-Reihe, Bild 3 (Perspective)
e46_04.png               Projekt-Reihe, Bild 4 (NEU)
e46_05.png               Projekt-Reihe, Bild 5 (NEU)
JACKE.png                Zipper Jacke (ein Bild, Vorder- + Rückseite)
JACKE_college.png        College Jacke (ein Bild, Vorder- + Rückseite)
x3_alt.png               BMW X3 Side Project, alte Version (Regler ganz rechts)
x3_neu.png               BMW X3 Side Project, neue Version (Regler ganz links)
polo.png                 VW Polo
e46_Front.png            Bilderkette 1
e46_Side.png             Bilderkette 2
kette_3.png              Bilderkette 3 (NEU)
kette_4.png              Bilderkette 4 (NEU)
kette_5.png              Bilderkette 5 (NEU)

Wichtig: Gross-/Kleinschreibung der Dateinamen muss stimmen (Netlify unterscheidet das).
Bei .jpg statt .png musst du den Namen in index.html anpassen.

Texte ändern
------------
Alle Texte stehen in index.html. Die Platzhalter-Texte "Hier kommt dein Text rein."
bei den Projekt-Bildern kannst du dort direkt ersetzen.

Online stellen
--------------
Den ganzen Ordner (index.html, style.css, script.js, images) bei Netlify per Drag & Drop
hochladen, genau wie bei deiner alten Seite.

Hinweis Schriften
-----------------
Die Schriften (Anton, Inter, Space Mono) werden von Google Fonts geladen.
Für eine Seite in Deutschland ist es datenschutzrechtlich sauberer, die Schriften
lokal im Ordner mitzuliefern (z. B. über google-webfonts-helper herunterladen)
und per @font-face in style.css einzubinden.
