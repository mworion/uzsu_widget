#UZSU Widget

###JAVA Script Widget for use in smartvisu environment in combination with uzsu plugin for smarthome or FHEM environment
(C) Michael Würtenberger 2014,2015,2016

Stand: v 5.0
Erweitert um das Setzen von Conditions und Holiday Funktion im FHEM Umfeld
Für FHEM wird künftig der designType = '2' verwendet. Darstellung entspicht default, erweitert um die Funktionen für FHEM
Der DesignType = 1 (Expert Mode) ist entfallen (kein Bedarf)

Installation:
1. Download von visu.js und widget_uzsu.html aus Github
Link: https://github.com/mworion/uzsu_widget

2. Beide Dateien in das Projektverzeichnis Eurer Visu hineinkopieren. 
Das müßte unter /www/smartvisu/pages/"name des Projektes" liegen.
Bei der Installation für FHEM, bitte dortiges Wiki bemühen

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

6. Anschliessend Reload der Seite im Browser, dann sollte das Popup kommen.

7. Stimmt etwas nicht, bitte erst einmal die Fehlerkonsole in Eurem Browser aktivieren und nach den Meldungen
schauen. Zu 95% findet Ihr dort die Lösung.  

Wichtig: das widget mach funktional in Bezug auf das schalten gar nichts! Die eigentliche Funktion ist im UZSU Plugin 
umgesetzt.

Es können unterschiedliche Werte gesetzt werden und auch die Darstellung per Parameter konfiguriert werden:
<pre>
Parametersatz für UZSU.UZSU_ICON:
(Eindeutige ID des Widgets, Item der UZSU in smarthome, Überschrift Popup, Erscheinungsbild Popup, 
    Bild UZSU Aktiv, Bild UZSU Inaktiv, Werte Typ, Parameterliste Werte)

Optionen Erscheinungsbild Popup:
0: Standard. Es wird Wert, Zeit HH:MM, Wochentage zur Auswahl, Zeile Aktiv behandelt.
2: FHEM Modus. Wie Standard, jedoch werden zusätzliche Eingaben für FHEM ermöglich in der Expertenzeile.
 
Optionen Werte Typ wählt die Werteingabe im Popup aus:
bool:   Slideranzeige. 
num:    Numerisches Eingabefeld.
text:   Texteingabefeld.
list:   Stellt Pull-Down Liste dar.  

Optionen Parameterliste Wert:
Werte Typ    Parameter                Beschreibung: 
bool         ['text on','text off']   'text off' wird bei Bool=0,False,Off angezeigt   
                                      'text on'  wird bei Bool=1,True,On angezeigt
             ['W1:x1','W2:x2']        Die Strings 'Wert1' und 'Wert2' werden im Slider gezeigt und x1 bzw. x2 als Wert gesetzt

num          ['min max step']         'string' zum Setzen der Eingabeparameter bei z.B. <input type="number" step="0.01" min="0" >
                                      siehe auch http://www.w3.org/TR/html-markup/input.number.html#input.number.attrs.step.float
text         []                       keine Parameter werden verwendet
list         ['Wert1','Wert2']        Die Strings 'Wert1' und 'Wert2' werden in der Auswahlliste gezeigt und so als Wert gesetzt
             ['W1:x1','W2:x2']        Die Strings 'Wert1' und 'Wert2' werden in der Auswahlliste gezeigt und x1 bzw. x2 als Wert gesetzt
             
</pre>

Nochmal die Parameter im Widget:
<pre>
/**
* Widget for usage of uzsu plugin
* (c) Michael Würtenberger 2014, 2015, 2016
*
* responsive v 5.0
*
* läuft zusammen mit dem visu.js (responsive) ab v5.0
* umstellung auf smartvisu v2.8
*
* @param unique id for this widget
* @param a gad/item
* @param headline for popup (optional), default UZSZ
* @param designType for popup design (optional), default = '0', 
*												 FHEM = '2', like default
* @param pic on (optional), default icon is a clock
* @param pic off (optional), default icon is a clock
* @param valueType (optional), default = bool, supported types are 'bool', 'num', 'text', 'list'
* @param valueParameterList (optional), default set in js depending on valueType
* @param optional color
*/


{% macro uzsu_icon(id, gad_uzsu, gad_headline, gad_designType, pic_on, pic_off, gad_valueType, gad_valueParameterList, gad_color) %}
</pre>

Viel Spaß

Michel
