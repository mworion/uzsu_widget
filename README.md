#UZSU Widget

###JAVA Script Widget for use in smarthome / smartvisu environment in combination with uzsu plugin
(C) Michael Würtenberger 2014,2015

Aktuell 

develop v1.8
changelog:
- Bugfix Sortierung: alle zustände sollten jetzt erhalten bleiben

develop v1.71
changelog:
- Browserdarstellung input type time auf iPad
  Für Design Type = '0' bleibt es beim verhalten (man kann die Stings ja ohnehin nicht lesen)
  Für Design Type = '1','2' ist der Input typ ="text". Damit bleiben die Stings auch beim iPad erhalten.

develop 1.7
changelog:
- code cleanup in visu.js und widget_uzsu.html 

develop v1.6
changelog:
- code cleanup
- naming parameter (sprechend)
- angleichen widget_uzsu.html und visu.js
-> bitte beide updaten.
- bug fixes.
- add browser identifiction variables

develop v1.5
changelog:
- umsetzung valueType = 'list'
- umsetzung valueType = 'text'
- es wurden 2 Klassen explizit gesetzt, damit man über .css die Breite des Zeit und des Value Feldes verändern kann.
- Die Erweiterungen gibt es in allen Designs '0','1','2'.
- update widget_uzsu.html
- einschränkung rückwärtskompatibilität wegen parameteränderung

develop v1.4
changelog:
- breite time feld bei customFormat 0 einstellbar über css

develop v1.3
changelog:
- fehlerbehebung

develop v1.2
changelog:
- code cleanup und vertelen zum Test

develop v1.1
changelog:
- RPC Calls mit Suche auf #uzsuPopupContent anstelle .messagePopup
  referenziert. Damit Eindeutigkeit in der Referenzierung der Popups.
- Überarbeitung Save / Quit.
- data-overlay-theme='b' data-theme='a' in Zeile 31

## wichtig !!!
Das Format der Parameter hat sich für die Texte On / Off geändert. 
Beide Parameter werden nicht mehr als einzelstring übergeben, sondern als Liste.
Das ist notwendig, um für die Darstellung Liste auch längere Listen zu übergeben.
Ebenfalls von 1.5 auf 1.6 das Naming der Parameter (Angleichen). Wenn beide Dateien 
im Update laufen keine Änderung notwendig ! 

Hallo,

ich hatte schon mehrere Anfragen zu Problemen mit der Installation, daher hier im Forum eine Schritt für Schritt Anleitung zur Installation des UZSU Widgets:
Absprungbasis ist das installierte (und in Eurer smarthome.py funktionierende) UZSU Plugin. Also items konfiguriert usw. und auch mal im interaktiven Modus mal probiert, ob sich die Schaltuhr programmieren läßt (smarthome.py -i).

1. Download von visu.js und uzsu.html aus Github: https://github.com/mworion/uzsu_widget
2. Beide Dateien in das Projektverzeichnis Eurer Visu hineinkopieren. Das müßte unter /www/smartvisu/pages/"name des Projektes" liegen.
3. Einbinden des Widgets in Eure Seite mit
<pre>
	{% import "widget_uzsu.html" as uzsu %}
</pre>
das packt ihr am besten unter die Zeilen
<pre>
	{% extends "rooms.html" %}
	{% block content %}
</pre>
4. Anlegen eines UZSU Symbols, ich habe da mein Standardtestbeispiel genommen.
<pre>
	{{ uzsu.uzsu_icon('eg.ez.decke.01', 'eg.ez.decke.uzsu', 'Esszimmerlampe') }}
</pre>
5. Die Parametrierung des Widgets findet Ihr ebenfalls in der widget_uzsu.html Datei. Einfach mal reinschauen.
6. Anschliessen Reload der Seite im Browser, dann sollte das Popup kommen.

Michel

PS: Wenn Ihr die Visu per Automatik erstellen lasst, dann löscht die vorher die Inhalte. Geht aus meiner Sicht nur, wenn Ihr eure Visu von Hand zusammenbaut.

PPS: Wenn ihr schon eine visu.js verwendet für andere Dinge, dann müßt ihr die sinnvoll zusammenfügen (aneinanderhängen).