#UZSU Widget

###JAVA Script Widget for use in smarthome / smartvisu environment in combination with uzsu plugin
(C) Michael Würtenberger 2014,2015

Aktuelle Development: 1.7

changelog: code cleanup in visu.js und widget_uzsu.html 

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