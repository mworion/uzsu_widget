// 
// Neugestaltetes UZSU Widget zur Bedienung UZSU Plugin
//
// Release feature v2.1
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
// ----- set browser and platform identification variables -----------------------------------------------------
var browserIdentificationVariable = document.documentElement;
	browserIdentificationVariable.setAttribute('data-useragent',navigator.userAgent);
	browserIdentificationVariable.setAttribute('data-platform', navigator.platform);
	browserIdentificationVariable.className += ((!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) ? ' touch' : '');

function uzsuBuildTableHeader(headline, designType, valueType, textSelectList) {
	// Kopf und überschrift des Popups
	var template = "";
	// hier kommt der popup container mit der beschreibung ein eigenschaften
	template += "<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupContent' data-dismissible = 'false'>";
	// Schliessen Button rechts oben
	template += "<div data-rel='back' data-role='button' data-icon='delete' data-iconpos='notext' class='ui-btn-right' id='uzsuClose'></div>";
	// jetzt der inhalt geklammert mit span
	template += " <span> <div style='text-align:center'><h1>" + headline + "</h1></div>";
	// und dann der aufbau mit einer tabelle. Hier muss im 2. schritt dir
	// formatierung über span laufen
	// um eine anpassung auf die aktuellen notation hinzubekommen. tabelle wird
	// nicht ganz zukunftsweisend sein
	template += "<table id='uzsuTable' style = 'border: 1px solid;padding-right: 3px;padding-left: 3px'> ";
	// generell gibt es dann dispatcher für die einzelnen formate. ich fasse sie
	// zusammen, wo immer es geht.
	// hier kann man auch die formate für sich selbst erweitern und anpassen.
	switch (designType) {
		// format 0 ist der default, macht wochentage, eine konfigurierbar eingabe
		// des wertes und die aktivierungen
		case '0': {
			template += "<tr> <td>Value</td><td>Time</td><td>Weekdays</td><td>Active</td><td>Helper</td><td>Remove</td> </tr>";
			break;
		}
			// format 1 ist der expertenmodus, hier kann man in einem textstring de
			// facto alles auswerten
		case '1': {
			template += "<tr> <td>Value</td><td>Time (flex)<br>RRULE</td><td>Active</td><td>Helper</td><td>Remove</td> </tr>";
			break;
		}
			// format 2 ist ein hybrid aus 1 und 2
		case '2': {
			template += "<tr> <td>Value</td><td>Time / Weekdays</td><td>Active</td><td>Helper</td><td>Remove</td> </tr>";
			break;
		}
	}
	return template;
}

function uzsuBuildTableRow(numberOfRow, designType, valueType, textSelectList) {
	// Tabelleneinträge
	var template = "";
	// liste für die wochentage, damit ich später per index darauf zugreifen
	// kann
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// auch hier wieder der dispatcher für die formate
	switch (designType) {
		case '0': {
			template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
			// jetzt beginnen die spalten in der reihenfolge value, time / rrule,
			// active, delete button
			// mit flipswitch (bessere erkennbarkeit, die Texte können über das
			// widget gesetzt werden
			// unterscheidung nur ob bool oder num, wobei num int ist !
			if (valueType == 'bool') {
				template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + textSelectList[1] + "</option> <option value='1'> "	+ textSelectList[0] + " </option></select></td>";
			} 
			else if (valueType == 'num') {
				template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'text') {
				template += "<td><input type='text' data-clear-btn='false' class='uzsuTextInput' style = 'width:60px' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'list') {
				// das listenformat mit select ist sehr trickreich. ich weiss nicht,
				// wie ich automatisch die richtige höhe bekomme
				// ich musste die explizi auf die 34 px setzen. ohne das ist die
				// zeilehähe deutlich zu hoch
				template += "<td><form><div data-role='fieldcontain' class='uzsuTextInput' style = 'width:120px; height:auto !important'>";
				template += "<select name='uzsuEntryValue'" + numberOfRow + "' id='uzsuEntryValue" + numberOfRow + "' data-mini='true'>";
				for (numberOfListEntry = 0; numberOfListEntry < textSelectList.length; numberOfListEntry++) {
					// unterscheidung anzeige und werte
					if (textSelectList[0].split(':')[1] === undefined) {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[0]	+ "'>"+ textSelectList[numberOfListEntry].split(':')[0]	+ "</option>";
					} 
					else {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[1]	+ "'>"+ textSelectList[numberOfListEntry].split(':')[0]	+ "</option>";
					}
				}
				template += "</select></div></form></td>";
			}
			// time
			// bei der darstellung der time als HTML5 format ist besonders beim
			// chrome browser die darstellung mit
			// zusätzlichen elementen, die dann die eingabebreite effektiv
			// reduzieren. ich haben keine möglichkeit gefunden
			// dieses verhalten zu umgehen / disablen. wers braucht, kann mit der
			// erhöhung der breite im style dieses so anpassen
			// dass eine gut sichtbare lösung entsteht (zu lasten der gesamtbreite=
			// werte um width = 80px schenen ganz gut zu sein.
			template += "<td><input type='time' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuEntryTime" + numberOfRow + "'></td>";
			// rrule
			// wichtig: es findet keine prüfung statt ! wenn zu beginn das
			// überschreiben akzeptiert wird, dann kommt das standard
			// format des widgets zur anwendung !
			template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
			for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
				template += "<input type='checkbox' id='checkbox" + numberOfDay	+ "-" + numberOfRow + "'> <label for='checkbox"	+ numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "</label>";
			}
			template += "</fieldset></form></td>";
			// active
			// schalter, die einzelne zeilen der schaltuhr aktivieren.
			template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " + "<input type='checkbox' id='uzsuEntryActive"	+ numberOfRow + "'> <label for='uzsuEntryActive" + numberOfRow + "'>Act</label>" + "</fieldset></form></td>";
			// help button
			template += "<td> <button id='uzsuTableHelper" + numberOfRow + "' data-mini='true'>?</button></td>";
			// del button
			// löschen eines zeileneintrags
			template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button></td>";
			// tabelle reihen abschliessen
			template += "</tr>";
			break;
		}
		case '1': {
	
			template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
			// jetzt beginnen die spalten in der reihenfolge value, time /rrule,
			// active, delete button
			if (valueType == 'bool') {
				template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + textSelectList[1] + "</option> <option value='1'> "	+ textSelectList[0] + " </option></select></td>";
			} 
			else if (valueType == 'num') {
				template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'text') {
				template += "<td><input type='text' data-clear-btn='false' class='uzsuTextInput' style = 'width:60px' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'list') {
				template += "<td><form><div data-role='fieldcontain' class='uzsuTextInput' style = 'width:120px; height:auto !important'>";
				template += "<select name='uzsuEntryValue'" + numberOfRow + "' id='uzsuEntryValue" + numberOfRow + "' data-mini='true'>";
				for (numberOfListEntry = 0; numberOfListEntry < textSelectList.length; numberOfListEntry++) {
					// unterscheidung anzeige und werte
					if (textSelectList[0].split(':')[1] === undefined) {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[0]	+ "'>" + textSelectList[numberOfListEntry].split(':')[0] + "</option>";
					} 
					else {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[1]	+ "'>" + textSelectList[numberOfListEntry].split(':')[0] + "</option>";
					}
				}
				template += "</select></div></form></td>";
			}
			// time
			template += "<td><input type='text' data-clear-btn='true' style = 'width:350px' id='uzsuEntryTime" + numberOfRow + "'>";
			// rrule
			// hier wird nur der textstring übernommen. prüfungen erfolgen keine !
			template += "<input type='text' data-clear-btn='true' style = 'width:350px' id='uzsuEntryRrule"	+ numberOfRow + "'></td>";
			// active
			template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " + "<input type='checkbox' id='uzsuEntryActive"	+ numberOfRow + "'> <label for='uzsuEntryActive" + numberOfRow + "'>Act</label>" + "</fieldset></form></td>";
			// help button
			template += "<td> <button id='uzsuTableHelper" + numberOfRow + "' data-mini='true'>?</button></td>";
			// del button
			template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button></td>";
			// tabelle reihen abschliessen
			template += "</tr>";
			break;
		}
		case '2': {
			template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
			// jetzt beginnen die spalten in der reihenfolge value, time / rrule,
			// active, delete button
			// mit flipswitch (bessere erkennbarkeit, die Texte können über das
			// widget gesetzt werden
			// unterscheidung nur ob bool oder num, wobei num int ist !
			if (valueType == 'bool') {
				template += "<td><select name='UZSU' id='uzsuEntryValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + textSelectList[1] + "</option> <option value='1'> " + textSelectList[0] + " </option></select></td>";
			} 
			else if (valueType == 'num') {
				template += "<td><input type='number' data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'text') {
				template += "<td><input type='text' data-clear-btn='false' style = 'width:60px' class='uzsuTextInput' id='uzsuEntryValue" + numberOfRow + "'</td>";
			} 
			else if (valueType == 'list') {
				template += "<td><form><div data-role='fieldcontain' class='uzsuTextInput' style = 'width:120px; height:auto !important'>";
				template += "<select name='uzsuEntryValue'" + numberOfRow + "' id='uzsuEntryValue" + numberOfRow + "' data-mini='true'>";
				for (numberOfListEntry = 0; numberOfListEntry < textSelectList.length; numberOfListEntry++) {
					// unterscheidung anzeige und werte
					if (textSelectList[0].split(':')[1] === undefined) {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[0]	+ "'>" + textSelectList[numberOfListEntry].split(':')[0] + "</option>";
					} 
					else {
						template += "<option value='" + textSelectList[numberOfListEntry].split(':')[1]	+ "'>"	+ textSelectList[numberOfListEntry].split(':')[0] + "</option>";
					}
				}
				template += "</select></div></form></td>";
			}
			// time
			template += "<td><input type='text' data-clear-btn='false' id='uzsuEntryTime" + numberOfRow + "'>";
			// rrule
			template += "<form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
			for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
				template += "<input type='checkbox' id='checkbox" + numberOfDay	+ "-" + numberOfRow + "'> <label for='checkbox"	+ numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "</label>";
			}
			template += "</fieldset></form></td>";
			// active
			template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> "+ "<input type='checkbox' id='uzsuEntryActive"+ numberOfRow	+ "'> <label for='uzsuEntryActive"+ numberOfRow	+ "'>Act</label>" + "</fieldset></form></td>";
			// help button
			template += "<td> <button id='uzsuTableHelper" + numberOfRow + "' data-mini='true'>?</button></td>";
			// del button
			template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button></td>";
			// tabelle reihen abschliessen
			template += "</tr>";
			break;
		}
	}
	return template;
}

function uzsuBuildTableFooter(designType) {
	// Anteil der Button zur steuerung des Popups
	var template = "";
	// tabelle der zeileneinträge abschliessen
	template += "</table>";
	// hier der activierungsbutton für die gesamte uzsu
	template += "<table style = 'border: 0'> <tr> <td> <form> <fieldset data-mini='true'> " + "<input type='checkbox' id='uzsuGeneralActive'> <label for='uzsuGeneralActive'>UZSU Activate</label>"	+ "</fieldset></form> </td>";
	// jetzt kommen noch die buttons in der basisleiste mit rein
	template += "<td> <div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>";
	template += "<div data-role = 'button' id = 'uzsuAddTableRow'> Add Entry </div>";
	template += "<div data-role = 'button' id = 'uzsuSaveQuit'> Save&Quit</div>";
	if (designType == '0') {
		template += "<div data-role = 'button' id = 'uzsuSortTime'> Sort Times</div>";
	}
	template += "<div data-role = 'button' id = 'uzsuCancel'> Cancel </div> </td>";
	template += "<td style = 'text-align: right'><h6> v2.1 </h6></td></div></tr></table>";
	// abschlus des gesamten span container
	template += "</span>";
	// und der abschluss des popup divs
	template += "</div>";
	return template;
}

function uzsuBuildTable(response, headline, designType, valueType,
		textSelectList) {
	// hier wird das template zusammengestellt, die tabellenzeilen separat, weil
	// ich die bei einer
	// ergänzung der tabelle wieder verwenden kann
	var template = "";
	var numberOfEntries = response.list.length;
	// erst den header, dann die zeilen, dann den footer
	template = uzsuBuildTableHeader(headline, designType, valueType,
			textSelectList);
	for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		template += uzsuBuildTableRow(numberOfRow, designType, valueType, textSelectList);
	}
	template += uzsuBuildTableFooter(designType);
	return template;
}

function uzsuFillTable(response, designType, valueType, textSelectList) {
	// tabelle füllen
	// es werden die daten aus der variablen response gelesen und in den status
	// / darstellung der widgetblöcke zugewiesen.
	// der aktuelle status in dann in der darstellung enthalten !
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// jetzt wird die tabelle befüllt
	// allgemeiner Status, bitte nicht mit attr, sondern mit prop, siehe
	// https://github.com/jquery/jquery-mobile/issues/5587
	$('#uzsuGeneralActive').prop('checked', response.active).checkboxradio("refresh");
	// auswahl format
	switch (designType) {
		case '0':
		case '2': {
			// dann die werte der tabelle
			for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
				// beim schreiben der Daten unterscheidung, da sonst das element
				// falsch genutzt wird
				// mit flipswitch für die bool variante
				if (valueType == 'bool') {
					$('#uzsuEntryValue' + numberOfRow).val(response.list[numberOfRow].value).slider("refresh");
				}
				// mit int value für die num variante
				else if ((valueType == 'num') || (valueType == 'text')) {
					$('#uzsuEntryValue' + numberOfRow).val(response.list[numberOfRow].value);
				} 
				else if (valueType == 'list') {
					// hier ist es etwas schwieriger, denn ich muß den wert mit der
					// liste vergleichen und dann setzen
					for (numberOfListEntry = 0; numberOfListEntry < textSelectList.length; numberOfListEntry++) {
						// wenn ich den eintrag gefunden haben, dann setze ich den
						// eintrag auf die richtige stelle
						// ansonsten wird einfach der erste eintrag genommen
						// zusätzlich noch die unterscheidung, ob ich in der listen
						// anzeige und wertezuweisung trenne
						if (textSelectList[0].split(':')[1] === undefined) {
							if (response.list[numberOfRow].value == textSelectList[numberOfListEntry].split(':')[0]) {
								$("#uzsuEntryValue" + numberOfRow).val(textSelectList[numberOfListEntry].split(':')[0]).attr('selected',true).siblings('option').removeAttr('selected');
								$("#uzsuEntryValue" + numberOfRow).selectmenu('refresh', true);
							}
						} 
						else {
							if (response.list[numberOfRow].value == textSelectList[numberOfListEntry].split(':')[1]) {
								$("#uzsuEntryValue" + numberOfRow).val(textSelectList[numberOfListEntry].split(':')[1]).attr('selected',true).siblings('option').removeAttr('selected');
								$("#uzsuEntryValue" + numberOfRow).selectmenu('refresh', true);
							}
						}
					}
				}
				$('#uzsuEntryActive' + numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");
				$('#uzsuEntryTime' + numberOfRow).val(response.list[numberOfRow].time);
				// in der tabelle die werte der rrule, dabei gehe ich von dem
				// standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
				// aus und setze für jeden eintrag den button.
				var rrule = response.list[numberOfRow].rrule;
				if (typeof rrule == "undefined") {
					rrule = '';
				}
				var ind = rrule.indexOf('BYDAY');
				// wenn der standard drin ist
				if (ind > 0) {
					var days = rrule.substring(ind);
					// Setzen der werte
					for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
						$('#checkbox' + numberOfDay + '-' + numberOfRow).prop('checked', days.indexOf(weekDays[numberOfDay]) > 0).checkboxradio("refresh");
					}
				}
			}
			break;
		}
		case '1': {
			// dann die werte der tabelle
			for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
				// bei der listendarstellung anders
				if (valueType == 'list') {
					// hier ist es etwas schwieriger, denn ich muß den wert mit der
					// liste vergleichen und dann setzen
					for (numberOfListEntry = 0; numberOfListEntry < textSelectList.length; numberOfListEntry++) {
						// wenn ich den eintrag gefunden haben, dann setze ich den
						// eintrag auf die richtige stelle
						// zusätzlich noch die unterscheidung, ob ich in der listen
						// anzeige und wertezuweisung trenne
						if (textSelectList[0].split(':')[1] === undefined) {
							if (response.list[numberOfRow].value == textSelectList[numberOfListEntry].split(':')[0]) {
								$("#uzsuEntryValue" + numberOfRow).val(textSelectList[numberOfListEntry].split(':')[0]).attr('selected',true).siblings('option').removeAttr('selected');
								$("#uzsuEntryValue" + numberOfRow).selectmenu('refresh', true);
							}
						} 
						else {
							if (response.list[numberOfRow].value == textSelectList[numberOfListEntry].split(':')[1]) {
								$("#uzsuEntryValue" + numberOfRow).val(textSelectList[numberOfListEntry].split(':')[1]).attr('selected',true).siblings('option').removeAttr('selected');
								$("#uzsuEntryValue" + numberOfRow).selectmenu('refresh', true);
							}
						}
					}
				} 
				else {
					$('#uzsuEntryValue' + numberOfRow).val(response.list[numberOfRow].value);
				}
				$('#uzsuEntryActive' + numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");
				$('#uzsuEntryTime' + numberOfRow).val(response.list[numberOfRow].time);
				$('#uzsuEntryRrule' + numberOfRow).val(response.list[numberOfRow].rrule);
			}
			break;
		}
	}
}

function uzsuSaveTable(item, response, designType, valueType, textSelectList,
		saveSmarthome) {
	// tabelle auslesen und speichern
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// hier werden die daten aus der tabelle wieder in die items im backend
	// zurückgespielt
	// bitte darauf achten, dass das zurückspielen exakt dem der anzeige
	// enspricht.
	// gesamthafte aktivierung
	response.active = $('#uzsuGeneralActive').is(':checked');
	// dispatcher für format
	switch (designType) {
	case '0':
	case '2': {
		// einzeleinträge
		for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
			// beim zurücklesen keine beachtung des typs, da smarthome bei bool
			// auch 0 bzw. 1 akzeptiert
			if ((valueType == 'text') || (valueType == 'list')) {
				response.list[numberOfRow].value = $('#uzsuEntryValue' + numberOfRow).val();
			} 
			else {
				response.list[numberOfRow].value = parseInt($('#uzsuEntryValue' + numberOfRow).val());
			}
			response.list[numberOfRow].active = $('#uzsuEntryActive' + numberOfRow).is(':checked');
			response.list[numberOfRow].time = $('#uzsuEntryTime' + numberOfRow).val();
			// in der tabelle die werte der rrule, dabei gehe ich von dem
			// standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
			// aus und setze für jeden eintrag den button.
			// Setzen der werte
			var first = true;
			var rrule = '';
			for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
				if ($('#checkbox' + numberOfDay + '-' + numberOfRow).is(':checked')) {
					if (first) {
						first = false;
						rrule = 'FREQ=WEEKLY;BYDAY=' + weekDays[numberOfDay];
					} 
					else {
						rrule += ',' + weekDays[numberOfDay];
					}
				}
			}
			response.list[numberOfRow].rrule = rrule;
		}
		break;
	}
	case '1': {
		// einzeleinträge
		for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
			if ((valueType == 'text') || (valueType == 'list')) {
				response.list[numberOfRow].value = $('#uzsuEntryValue' + numberOfRow).val();
			} 
			else {
				response.list[numberOfRow].value = parseInt($('#uzsuEntryValue' + numberOfRow).val());
			}
			response.list[numberOfRow].active = $('#uzsuEntryActive' + numberOfRow).is(':checked');
			response.list[numberOfRow].time = $('#uzsuEntryTime' + numberOfRow).val();
			response.list[numberOfRow].rrule = $('#uzsuEntryRrule' + numberOfRow).val();
		}
		break;
	}
	}
	// über json interface / treiber herausschreiben
	if (saveSmarthome) {
		io.write(item, {active : response.active,list : response.list});
	}
}

function uzsuAddTableRow(response, designType, valueType, textSelectList) {
	// tabellenzeile einfügen
	var numberOfNewRow = response.list.length;
	var template = '';
	// alten zustand mal in die Liste rein. da der aktuelle zustand ja nur im
	// widget selbst enthalten ist,
	// wird er vor dem umbau wieder in die variable response zurückgespeichert.
	uzsuSaveTable(1, response, designType, valueType, textSelectList, false);
	// ich hänge immer an die letzte Zeile dran ! erst einmal das array
	// erweitern
	response.list.push({active : false,	rrule : '',	time : '00:00',	value : 0});
	// dann eine neue HTML Zeile genenrieren
	template = uzsuBuildTableRow(numberOfNewRow, designType, valueType,	textSelectList);
	// zeile in die Tabelle einbauen
	$('#uzsuTable').append(template);
	// hier wichtig: damit die optimierung jquerymobile auf tabelle wirkt
	$.mobile.activePage.trigger('pagecreate');
	// den delete handler für die neue Zeile einhängen
	$.mobile.activePage.find("#uzsuDelTableRow" + numberOfNewRow).bind("tap",function(e) {
		uzsuDelTableRow(response, designType, valueType,textSelectList, e);
	});
	// und daten ausfüllen. hier werdne die zeile wieder mit dem status
	// beschrieben. status ist dann wieder im widget
	uzsuFillTable(response, designType, valueType, textSelectList);
}

function uzsuDelTableRow(response, designType, valueType, textSelectList, e) {
	// tabellenzeile löschen
	var numberOfEntries = response.list.length;
	// wenn überhaupt einträge vorhanden sind
	// sollte nicht passieren, weil eigentlich auch kein button dann da ist,
	// aber...
	if (numberOfEntries > 0) {
		// index heraussuchen, in welcher Zeile gelöscht wurde
		var uzsuTableRowToDelete = parseInt(e.currentTarget.id.substr(15));
		// zwischenspeichern vor dem löschen
		uzsuSaveTable(1, response, designType, valueType, textSelectList, false);
		// erst mal das array entsprechen kürzen
		response.list.splice(uzsuTableRowToDelete, 1);
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuNumberOfRow' + (numberOfEntries - 1)).remove();
		// und daten wieder ausfüllen
		uzsuFillTable(response, designType, valueType, textSelectList);
	}
}

function uzsuSortFunction(a, b) {
	// sort funktion, wirklich vereinfacht für den speziellen fall
	return (a.time.replace(':', '') - b.time.replace(':', ''));
}

function uzsuSortTime(response, designType, valueType, textSelectList, e) {
	// liets erst aus dem widget zurücklesen
	uzsuSaveTable(1, response, designType, valueType, textSelectList, false);
	// sortieren der listeneinträge nach zeit
	response.list.sort(uzsuSortFunction);
	// jetzt noch die einträge wieder schreiben
	uzsuFillTable(response, designType, valueType, textSelectList);
}

function uzsuBuildHelperTime(type) {
	// tabellenzeile einfügen
	var template = '';
	// dann eine neue HTML Zeile genenrieren
	switch (type) {
		case 0: {
			// hier haben wir ein die darstellung fuer normal
			template += "<tr id='uzsuHelperTimeSet'><td><table>";
			template += "<tr><td>Uhrzeit</td></tr>";
			template += "<td><input type='time' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuHelperTimeCron'</td>";
			template += "</tr></table></td></tr>";
			break;
		}
		case 1: {
			// hier die darstellung fuer die darstellung mit sunrise
			template += "<tr id='uzsuHelperTimeSet'><td><table>";
			template += "<tr><td>nicht vor</td>";
			template += "<td></td><td>Zeit</td>";
			template += "<td>Offset</td>";
			template += "<td></td><td></td>";
			template += "<td>nicht nach</td></tr>";
			template += "<td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeMin'</td>";
			template += "<td> <h1 style='margin:0'> < </h1> </td> <td><input type='text' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeCron'</td>";
			template += "<td><input type='number' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuHelperTimeOffset'</td>";
			template += "<td> Minuten</td><td> <h1 style='margin:0'> < </h1> </td>";
			template += "<td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeMax'</td>";
			template += "</tr></table></td></tr>";
			break;
		}
		case 2: {
			// hier die darstellung mit sunset style = 'width:60px'
			// hier die darstellung fuer die darstellung mit sunrise
			template += "<tr id='uzsuHelperTimeSet'><td><table>";
			template += "<tr><td>nicht vor</td>";
			template += "<td></td><td>Zeit</td>";
			template += "<td>Offset</td>";
			template += "<td></td><td></td>";
			template += "<td>nicht nach</td></tr>";
			template += "<td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeMin'</td>";
			template += "<td> <h1 style='margin:0'> < </h1> </td><td><input type='text' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeCron'</td>";
			template += "<td><input type='number' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuHelperTimeOffset'</td>";
			template += "<td> Minuten</td><td> <h1 style='margin:0'> < </h1> </td>";
			template += "<td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuHelperTimeMax'</td>";
			template += "</tr></table></td></tr>";
			break;
		}
	}
	return template;
}

function uzsuAddHelperTime(type) {
	// tabellenzeile einfügen
	var template = '';
	// dann eine neue HTML Zeile genenrieren
	template = uzsuBuildHelperTime(type);
	// zeile in die Tabelle einbauen
	$('#uzsuTableHelperTime').append(template);
	// hier wichtig: damit die optimierung jquerymobile auf tabelle wirkt
	$.mobile.activePage.trigger('pagecreate');
}

function uzsuDelHelperTime() {
	// tabellenzeile löschen
	if ($('#uzsuHelperTimeSet')) {
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuHelperTimeSet').remove();
	}
}

function uzsuHelperSave(uzsuTableRowCalled){
	// werte zwischenspeichern
	helperTimeMin = $('#uzsuHelperTimeMin').val();
	helperTimeOffset = parseInt($('#uzsuHelperTimeOffset').val());
	helperTimeMax = $('#uzsuHelperTimeMax').val();
	helperTimeCron = $('#uzsuHelperTimeCron').val();
	// zeitstring wieder zusammenbauen
	helperTimeString = '';
	if(helperTimeMin.length >0){
		helperTimeString = helperTimeString + helperTimeMin + '<';
	}
	helperTimeString += helperTimeCron;
	if(helperTimeOffset>0){
		helperTimeString = helperTimeString + '+' + helperTimeOffset + 'm';
	}
	else if(helperTimeOffset<0){
		helperTimeString = helperTimeString + helperTimeOffset + 'm';
	}
	if(helperTimeMax.length >0){
		helperTimeString = helperTimeString + '<' + helperTimeMax;
	}
	// und in die Tabellezeile des content popup schreiben
	$('#uzsuEntryTime' + uzsuTableRowCalled).val(helperTimeString);
}

function uzsuBuildHelper(uzsuTableRowCalled) {
	// Kopf und überschrift des Popups
	var template = "";
	// hier kommt der popup container mit der beschreibung ein eigenschaften
	template += "<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupHelper' data-dismissible = 'false'>";
	// jetzt der inhalt geklammert mit span
	template += " <span> <div style='text-align:center'><h1>Assistent für Zeile: " + uzsuTableRowCalled + "</h1></div>";
	template += "<table id='uzsuTableHelperWeek' style = 'border: 1px solid;padding-right: 3px;padding-left: 3px'>";

	template += "<tr><td><h2>Wochenplan</h2></td></tr>";
	template += "<tr><td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
	template += "<input type='radio' name='uzsuHelperWeek' id='uzsuHelperWeek0' value='0' checked='checked'><label for='uzsuHelperWeek0' style='width:100px'>Jeden Tag</label>";
	template += "<input type='radio' name='uzsuHelperWeek' id='uzsuHelperWeek1' value='1'><label for='uzsuHelperWeek1' style='width:100px'>Werktags</label>";
	template += "<input type='radio' name='uzsuHelperWeek' id='uzsuHelperWeek2' value='2'><label for='uzsuHelperWeek2' style='width:100px'>Wochenende</label>";
	template += "<input type='radio' name='uzsuHelperWeek' id='uzsuHelperWeek3' value='3'><label for='uzsuHelperWeek3' style='width:100px'>Individuell</label>";
	template += "</fieldset></form></td></tr></table>";

	template += "<table id='uzsuTableHelperTime' style = 'border: 1px solid;padding-right: 3px;padding-left: 3px'>";
	template += "<tr><td><h2>Uhrzeiten</h2></td></tr>";
	template += "<tr><td><form><fieldset id='uzsuHelperTime' data-role='controlgroup' data-type='horizontal' data-mini='true'>";
	template += "<input type='radio' name='uzsuHelperTime' id='uzsuHelperTime0' value='0' checked='checked'><label for='uzsuHelperTime0' style='width:134px'>Normal</label>";
	template += "<input type='radio' name='uzsuHelperTime' id='uzsuHelperTime1' value='1'><label for='uzsuHelperTime1' style='width:134px'>Sunrise</label>";
	template += "<input type='radio' name='uzsuHelperTime' id='uzsuHelperTime2' value='2'><label for='uzsuHelperTime2' style='width:133px'>Sunset</label>";
	template += "</fieldset></form></td></tr></table>";

	template += "<table><td> <div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>";
	template += "<div data-role = 'button' id = 'uzsuPopupHelperCancel'> Cancel </div>";
	template += "<div data-role = 'button' id = 'uzsuPopupHelperSaveQuit'> Save&Quit </div></div>";

	template += "</span></div>";

	return template; 
}

function uzsuHelperTimeChange(type) {
	// es erfolgt der tausch der Zeiteingabezeile
	// werte zwischenspeichern
	helperTimeMin = $('#uzsuHelperTimeMin').val();
	helperTimeOffset = parseInt($('#uzsuHelperTimeOffset').val());
	helperTimeMax = $('#uzsuHelperTimeMax').val();
	helperTimeCron = $('#uzsuHelperTimeCron').val();
	// alter eingabezeile löschen
	uzsuDelHelperTime();
	// neue aufbauen
	uzsuAddHelperTime(type);
	// werte zuweisen
	if(type==1){
		helperTimeCron = 'sunrise';
	}
	else if(type==2){
		helperTimeCron = 'sunset';
	}
    $('#uzsuHelperTimeMin').val(helperTimeMin);
    $('#uzsuHelperTimeOffset').val(helperTimeOffset);
    $('#uzsuHelperTimeMax').val(helperTimeMax);
    $('#uzsuHelperTimeCron').val(helperTimeCron);

}

function switchToPopupHelper(e) {
	// schliesst das Content popup und öffnet das Helper Popup
	var uzsuTableRowCalled = parseInt(e.currentTarget.id.substr(15));
	// jetzt die helper Seite als eigenständiges Popup
	// dieses Popup wird im Wechsel zum Standard Popup angezeigt
	template = uzsuBuildHelper(uzsuTableRowCalled);
	$.mobile.activePage.append(template).trigger("pagecreate");

	// und jetzt noch die callback funtion dazu
	$('#uzsuHelperTime input[type=radio]').on('change', function(e) {
		// event um beim ändern der radio buttons den wert des ermittelten buttons für den typ herauszufinden
		// damit wird dann die eingabezeile entsprechend des typs neu aufgebaut
		uzsuHelperTimeChange(parseInt($(this).val()));
	});
	// switch popup back to main without changes
	$.mobile.activePage.find("#uzsuPopupHelperCancel").bind("tap", function(e) {
		switchToPopupContent();
	});
	// switch popup back to main with storing the changes
	$.mobile.activePage.find("#uzsuPopupHelperSaveQuit").bind("tap", function(e) {
		uzsuHelperSave(uzsuTableRowCalled);
		switchToPopupContent();
	});
	// und der wechsel auf das Helper Popup
	$("#uzsuPopupContent").bind("popupafterclose", function() {
		$("#uzsuPopupHelper").popup("open");
	}).popup("close");
	// default zeiteingabe, jetzt sollte geparsed werden, wie die aktuelle einstellung aussieht
	// um die richtige auswahl zu treffen
	// Erst die Tage für den Wochenplan (aus der rrule)
	
	// dann die Zeiten aus aus time
	// basieren auf dem algorithmus im uzsu plugin bzw. crontab implementierung
	helperTimeString = $('#uzsuEntryTime' + uzsuTableRowCalled).val();
    tabsTime = helperTimeString.split('<');
    if(tabsTime.length == 1){
        helperTimeMin = '';
        helperTimeCron = tabsTime[0].trim();
        helperTimeMax = '';
        type = 0; 
    }
    else if(tabsTime.length == 2){
        if(tabsTime[0].indexOf('sunrise')===0){
        	helperTimeMin = '';
        	helperTimeCron = 'sunrise';
            helperTimeMax = tabsTime[1].trim();
            type = 1;
        }
        else if(tabsTime[0].indexOf('sunset')===0){
        	helperTimeMin = '';
        	helperTimeCron = 'sunset';
            helperTimeMax = tabsTime[1].trim();
            type = 2;
        }
        else{
        	helperTimeMin = tabsTime[0].trim();
            helperTimeMax = '';
            if(helperTimeCron.indexOf('sunrise')===0){
            	type = 1;
            	helperTimeCron = 'sunrise';
            }
            else{
            	type = 2;
            	helperTimeCron = 'sunset';
            }
        }
    }
    else if(tabsTime.length == 3){
    	helperTimeMin = tabsTime[0].trim();
    	helperTimeCron = tabsTime[1].trim();
        helperTimeMax = tabsTime[2].trim();
        if(helperTimeCron.indexOf('sunrise')===0){
        	type = 1;
        	helperTimeCron = 'sunrise';
        }
        else{
        	type = 2;
        	helperTimeCron = 'sunset';
        }
    }
    else{
    	// formatfehler ! ich nehme dann defaulteinstellung an
    	type = 0;
    	helperTimeMin = '';
    	helperTimeCron = '00:00';
    	helperTimeMax = '';
    }
    // nun noch der offset herausnehmen
    tabsOffset = helperTimeString.split('+');
    if(tabsOffset.length == 2){
    	// dann steht ein plus drin
    	tabsOffset = tabsOffset[1].split('m');
    	helperTimeOffset = '+' + tabsOffset[0].trim();
    }
    tabsOffset = helperTimeString.split('-');
    if(tabsOffset.length == 2){
    	// dann steht ein minus drin
    	tabsOffset = tabsOffset[1].split('m');
    	helperTimeOffset = '-' + tabsOffset[0].trim();
    }
	// und die richtige Formatauswahl setzen
	uzsuAddHelperTime(type);
	// dann die Values darin setzen
    $('#uzsuHelperTimeMin').val(helperTimeMin);
    $('#uzsuHelperTimeOffset').val(parseInt(helperTimeOffset));
    $('#uzsuHelperTimeMax').val(helperTimeMax);
    $('#uzsuHelperTimeCron').val(helperTimeCron);
    // und die radio checkbox richtig, ich setze das, was ich will
    $('#uzsuHelperTime input[type=radio]').filter( '[value="' + type + '"]' ).prop( 'checked', true );
    // mache aber einen refresh auf alle items (damit die nicht gesetzten auch zurückgesetzt werden)
    $('#uzsuHelperTime input[type=radio]').checkboxradio( 'refresh' );
}

function switchToPopupContent() {
	// schliesst das Helper Popup und öffnet iweder das Content Popup
	$("#uzsuPopupHelper").bind("popupafterclose" , function() {
		$("#uzsuPopupContent").popup("open");
		$("#uzsuPopupHelper").remove();
	}).popup("close");
}

function runtimeUzsuPopup(response, headline, designType, valueType,
		textSelectList, item) {
	// steuerung des Popups
	// erst einmal wird der leeranteil angelegt
	var template = uzsuBuildTable(response, headline, designType, valueType,
			textSelectList);
	// dann speichern wir uns für cancel die ursprünglichen werte ab
	var responseCancel = jQuery.extend(true, {}, response);
	// dann hängen wir das an die aktuelle Seite
	$.mobile.activePage.append(template).trigger("pagecreate");
	// dann die werte eintragen.
	uzsuFillTable(response, designType, valueType, textSelectList);
	// Popup schliessen mit close rechts oben in der box
	$.mobile.activePage.find("#uzsuClose").bind("tap", function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im
		// cache die alten werte
		$.mobile.activePage.find("#uzsuPopupContent").popup("close").remove();
	});
	// Popup schliessen mit Cancel in der Leiste
	$.mobile.activePage.find("#uzsuCancel").bind("tap", function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im
		// cache die alten werte
		$.mobile.activePage.find("#uzsuPopupContent").popup("close").remove();
	});
	// speichern mit SaveQuit
	$.mobile.activePage.find("#uzsuSaveQuit").bind("tap", function(e) {
		// jetzt wird die Kopie auf das original kopiert
		// und geschlossen
		uzsuSaveTable(item, response, designType, valueType, textSelectList, true);
		$.mobile.activePage.find("#uzsuPopupContent").popup("close").remove();
	});
	// eintrag hinzufügen mit add
	$.mobile.activePage.find("#uzsuAddTableRow").bind("tap", function(e) {
		uzsuAddTableRow(response, designType, valueType, textSelectList);
	});
	// eintrag sortieren nach zeit
	$.mobile.activePage.find("#uzsuSortTime").bind("tap", function(e) {
		uzsuSortTime(response, designType, valueType, textSelectList);
	});
	// löschen mit del als callback eintragen
	for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
		$.mobile.activePage.find("#uzsuDelTableRow" + numberOfRow).bind("tap",function(e) {
			uzsuDelTableRow(response, designType, valueType, textSelectList, e);
		});
		// switch popup to helper
		$.mobile.activePage.find("#uzsuTableHelper"+ numberOfRow).bind("tap", function(e) {
			switchToPopupHelper(e);
		});
	}
	// hier wir die aktuelle seite danach durchsucht, wo das popup ist
	// und im folgenden das popup initialisiert, geöffnet und die schliessen
	// funktion daran gebunden. diese entfern wieder das popup aus dem baum
	$.mobile.activePage.find("#uzsuPopupContent").popup("open").bind({
		popupafterclose : function() {
			// / warum ich eine leer funkton brauch, habe ich noch nicht
			// verstanden. ohen diese bekomme ich kein popup
		}
	});
}

$(document).on("update",'[data-widget="uzsu.uzsu_icon"]',function(event, response) {
			// initialisierung
			// zunächst wird festgestellt, ob Item mit Eigenschaft vorhanden.
			// Wenn nicht: active = false
			// ansonsten ist der Status von active gleich dem gesetzten Status
			var active = response.length > 0 ? response[0].active : false;
			// Das Icon wird aktiviert, falls Status auf aktiv, ansonsten
			// deaktiviert angezeigt
			$('#' + this.id + ' img').attr('src',(active ? $(this).attr('data-pic-on') : $(this).attr('data-pic-off')));
			// wenn keine Daten vorhanden, dann ist kein item mit den
			// eigenschaften hinterlegt
			// und es wird nichts gemacht
			if (response.length === 0)
				return;
			// Wenn ein Update erfolgt, dann werden die Daten erneut in die
			// Variable uzsu geladen
			// damit sind die UZSU objekte auch in der click funktion verfügbar
			if (response[0].list instanceof Array) {
				$(this).data('uzsu', response[0]);
			} 
			else {$(this).data('uzsu', {active : true,list : []	});
			}
		});
// als zweites der handler für die callbacks des click events
// kann man auch zusammen machen, habe ich aus übersichtlichkeit getrennt
$(document).on("click",'[data-widget="uzsu.uzsu_icon"]',function(event) {
	// hier werden die parameter aus den attributen
	// herausgenommen
	// und beim öffnen mit .open(....) an das popup objekt
	// übergeben
	// und zwar mit deep copy, damit ich bei cancel die
	// ursprünglichen werte nicht überschrieben habe
	var response = jQuery.extend(true, {}, $(this).data('uzsu'));
	// auswertung der übergabeparameter
	var headline = $(this).attr('data-headline');
	var designType = $(this).attr('data-designType');
	var valueType = $(this).attr('data-valueType');
	// hier wird die komplette liste übergeben. widget.explode
	// kehr das implode au der webseite wieder um
	var textSelectList = widget.explode($(this).attr('data-textSelectList'));
	// data-item ist der sh.py item, in dem alle attribute
	// lagern, die für die steuerung notwendig ist
	// ist ja vom typ dict. das item, was tatsächlich per
	// schaltuhr verwendet wird ist nur als attribut (child)
	// enthalten und wird ausschliesslich vom plugin verwendet.
	// wird für das rückschreiben der Daten an smarthome.py
	// benötigt
	var item = $(this).attr('data-item');
	// jetzt kommt noch die liste von prüfungen, damit hinterher
	// keine fehler passieren
	// zunächst erst einmal popup wird angezeigt
	var popupOk = true;
	// fehlerhafter designType (unbekannt)
	if ((designType !== '0') && (designType !== '1') && (designType !== '2')) {
		alert('Fehlerhafter Parameter: "' + designType + '" im Feld designType bei Item ' + item);
		popupOk = false;
	}
	// fehlerhafter valueType (unbekannt)
	if ((valueType !== 'bool') && (valueType !== 'num')	&& (valueType !== 'text') && (valueType !== 'list')) {
		alert('Fehlerhafter Parameter: "' + valueType + '" im Feld valueType bei Item ' + item);
		popupOk = false;
	}
	// bei designType '0' und '2' wird rrule nach wochentagen
	// umgewandelt und ein festes format vogegegebn
	// hier sollte nichts versehentlich überschrieben werden
	if ((designType == '0') || (designType == '2')) {
		var numberOfEntries = response.list.length;
		for (var numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
			// test, ob die RRULE fehlerhaft ist
			if ((response.list[numberOfRow].rrule.indexOf('FREQ=WEEKLY;BYDAY=') !== 0) && (response.list[numberOfRow].rrule.length > 0)) {
				if (!Confirm('Fehler: Parameter designType ist "0", aber gespeicherte RRULE String in UZSU "' + response.list[numberOfRow].rrule + '" entspricht nicht default Format FREQ=WEEKLY;BYDAY=MO... bei Item ' + item	+ '. Soll dieser Eintrag überschrieben werden ?')) {
					// direkter abbruch bei der entscheidung !
					numberOfRow = numberOfEntries;
					popupOk = false;
				}
			}
		}
	}
	// wenn bei designType = 'list' ein split angegeben wird,
	// dann muss er immer angegeben sein
	if ((valueType == 'list') && !(textSelectList[0].split(':')[1] === undefined)) {
		for (var numberOfTextEntries = 0; numberOfTextEntries < textSelectList.length; numberOfTextEntries++) {
			if (textSelectList[numberOfTextEntries].split(':')[1] === undefined) {
				alert('Fehlerhafte Einträge im Parameter textSelectList !');
				popupOk = false;
			}
		}
	}
	if (popupOk) {
		// öffnen des popups bei clicken des icons und
		// ausführung der eingabefunktion
		runtimeUzsuPopup(response, headline, designType, valueType, textSelectList, item);
	}
});
