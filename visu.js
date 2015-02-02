// 
// Neugestaltetes UZSU Widget zur Bedienung UZSU Plugin
//
// Release 1.3 - beta
//
// Darstellung der UZSU Einträge und Darstellung Widget in Form eine Liste mit den Einträgen
// Umsetzung
// (c) Michael Würtenberger 2014,2015
// 
//  APL 2.0 Lizenz
//
// Basis der Idee des dynamischen Popups übernommen von John Chacko
// 		jQuery Mobile runtime popup
// 		16. November 2012 · 0 Comments	 
// 		http://johnchacko.net/?p=44
//
// und für die Anwendung in der smartvisu neu geschrieben.
//
// als erstes wird die callbacks der seite für das Schaltuhr Icon (uzsu.icon) geändert 
// 		- für den status, damit man bei aktiver Schaltuhr das sofort sehen kann
// 		- für die Auswahl des Icons, damit ein Popup ausgemacht wird, um die Einträge zu editieren
//
// durch den dispatcher für die customFormat kann man sich auch selbst eine anpassung oder
// überarbeitung schreiben ohne auf die basis zu verzichten. einfach ein typ kopieren und anpassen
// 

// Kopf und überschrift des Popups
function uzsuBuildTableHeader(headline, customFormat){
	
	var template = "";
	// hier kommt der popup container mit der beschreibung ein eigenschaften
	template += "<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupContent' data-dismissible = 'false'>"; 
	// Schliessen Button rechts oben
	template += "<div data-rel='back' data-role='button' data-icon='delete' data-iconpos='notext' class='ui-btn-right' id='uzsuCancel'><\/div>";	
	// jetzt der inhalt geklammert mit span
	template += " <span> <div style='text-align:center'><h1>" + headline + "<\/h1><\/div>";
	// und dann der aufbau mit einer tabelle. Hier muss im 2. schritt dir formatierung über span laufen
	// um eine anpassung auf die aktuellen notation hinzubekommen. tabelle wird nicht ganz zukunftsweisend sein
 	template += "<table id='uzsuTable' style = 'border: 1px solid;padding-right: 3px;padding-left: 3px'> ";
 	// generell gibt es dann dispatcher für die einzelnen formate. ich fasse sie zusammen, wo immer es geht. 
 	// hier kann man auch die formate für sich selbst erweitern und anpassen. 
	switch(customFormat[0]){
		// format 0 ist der default, macht wochentage, eine konfigurierbar eingabe des wertes und die aktivierungen
		case '0':{
 			template += "<tr> <td>Value<\/td><td>Time<\/td><td>Weekdays<\/td><td>Active<\/td><td>Remove<\/td> <\/tr>";
 			break;
		}
		// format 1 ist der expertenmodus, hier kann man in einem textstring de facto alles auswerten
		case '1':{
			template += "<tr> <td>Value<\/td><td>Time (flex)<br>RRULE<\/td><td>Active<\/td><td>Remove<\/td> <\/tr>";
			break;
		}
		// format 2 ist ein hybrid aus 1 und 2
		case '2':{
 			template += "<tr> <td>Value<\/td><td>Time / Weekdays<\/td><td>Active<\/td><td>Remove<\/td> <\/tr>";
 			break;
		}
		
	}
    return template;
}
// Tabelleneinträge
function uzsuBuildTableRow(numberOfRow, customFormat){

	var template = "";
	// liste für die wochentage, damit ich später per index darauf zugreifen kann
	var weekDays =['MO','TU','WE','TH','FR','SA','SU'];
	// auch hier wieder der dispatcher für die formate
	switch(customFormat[0]){
		case '0':{
				template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
				// jetzt beginnen die spalten in der reihenfolge value, time / rrule, active, delete button
				// mit flipswitch (bessere erkennbarkeit, die Texte können über das widget gesetzt werden
				// unterscheidung nur ob bool oder num, wobei num int ist !
				if(customFormat[1]=='bool'){
					template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + customFormat[3]+ "<\/option> <option value='1'> " + customFormat[2]+ " <\/option><\/select><\/td>";
				}
				else if(customFormat[1]=='num'){
					template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
				}
				else if(customFormat[1]=='text'){
						template += "<td><input type='text' data-clear-btn='false' style = 'width:60px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
				}
				// time
				// bei der darstellung der time als HTML5 format ist besonders beim chrome browser die darstellung mit
				// zusätzlichen elementen, die dann die eingabebreite effektiv reduzieren. ich haben keine möglichkeit gefunden
				// dieses verhalten zu umgehen / disablen. wers braucht, kann mit der erhöhung der breite im style dieses so anpassen
				// dass eine gut sichtbare lösung entsteht (zu lasten der gesamtbreite= werte um width = 80px schenen ganz gut zu sein.
				template += "<td><input type='time' data-clear-btn='false' style='width:40px' id='uzsuEntryTime" + numberOfRow +"'><\/td>";
				// rrule
				// wichtig: es findet keine prüfung statt ! wenn zu beginn das überschreiben akzeptiert wird, dann kommt das standard
				// format des widgets zur anwendung !
				template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
				for(numberOfDay = 0; numberOfDay < 7; numberOfDay ++){
					template += "<input type='checkbox' id='checkbox" + numberOfDay + "-" + numberOfRow + "'> <label for='checkbox" + numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "<\/label>";
				}	
				template += "<\/fieldset><\/form><\/td>";
				// active
				// schalter, die einzelne zeilen der schaltuhr aktivieren.
				template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " +
						"<input type='checkbox' id='uzsuEntryActive" + numberOfRow + "'> <label for='uzsuEntryActive" + numberOfRow + "'>Act<\/label>" +
						"<\/fieldset><\/form><\/td>";
				// del button
				// löschen eines zeileneintrags
				template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del<\/button><\/td>";
			// tabelle reihen abschliessen
			template += "<\/tr>";		
			break;
		}
		case '1':{
				
				template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
				// jetzt beginnen die spalten in der reihenfolge value, time /rrule, active, delete button
				if(customFormat[1]=='bool'){
					template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + customFormat[3]+ "<\/option> <option value='1'> " + customFormat[2]+ " <\/option><\/select><\/td>";
				}
				else if(customFormat[1]=='num'){
					template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
				}
				else if(customFormat[1]=='text'){
						template += "<td><input type='text' data-clear-btn='false' style = 'width:60px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
				}
				// time
				template += "<td><input type='time' data-clear-btn='true' style = 'width:350px' id='uzsuEntryTime" + numberOfRow +"'>";
				// rrule
				// hier wird nur der textstring übernommen. prüfungen erfolgen keine !
				template += "<input type='text' data-clear-btn='true' style = 'width:350px' id='uzsuEntryRrule" + numberOfRow +"'><\/td>";
				// active
				template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " +
						"<input type='checkbox' id='uzsuEntryActive" + numberOfRow + "'> <label for='uzsuEntryActive" + numberOfRow + "'>Act<\/label>" +
						"<\/fieldset><\/form><\/td>";
				// del button
				template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del<\/button><\/td>";
			// tabelle reihen abschliessen
			template += "<\/tr>";		
			break;
		}
		case '2':{
			template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
			// jetzt beginnen die spalten in der reihenfolge value, time / rrule, active, delete button
			// mit flipswitch (bessere erkennbarkeit, die Texte können über das widget gesetzt werden
			// unterscheidung nur ob bool oder num, wobei num int ist !
			if(customFormat[1]=='bool'){
				template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + customFormat[3]+ "<\/option> <option value='1'> " + customFormat[2]+ " <\/option><\/select><\/td>";
			}
			else if(customFormat[1]=='num'){
				template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
			}
			else if(customFormat[1]=='text'){
				template += "<td><input type='text' data-clear-btn='false' style = 'width:60px' id='uzsuEntryValue" + numberOfRow + "'<\/td>";
			}
			// time
			template += "<td><input type='time' data-clear-btn='false' id='uzsuEntryTime" + numberOfRow +"'>";
			// rrule
			template += "<form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
			for(numberOfDay = 0; numberOfDay < 7; numberOfDay ++){
				template += "<input type='checkbox' id='checkbox" + numberOfDay + "-" + numberOfRow + "'> <label for='checkbox" + numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "<\/label>";
			}	
			template += "<\/fieldset><\/form><\/td>";
			// active
			template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " +
					"<input type='checkbox' id='uzsuEntryActive" + numberOfRow + "'> <label for='uzsuEntryActive" + numberOfRow + "'>Act<\/label>" +
					"<\/fieldset><\/form><\/td>";
			// del button
			template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del<\/button><\/td>";
		// tabelle reihen abschliessen
		template += "<\/tr>";		
		break;
	}

	}
	return template;
}
// Anteil der Button zur steuerung des Popups
function uzsuBuildTableFooter(){

	var template = "";
	// tabelle der zeileneinträge abschliessen
	template += "<\/table>";
	// hier der activierungsbutton für die gesamte uzsu
	template += "<table style = 'border: 0'> <tr> <td> <form> <fieldset data-mini='true'> " +
	"<input type='checkbox' id='uzsuGeneralActive'> <label for='uzsuGeneralActive'>UZSU Activate<\/label>" +
	"<\/fieldset><\/form> <\/td>";
	// jetzt kommen noch die buttons in der basisleiste mit rein
	template += "<td> <div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>"; 
		template += "<div data-role = 'button' id = 'uzsuAddTableRow'> Add Entry <\/div>";
		template += "<div data-role = 'button' id = 'uzsuSaveQuit'> Save&Quit<\/div>";
		template += "<div data-role = 'button' id = 'uzsuCancel'> Cancel <\/div> <\/td>";
	template += "<td style = 'text-align: right'><h6> v1.2beta <\/h6><\/td><\/div><\/tr><\/table>";
	// abschlus des gesamten span container
	template += "<\/span>";
    // und der abschluss des popup divs
    template += "<\/div>";
    return template;
}
// hier wird das template zusammengestellt, die tabellenzeilen separat, weil ich die bei einer
// ergänzung der tabelle wieder verwenden kann
function uzsuBuildTable(response, headline, customFormat){

	var template = "";
	var numberOfEntrys = response.list.length;
	// erst den header, dann die zeilen, dann den footer
	template = uzsuBuildTableHeader(headline, customFormat);
	for(numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
		template += uzsuBuildTableRow(numberOfRow, customFormat);
	}
	template += uzsuBuildTableFooter();
	return template;
}
// tabelle füllen
// es werden die daten aus der variablen response gelesen und in den status / darstellung der widgetblöcke zugewiesen.
// der aktuelle status in dann in der darstellung enthalten !
function uzsuFillTable(response, customFormat){

	var numberOfEntrys = response.list.length;
	var weekDays =['MO','TU','WE','TH','FR','SA','SU'];
	// jetzt wird die tabelle befüllt
	// allgemeiner Status, bitte nich mit attr, sondern mit prop, siehe https://github.com/jquery/jquery-mobile/issues/5587
	$('#uzsuGeneralActive').prop('checked',response.active).checkboxradio("refresh");	
	// auswahl format
	switch(customFormat[0]){
		case '0':
		case '2':{
			// dann die werte der tabelle
			for(numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
				// beim schreiben der Daten unterscheidung, da sonst das element falsch genutzt wird
				// mit flipswitch für die bool variante
				if(customFormat[1]=='bool'){
					$('#uzsuEntryValue'+numberOfRow).val(response.list[numberOfRow].value).slider("refresh");
				}
				// mit int value für die num variante
				else if ((customFormat[1]=='num') || (customFormat[1]=='text')){
					$('#uzsuEntryValue'+numberOfRow).val(response.list[numberOfRow].value);
				}	
				$('#uzsuEntryActive'+numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");	
				$('#uzsuEntryTime'+numberOfRow).val(response.list[numberOfRow].time);	
				// in der tabelle die werte der rrule, dabei gehe ich von dem standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
				// aus und setze für jeden eintrag den button.
				var rrule = response.list[numberOfRow].rrule;
				if(typeof rrule == "undefined"){
					rrule='';
				}
				var ind = rrule.indexOf('BYDAY');
				// wenn der standard drin ist
				if(ind >0 ){
					var days = rrule.substring(ind);
					// Setzen der werte
					for(numberOfDay = 0; numberOfDay < 7; numberOfDay ++){
						$('#checkbox'+ numberOfDay + '-' + numberOfRow).prop('checked',days.indexOf(weekDays[numberOfDay])>0).checkboxradio("refresh");	
					}	
				}
			}
			break;	
		}
		case '1':{
			// dann die werte der tabelle
			for(numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
				$('#uzsuEntryValue'+numberOfRow).val(response.list[numberOfRow].value);	
				$('#uzsuEntryActive'+numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");	
				$('#uzsuEntryTime'+numberOfRow).val(response.list[numberOfRow].time);	
				$('#uzsuEntryRrule'+numberOfRow).val(response.list[numberOfRow].rrule);	
			}
			break;
		}
	}
}
// tabellenzeile einfügen
function uzsuAddTableRow(response, customFormat){
	
	var numberOfNewRow = response.list.length;
	var template = '';
	// alten zustand mal in die Liste rein. da der aktuelle zustand ja nur im widget selbst enthalten ist,
	// wird er vor dem umbau wieder in die variable response zurückgespeichert.
	uzsuSaveTable(1, response, customFormat, false);
	// ich hänge immer an die letzte Zeile dran ! erst einmal das array erweitern
	response.list.push({active : false, rrule : '', time : '00:00', value : 0});
	// dann eine neue HTML Zeile genenrieren
	template = uzsuBuildTableRow(numberOfNewRow, customFormat);
	// zeile in die Tabelle einbauen
	$('#uzsuTable').append(template);
	// hier wichtig: damit die optimierung jquerymobile auf tabelle wirkt
	$.mobile.activePage.trigger('pagecreate');
	// den delete handler für die neue Zeile einhängen
	$.mobile.activePage.find("#uzsuDelTableRow" + numberOfNewRow).bind("tap", function (e) {
		uzsuDelTableRow(response, customFormat, e);
	});
	// und daten ausfüllen. hier werdne die zeile wieder mit dem status beschrieben. status ist dann wieder im widget
	uzsuFillTable(response, customFormat);
}
// tabellenzeile löschen
function uzsuDelTableRow(response, customFormat, e){

	var numberOfEntrys = response.list.length;
	// wenn überhaupt einträge vorhanden sind
	// sollte nicht passieren, weil eigentlich auch kein button dann da ist, aber...
	if(numberOfEntrys > 0){
		// index heraussuchen, in welcher Zeile gelöscht wurde
		var uzsuTableRowToDelete = parseInt(e.currentTarget.id.substr(15));
		// zwischenspeichern vor dem löschen
		uzsuSaveTable(1, response, customFormat, false);
		//erst mal das array entsprechen kürzen
		response.list.splice(uzsuTableRowToDelete,1);
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuNumberOfRow'+(numberOfEntrys-1)).remove();	
		// und daten wieder ausfüllen
		uzsuFillTable(response, customFormat);
	}
}
// tabelle auslesen und speichern
function uzsuSaveTable(item, response, customFormat, saveSmarthome){
	
	var numberOfEntrys = response.list.length;
	var weekDays =['MO','TU','WE','TH','FR','SA','SU'];
	// hier werden die daten aus der tabelle wieder in die items im backend zurückgespielt
	// bitte darauf achten, dass das zurückspielen exakt dem der anzeige enspricht.
	// gesamthafte aktivierung
 	response.active = $('#uzsuGeneralActive').is(':checked');
 	// dispatcher für format
	switch(customFormat[0]){
		case '0':
		case '2':{
		 	// einzeleinträge
			for(numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
				// beim zurücklesen keine beachtung des typs, da smarthome bei bool auch 0 bzw. 1 akzeptiert
				if (customFormat[1] == 'text') {
					response.list[numberOfRow].value = $('#uzsuEntryValue'+numberOfRow).val();
				}
				else {
					response.list[numberOfRow].value = parseInt($('#uzsuEntryValue'+numberOfRow).val());
				}
				response.list[numberOfRow].active = $('#uzsuEntryActive'+numberOfRow).is(':checked');	
				response.list[numberOfRow].time = $('#uzsuEntryTime'+numberOfRow).val();	
				// in der tabelle die werte der rrule, dabei gehe ich von dem standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
				// aus und setze für jeden eintrag den button.
				// Setzen der werte
				var first = true;
				var rrule = '';
				for(numberOfDay = 0; numberOfDay < 7; numberOfDay ++){
					if($('#checkbox'+ numberOfDay + '-' + numberOfRow).is(':checked')){
						if(first){
							first = false;
							rrule = 'FREQ=WEEKLY;BYDAY=' + weekDays[numberOfDay];
						}
						else{
							rrule += ',' + weekDays[numberOfDay];
						}
					}	
				}	
				response.list[numberOfRow].rrule = rrule;
			}
			break;
		}
		case '1':{
		 	// einzeleinträge
			for(numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
				if (customFormat[1] == 'text') {
					response.list[numberOfRow].value = $('#uzsuEntryValue'+numberOfRow).val();
				}
				else {
					response.list[numberOfRow].value = parseInt($('#uzsuEntryValue'+numberOfRow).val());
				}
				response.list[numberOfRow].active = $('#uzsuEntryActive'+numberOfRow).is(':checked');	
				response.list[numberOfRow].time = $('#uzsuEntryTime'+numberOfRow).val();	
				response.list[numberOfRow].rrule = $('#uzsuEntryRrule'+numberOfRow).val();	
			}
			break;
		}
	}
 	// über json interface / treiber herausschreiben
	if(saveSmarthome){
		io.write(item, {active : response.active, list : response.list });
	}
}
// steuerung des Popups
function runtimeUzsuPopup(response, headline, customFormat, item) {
	// erst einmal wird der leeranteil angelegt
	var template = uzsuBuildTable(response, headline, customFormat);
	// dann hängen wir das an die aktuelle Seite
	$.mobile.activePage.append(template).trigger("pagecreate");
	// dann die werte eintragen.
	uzsuFillTable(response, customFormat);
	// Popup schliessen mit quit
	$.mobile.activePage.find("#uzsuCancel").bind("tap", function (e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im cache die alten werte
		$.mobile.activePage.find("#uzsuPopupContent").popup("close");
	});
	// speichern mit SaveQuit
	$.mobile.activePage.find("#uzsuSaveQuit").bind("tap", function (e) {
		// jetzt wird die Kopie auf das original kopiert
		// und geschlossen
		uzsuSaveTable(item, response, customFormat, true);
		$.mobile.activePage.find("#uzsuPopupContent").popup("close");
	});
	// eintrag hinzufügen mit add
	$.mobile.activePage.find("#uzsuAddTableRow").bind("tap", function (e) {
		uzsuAddTableRow(response, customFormat);
	});
	// löschen mit del
	for(var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow ++){
		$.mobile.activePage.find("#uzsuDelTableRow" + numberOfRow).bind("tap", function (e) {
			uzsuDelTableRow(response, customFormat, e);
		});
	}
	// hier wir die aktuelle seite danach durchsucht, wo das popup ist
	// und im folgenden das popup initialisiert, geöffnet und die schliessen
	// funktion daran gebunden. diese entfern wieder das popup aus dem baum
	$.mobile.activePage.find("#uzsuPopupContent").popup("open").bind({
		popupafterclose: function () {
			$(this).remove();
		}
	});
}
// initialisierung
$(document).on("update",'[data-widget="uzsu.uzsu_icon"]', function(event, response) {
    // zunächst wird festgestellt, ob Item mit Eigenschaft vorhanden. Wenn nicht: active = false
    // ansonsten ist der Status von active gleich dem gesetzten Status
    var active = response.length > 0 ? response[0].active : false;
    // Das Icon wird aktiviert, falls Status auf aktiv, ansonsten deaktiviert angezeigt
    $('#' + this.id + ' img').attr('src', (active ? $(this).attr('data-pic-on') : $(this).attr('data-pic-off')));
    // wenn keine Daten vorhanden, dann ist kein item mit den eigenschaften hinterlegt
    // und es wird nichts gemacht
    if (response.length === 0)
        return;
    // Wenn ein Update erfolgt, dann werden die Daten erneut in die Variable uzsu geladen
    // damit sind die UZSU objekte auch in der click funktion verfügbar
    // warum das nicht mit function (event, response) wie bei update funktioniert, weiß ich nicht.
    if (response[0].list instanceof Array) {
        $(this).data('uzsu', response[0]);
    } 
    else {
        $(this).data('uzsu', { active: true, list: [] });
	}
});
// als zweites der handler für die callbacks des click events
// kann man auch zusammen machen, habe ich aus übersichtlichkeit getrennt
$(document).on("click",'[data-widget="uzsu.uzsu_icon"]', function(event) {
	// hier werden die parameter aus den attributen herausgenommen
	// und beim öffnen mit .open(....) an das popup objekt übergeben
    var response = $(this).data('uzsu');
    var headline = $(this).attr('data-headline');
    var customFormat = ['0','bool','On','Off'];
    // übergabe im array, damit nicht zu viele parameter in der liste
    customFormat[0] = $(this).attr('data-customFormat');
    customFormat[1] = $(this).attr('data-customType');
    customFormat[2] = $(this).attr('data-customTextTrue');
    customFormat[3] = $(this).attr('data-customTextFalse');
    // data-item ist der sh.py item, in dem alle attribute lagern, die für die steuerung notwendig ist
    // ist ja vom typ dict. das item, was tatsächlich per schaltuhr verwendet wird ist nur als attribut (child)
    // enthalten und wird ausschliesslich vom plugin verwendet.
    // wird für das rückschreiben der Daten an smarthome.py benötigt
    var item = $(this).attr('data-item');
    // jetzt kommt noch eie liste von prüfungen, damit hinterher keine fehler passieren
    // zunächst erst einmal popup wird angezeigt
    var popupOk = true;
    if ((customFormat[0]!=='0') && (customFormat[0]!=='1') && (customFormat[0]!=='2')){
    	alert('Fehlerhafter Parameter: "'+customFormat[0]+'" im Feld customFormat bei Item ' + item);
    	popupOk = false;
    }
    if ((customFormat[1]!=='bool') && (customFormat[1]!=='num') && (customFormat[1]!=='text')){
		alert('Fehlerhafter Parameter: "'+customFormat[1]+'" im Feld customType bei Item ' + item);
		popupOk = false;
    }
    if ((customFormat[0]=='0')||(customFormat[0]=='2')){
    	var numberOfEntrys = response.list.length;
    	for(var numberOfRow = 0; numberOfRow < numberOfEntrys; numberOfRow ++){
    		// test, ob die RRULE fehlerhaft ist
    		if ((response.list[numberOfRow].rrule.indexOf('FREQ=WEEKLY;BYDAY=')!==0) && (response.list[numberOfRow].rrule.length > 0)){
    			if(!confirm('Fehler: Parameter customType ist "0", aber gespeicherte RRULE String in UZSU "' + response.list[numberOfRow].rrule + '" entspricht nicht default Format FREQ=WEEKLY;BYDAY=MO... bei Item ' + item + '. Soll dieser Eintrag überschrieben werden ?')){
        			// direkter abbruch bei der entscheidung !
        			numberOfRow = numberOfEntrys;
        			popupOk = false;
    			}
    		}
    	}
    }
    if (popupOk){
    	// öffnen des popups bei clicken des icons und ausführung der eingabefunktion
    	runtimeUzsuPopup(response, headline, customFormat, item);
    }
});

 
