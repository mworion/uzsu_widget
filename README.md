#UZSU Widget

###JAVA Script Widget for use in smarthome / smartvisu environment in combination with uzsu plugin
(C) Michael Würtenberger 2014,2015

Aktuell 
develop v2.95  

Installation:
1. Download von visu.js und widget_uzsu.html aus Github
Link: https://github.com/mworion/uzsu_widget

2. Beide Dateien in das Projektverzeichnis Eurer Visu hineinkopieren. 
Das müßte unter /www/smartvisu/pages/"name des Projektes" liegen.
Es gibt auch eine .css, die Ihr benötigt um z.B. beim Chrome Browser die Feldbreite zu vergößern. 
Muß aber nicht zwingend genutzt werden.

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

6. Anschliessend reload der Seite im Browser, dann sollte das Popup kommen.

7. Stimmt etwas nicht, bitte erst einmal die Fehlerkonsole in Eurem Browser aktivieren und nach den Meldungen
schauen. Zu 95% findet Ihr dort die Lösung.  

Wichtig: das widget mach funktional in Bezug auf das schalten gar nichts! Die eigentliche Funktion ist im UZSU Plugin 
umgesetzt.

Was kann das widget:
2 unterschiedliche design typen:
'0' = standard mode
Anzeige der UZSU mit Zeit und Wochentagsauswahl
'1' = expert mode
Hier können die strings für time und rrule für das plugin direkt eingegeben werden.

Es können untesrchiedliche Werte gesetzt werden und auch die Darstellung per Parameter konfiguriert werden:
<pre>
/**
* Widget for usage of uzsu plugin
* (c) Michael Würtenberger 2014, 2015
*
* develop v2.9
*
* läuft zusammen mit dem visu.js ab v2.8 
*
* @param unique id for this widget
* @param a gad/item
* @param headline for popup (optional), default UZSZ
* @param designType for popup design (optional), default = '0', 
*												 expert mode = '1'  (value, time, rrule direct input)
* @param pic on (optional), default = clock
* @param pic off (optional), default = clock
* @param valueType (optional), default = bool, supported types are 'bool', 'num', 'text', 'list'
* @param valueParameterList (optional), default set in js depending on valueType
*/
</pre>

Viel Spaß

Michel
